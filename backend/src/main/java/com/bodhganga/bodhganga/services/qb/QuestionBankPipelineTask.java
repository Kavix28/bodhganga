package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.config.QuestionBankProperties;
import com.bodhganga.bodhganga.entity.qb.QBAudit;
import com.bodhganga.bodhganga.entity.qb.QBImportBatch;
import com.bodhganga.bodhganga.entity.qb.QBImportItem;
import com.bodhganga.bodhganga.entity.qb.QBQuestion;
import com.bodhganga.bodhganga.repo.qb.QBAuditRepo;
import com.bodhganga.bodhganga.repo.qb.QBImportBatchRepo;
import com.bodhganga.bodhganga.repo.qb.QBImportItemRepo;
import com.bodhganga.bodhganga.repo.qb.QBQuestionRepo;
import com.bodhganga.bodhganga.service.*;
import com.bodhganga.bodhganga.services.S3Service;
import com.google.api.services.drive.model.File;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class QuestionBankPipelineTask {

    private static final Logger log = LoggerFactory.getLogger(QuestionBankPipelineTask.class);

    private final QuestionBankProperties props;
    private final QuestionBankDriveService driveService;
    private final QuestionPdfPairingService pairingService;
    private final DocumentExtractionRouter documentExtractionRouter;
    private final QuestionParserService questionParserService;
    private final AnswerParserService answerParserService;
    private final QuestionMatchingService questionMatchingService;
    private final GeminiQuestionParserService geminiParserService;
    private final TestGeneratorService testGeneratorService;
    private final S3Service s3Service;
    private final QBQuestionRepo questionRepo;
    private final QBImportBatchRepo batchRepo;
    private final QBImportItemRepo importItemRepo;
    private final QBAuditRepo auditRepo;
    private final AkolaTextNormalizationFilter akolaTextNormalizationFilter;
    private final DeterministicQuestionClassifier deterministicQuestionClassifier;

    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    @Autowired
    public QuestionBankPipelineTask(QuestionBankProperties props,
            QuestionBankDriveService driveService,
            QuestionPdfPairingService pairingService,
            DocumentExtractionRouter documentExtractionRouter,
            QuestionParserService questionParserService,
            AnswerParserService answerParserService,
            QuestionMatchingService questionMatchingService,
            GeminiQuestionParserService geminiParserService,
            TestGeneratorService testGeneratorService,
            S3Service s3Service,
            QBQuestionRepo questionRepo,
            QBImportBatchRepo batchRepo,
            QBImportItemRepo importItemRepo,
            QBAuditRepo auditRepo,
            AkolaTextNormalizationFilter akolaTextNormalizationFilter,
            DeterministicQuestionClassifier deterministicQuestionClassifier) {
        this.props = props;
        this.driveService = driveService;
        this.pairingService = pairingService;
        this.documentExtractionRouter = documentExtractionRouter;
        this.questionParserService = questionParserService;
        this.answerParserService = answerParserService;
        this.questionMatchingService = questionMatchingService;
        this.geminiParserService = geminiParserService;
        this.testGeneratorService = testGeneratorService;
        this.s3Service = s3Service;
        this.questionRepo = questionRepo;
        this.batchRepo = batchRepo;
        this.importItemRepo = importItemRepo;
        this.auditRepo = auditRepo;
        this.akolaTextNormalizationFilter = akolaTextNormalizationFilter;
        this.deterministicQuestionClassifier = deterministicQuestionClassifier;
    }

    public QuestionBankPipelineTask(QuestionBankProperties props,
            QuestionBankDriveService driveService,
            QuestionPdfPairingService pairingService,
            DocumentExtractionRouter documentExtractionRouter,
            QuestionParserService questionParserService,
            AnswerParserService answerParserService,
            QuestionMatchingService questionMatchingService,
            GeminiQuestionParserService geminiParserService,
            TestGeneratorService testGeneratorService,
            S3Service s3Service,
            QBQuestionRepo questionRepo,
            QBImportBatchRepo batchRepo,
            QBImportItemRepo importItemRepo,
            QBAuditRepo auditRepo) {
        this(props, driveService, pairingService, documentExtractionRouter, questionParserService,
                answerParserService, questionMatchingService, geminiParserService, testGeneratorService,
                s3Service, questionRepo, batchRepo, importItemRepo, auditRepo,
                new AkolaTextNormalizationFilter(), new DeterministicQuestionClassifier());
    }

    @Scheduled(fixedDelayString = "${google.drive.qb.sync-interval-ms:${QB_SYNC_INTERVAL_MS:600000}}")
    public void scheduledSync() {
        if (!isPipelineEnabled()) {
            log.info("[QB PIPELINE] Scheduled sync skipped — google.drive.qb.pipeline.enabled=false.");
            return;
        }
        syncQuestionBank(false);
    }

    public boolean isPipelineEnabled() {
        return props.isPipelineEnabled();
    }

    public static class PipelineRunResult {
        private final String status; // NO_ELIGIBLE_FILES, COMPLETED, PARTIAL_SUCCESS, FAILED
        private final String message;
        private final int totalBatches;
        private final int successfulBatches;
        private final int totalQuestionsIngested;

        public PipelineRunResult(String status, String message, int totalBatches, int successfulBatches,
                int totalQuestionsIngested) {
            this.status = status;
            this.message = message;
            this.totalBatches = totalBatches;
            this.successfulBatches = successfulBatches;
            this.totalQuestionsIngested = totalQuestionsIngested;
        }

        public String getStatus() {
            return status;
        }

        public String getMessage() {
            return message;
        }

        public int getTotalBatches() {
            return totalBatches;
        }

        public int getSuccessfulBatches() {
            return successfulBatches;
        }

        public int getTotalQuestionsIngested() {
            return totalQuestionsIngested;
        }
    }

    public PipelineRunResult syncQuestionBank(boolean force) {
        if (!isRunning.compareAndSet(false, true)) {
            String msg = "[QB PIPELINE] Pipeline is already running — skipping concurrent trigger.";
            log.warn(msg);
            if (force)
                throw new IllegalStateException(msg);
            return new PipelineRunResult("SKIPPED", msg, 0, 0, 0);
        }

        try {
            // Stage 0: Stale Batch Recovery (Run ALWAYS, even if Drive credentials fail, so
            // stale MongoDB batches are recovered)
            recoverStaleBatches();

            if (!driveService.isConfigured()) {
                String msg = "[QB PIPELINE] QB Drive client is not configured — check QB credentials.";
                log.error(msg);
                if (force)
                    throw new IllegalStateException(msg);
                return new PipelineRunResult("FAILED", msg, 0, 0, 0);
            }

            String sourceFolderId = props.getSourceFolderId();
            if (sourceFolderId == null || sourceFolderId.isBlank()
                    || sourceFolderId.equalsIgnoreCase("REPLACE_WITH_SOURCE_FOLDER_ID")) {
                String msg = "[QB PIPELINE] google.drive.qb.source-folder-id is not set.";
                log.error(msg);
                if (force)
                    throw new IllegalStateException(msg);
                return new PipelineRunResult("FAILED", msg, 0, 0, 0);
            }

            long startTime = System.currentTimeMillis();
            log.info("========== QB SYNC START ==========");
            log.info("[QB PIPELINE] Checking Drive... Source Folder: {}", sourceFolderId);

            // Stage 1: Traverse Drive
            List<Map.Entry<File, List<String>>> allDiscoveredItems = new ArrayList<>();
            traverseDriveFolder(sourceFolderId, new ArrayList<>(), allDiscoveredItems);

            // Stage 2: Pair PDFs & Log Discovery Metrics
            QuestionPdfPairingService.PairingResult pairingResult = pairingService.pairDiscoveredFiles(sourceFolderId,
                    allDiscoveredItems);

            if (pairingResult.getPairs().isEmpty() || pairingResult.getTotalPdfsDiscovered() == 0) {
                log.info("[QB PIPELINE] Scan complete. Status: NO_ELIGIBLE_FILES (0 eligible PDF pairs found).");
                log.info("========== QB SYNC END (NO_ELIGIBLE_FILES) ==========");
                return new PipelineRunResult("NO_ELIGIBLE_FILES", "Scan complete: 0 eligible PDF pairs found", 0, 0, 0);
            }

            // Stage 3: Process Paired PDF Batches
            String archiveFolderId = props.getArchiveFolderId();
            if (archiveFolderId != null && archiveFolderId.equalsIgnoreCase("REPLACE_WITH_ARCHIVE_FOLDER_ID")) {
                archiveFolderId = null;
            }

            int processedBatches = 0;
            int successfulBatches = 0;
            int totalIngested = 0;

            for (QuestionPdfPairingService.PdfPair pair : pairingResult.getPairs()) {
                processedBatches++;
                try {
                    QBImportBatch batch = processPdfPair(pair, archiveFolderId);
                    if ("COMPLETED".equalsIgnoreCase(batch.getStatus())
                            || "PARTIAL_SUCCESS".equalsIgnoreCase(batch.getStatus())) {
                        successfulBatches++;
                        totalIngested += (batch.getSuccessfullyMatched() != null ? batch.getSuccessfullyMatched() : 0);
                    }
                } catch (Exception e) {
                    log.error("[QB PIPELINE] Failed processing PDF pair for {}/{}: {}", pair.getState(),
                            pair.getDistrict(), e.getMessage(), e);
                }
            }

            long duration = System.currentTimeMillis() - startTime;
            String finalStatus = successfulBatches == processedBatches ? "COMPLETED" : "PARTIAL_SUCCESS";
            log.info("[QB PIPELINE] Sync finished in {} ms. Status: {}, Batches: {}/{}, Questions Ingested: {}",
                    duration, finalStatus, successfulBatches, processedBatches, totalIngested);
            log.info("========== QB SYNC END ==========");

            return new PipelineRunResult(finalStatus, "Pipeline sync completed successfully", processedBatches,
                    successfulBatches, totalIngested);

        } catch (Exception e) {
            log.error("[QB PIPELINE] Critical pipeline failure: {}", e.getMessage(), e);
            log.info("========== QB SYNC END (FAILED) ==========");
            return new PipelineRunResult("FAILED", "Pipeline failure: " + e.getMessage(), 0, 0, 0);
        } finally {
            isRunning.set(false);
        }
    }

    public void recoverStaleBatches() {
        List<String> nonTerminalStatuses = List.of(
                "DISCOVERED", "DOWNLOADING", "PARSING", "MATCHING", "VALIDATING", "PERSISTING", "GENERATING_TESTS");

        long staleTimeoutMs = props.getSyncIntervalMs() > 0 ? (props.getSyncIntervalMs() * 2) : 900000L; // 15 mins
                                                                                                         // default
        Date cutoffTime = new Date(System.currentTimeMillis() - staleTimeoutMs);

        List<QBImportBatch> staleBatches = batchRepo.findByStatusIn(nonTerminalStatuses);

        for (QBImportBatch batch : staleBatches) {
            if (batch.getUpdatedAt() != null && batch.getUpdatedAt().before(cutoffTime)) {
                String stuckStage = batch.getStatus();
                log.warn(
                        "[QB STALE RECOVERY] Recovering stale batch {} (state: {}, district: {}) stuck in status '{}' since {}",
                        batch.getImportBatchId(), batch.getState(), batch.getDistrict(), stuckStage,
                        batch.getUpdatedAt());

                batch.setStatus("FAILED");
                batch.setErrorMessage("Stale batch recovered: timed out during stage " + stuckStage);
                batch.setUpdatedAt(new Date());
                batchRepo.save(batch);

                QBAudit audit = new QBAudit();
                audit.setFileName(batch.getQuestionFileName() != null ? batch.getQuestionFileName() : "Unknown");
                audit.setGoogleDriveFileId(
                        batch.getQuestionDriveFileId() != null ? batch.getQuestionDriveFileId() : "Unknown");
                audit.setStatus("FAILED");
                audit.setErrorMessage(batch.getErrorMessage());
                auditRepo.save(audit);
            }
        }
    }

    private void traverseDriveFolder(String folderId, List<String> path,
            List<Map.Entry<File, List<String>>> accumulator) throws Exception {
        List<File> items = driveService.listFilesInFolder(folderId);
        if (items == null || items.isEmpty())
            return;

        for (File item : items) {
            accumulator.add(Map.entry(item, new ArrayList<>(path)));
            if ("application/vnd.google-apps.folder".equals(item.getMimeType())) {
                List<String> nextPath = new ArrayList<>(path);
                nextPath.add(item.getName());
                traverseDriveFolder(item.getId(), nextPath, accumulator);
            }
        }
    }

    private TextNormalizationFilter resolveNormalizationFilter(String districtSlug) {
        if ("akola".equalsIgnoreCase(districtSlug) && akolaTextNormalizationFilter != null) {
            return akolaTextNormalizationFilter;
        }
        return null;
    }

    public QBImportBatch processSingleBatch(String importBatchId, boolean force) throws Exception {
        Optional<QBImportBatch> opt = batchRepo.findByImportBatchId(importBatchId);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Import batch not found: " + importBatchId);
        }
        QBImportBatch batch = opt.get();
        if (("COMPLETED".equalsIgnoreCase(batch.getStatus()) || "PARTIAL_SUCCESS".equalsIgnoreCase(batch.getStatus()))
                && !force) {
            throw new IllegalStateException("Batch " + importBatchId + " is already terminal (" + batch.getStatus()
                    + "). Use force=true to force re-execution.");
        }

        File qFile;
        File sFile;
        if (driveService != null && driveService.isConfigured()) {
            try {
                qFile = driveService.getFile(batch.getQuestionDriveFileId());
                if (qFile == null) {
                    qFile = new File().setId(batch.getQuestionDriveFileId())
                            .setName(batch.getQuestionFileName() != null ? batch.getQuestionFileName() : "Question.pdf")
                            .setMimeType("application/pdf");
                }
                sFile = batch.getSolutionDriveFileId() != null
                        && !batch.getSolutionDriveFileId().equalsIgnoreCase(batch.getQuestionDriveFileId())
                                ? driveService.getFile(batch.getSolutionDriveFileId())
                                : qFile;
                if (sFile == null) {
                    sFile = new File()
                            .setId(batch.getSolutionDriveFileId() != null ? batch.getSolutionDriveFileId()
                                    : batch.getQuestionDriveFileId())
                            .setName(batch.getSolutionFileName() != null ? batch.getSolutionFileName() : "Solution.pdf")
                            .setMimeType("application/pdf");
                }
            } catch (Exception e) {
                qFile = new File().setId(batch.getQuestionDriveFileId())
                        .setName(batch.getQuestionFileName() != null ? batch.getQuestionFileName() : "Question.pdf")
                        .setMimeType("application/pdf");
                sFile = new File()
                        .setId(batch.getSolutionDriveFileId() != null ? batch.getSolutionDriveFileId()
                                : batch.getQuestionDriveFileId())
                        .setName(batch.getSolutionFileName() != null ? batch.getSolutionFileName() : "Solution.pdf")
                        .setMimeType("application/pdf");
            }
        } else {
            qFile = new File().setId(batch.getQuestionDriveFileId())
                    .setName(batch.getQuestionFileName() != null ? batch.getQuestionFileName() : "Question.pdf")
                    .setMimeType("application/pdf");
            sFile = new File()
                    .setId(batch.getSolutionDriveFileId() != null ? batch.getSolutionDriveFileId()
                            : batch.getQuestionDriveFileId())
                    .setName(batch.getSolutionFileName() != null ? batch.getSolutionFileName() : "Solution.pdf")
                    .setMimeType("application/pdf");
        }

        QuestionPdfPairingService.PdfPair pair = new QuestionPdfPairingService.PdfPair(
                batch.getState() != null ? batch.getState() : "Maharashtra",
                batch.getStateSlug() != null ? batch.getStateSlug() : "maharashtra",
                batch.getDistrict() != null ? batch.getDistrict() : "Akola",
                batch.getDistrictSlug() != null ? batch.getDistrictSlug() : "akola",
                qFile, sFile, "PAIRED");

        return processPdfPair(pair, props.getArchiveFolderId(), batch, force);
    }

    public QBImportBatch processPdfPair(QuestionPdfPairingService.PdfPair pair, String archiveFolderId)
            throws Exception {
        return processPdfPair(pair, archiveFolderId, null, false);
    }

    public QBImportBatch processPdfPair(QuestionPdfPairingService.PdfPair pair, String archiveFolderId,
            QBImportBatch existingBatch, boolean force)
            throws Exception {
        File qFile = pair.getQuestionFile();
        File sFile = pair.getSolutionFile();

        String qDriveId = qFile != null ? qFile.getId() : "MISSING";
        String sDriveId = sFile != null ? sFile.getId() : (qFile != null ? qFile.getId() : "MISSING");

        QBImportBatch batch;
        if (existingBatch != null) {
            batch = existingBatch;
        } else {
            Optional<QBImportBatch> existingBatchOpt = batchRepo
                    .findByQuestionDriveFileIdAndSolutionDriveFileId(qDriveId, sDriveId);
            if (existingBatchOpt.isPresent()) {
                batch = existingBatchOpt.get();
                if (("COMPLETED".equalsIgnoreCase(batch.getStatus())
                        || "PARTIAL_SUCCESS".equalsIgnoreCase(batch.getStatus())) && !force) {
                    log.info("[QB PIPELINE] Batch {} already completed for file pair ({}, {}). Skipping.",
                            batch.getImportBatchId(), qDriveId, sDriveId);
                    return batch;
                }
            } else {
                batch = new QBImportBatch();
                batch.setImportBatchId("BATCH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                batch.setQuestionDriveFileId(qDriveId);
                batch.setQuestionFileName(qFile != null ? qFile.getName() : "MISSING");
                batch.setSolutionDriveFileId(sDriveId);
                batch.setSolutionFileName(sFile != null ? sFile.getName() : "MISSING");
                batch.setCreatedAt(new Date());
            }
        }

        batch.setState(pair.getState());
        batch.setStateSlug(pair.getStateSlug());
        batch.setDistrict(pair.getDistrict());
        batch.setDistrictSlug(pair.getDistrictSlug());
        batch.setExam(pair.getDistrict());
        batch.setExamSlug(pair.getDistrictSlug());
        batch.setSubject("General Knowledge");
        batch.setSubjectSlug("general-knowledge");
        batch.setStartedAt(new Date());
        batch.setUpdatedAt(new Date());

        if ("AMBIGUOUS".equalsIgnoreCase(pair.getStatus()) || qFile == null) {
            batch.setStatus("AMBIGUOUS");
            batch.setCurrentStage("PAIRING");
            batch.setErrorMessage(
                    "Ambiguous PDF pairing in drive folder: " + pair.getState() + "/" + pair.getDistrict());
            batch.setAmbiguousQuestions(1);
            batch.setUpdatedAt(new Date());
            return batchRepo.save(batch);
        }

        QBAudit audit = new QBAudit();
        audit.setFileName(qFile.getName());
        audit.setGoogleDriveFileId(qFile.getId());

        try {
            // Stage: DOWNLOADING
            log.info("[QB PIPELINE] Batch {} [{}/{}] -> Stage: DOWNLOADING", batch.getImportBatchId(), pair.getState(),
                    pair.getDistrict());
            batch.setStatus("DOWNLOADING");
            batch.setCurrentStage("DOWNLOADING");
            batch.setUpdatedAt(new Date());
            batch = batchRepo.save(batch);

            byte[] qBytes = downloadBytes(qFile);
            if (qBytes == null || qBytes.length == 0) {
                String msg = "Zero bytes downloaded for question PDF: " + qFile.getName();
                log.error("[QB PIPELINE] Batch {} FAILED during DOWNLOADING: {}", batch.getImportBatchId(), msg);
                batch.setStatus("FAILED");
                batch.setCurrentStage("DOWNLOADING");
                batch.setErrorMessage(msg);
                batch.setUpdatedAt(new Date());
                return batchRepo.save(batch);
            }

            byte[] aBytes = (sFile != null && !sFile.getId().equals(qFile.getId())) ? downloadBytes(sFile) : qBytes;
            if (aBytes == null || aBytes.length == 0) {
                String msg = "Zero bytes downloaded for solution PDF: "
                        + (sFile != null ? sFile.getName() : qFile.getName());
                log.error("[QB PIPELINE] Batch {} FAILED during DOWNLOADING: {}", batch.getImportBatchId(), msg);
                batch.setStatus("FAILED");
                batch.setCurrentStage("DOWNLOADING");
                batch.setErrorMessage(msg);
                batch.setUpdatedAt(new Date());
                return batchRepo.save(batch);
            }

            // Upload Question PDF to S3
            String s3Key = String.format("question-bank/%s/%s/%s", pair.getStateSlug(), pair.getDistrictSlug(),
                    qFile.getName());
            try (InputStream is = new java.io.ByteArrayInputStream(qBytes)) {
                s3Key = s3Service.uploadFileWithKey(is, (long) qBytes.length, s3Key, "application/pdf");
            } catch (Exception s3Ex) {
                log.warn("[QB PIPELINE] S3 upload warning for {}: {}", qFile.getName(), s3Ex.getMessage());
            }
            audit.setS3Key(s3Key);

            // Stage: OCR_EXTRACTION
            log.info("[QB PIPELINE] Batch {} [{}/{}] -> Stage: OCR_EXTRACTION", batch.getImportBatchId(),
                    pair.getState(), pair.getDistrict());
            batch.setStatus("PARSING");
            batch.setCurrentStage("OCR_EXTRACTION");
            batch.setUpdatedAt(new Date());
            batchRepo.save(batch);

            DocumentExtractionRouter.ExtractionResult qExtract = documentExtractionRouter.routeAndExtract(qBytes);
            DocumentExtractionRouter.ExtractionResult aExtract = documentExtractionRouter.routeAndExtract(aBytes);

            List<String> qPages = qExtract != null ? qExtract.getPageTexts() : null;
            List<String> aPages = aExtract != null ? aExtract.getPageTexts() : null;

            int qTextLen = (qPages != null) ? qPages.stream().mapToInt(String::length).sum() : 0;
            if (qExtract == null || qPages == null || qTextLen == 0) {
                String msg = "Zero text extracted via OCR from question PDF: " + qFile.getName();
                log.error("[QB PIPELINE] Batch {} FAILED during OCR_EXTRACTION: {}", batch.getImportBatchId(), msg);
                batch.setStatus("FAILED");
                batch.setCurrentStage("OCR_EXTRACTION");
                batch.setErrorMessage(msg);
                batch.setUpdatedAt(new Date());
                return batchRepo.save(batch);
            }

            int aTextLen = (aPages != null) ? aPages.stream().mapToInt(String::length).sum() : 0;
            if (aExtract == null || aPages == null || aTextLen == 0) {
                String msg = "Zero text extracted via OCR from solution PDF: "
                        + (sFile != null ? sFile.getName() : qFile.getName());
                log.error("[QB PIPELINE] Batch {} FAILED during OCR_EXTRACTION: {}", batch.getImportBatchId(), msg);
                batch.setStatus("FAILED");
                batch.setCurrentStage("OCR_EXTRACTION");
                batch.setErrorMessage(msg);
                batch.setUpdatedAt(new Date());
                return batchRepo.save(batch);
            }

            TextNormalizationFilter normFilter = resolveNormalizationFilter(pair.getDistrictSlug());

            // Stage: QUESTION_PARSING
            batch.setCurrentStage("QUESTION_PARSING");
            List<QuestionParserService.ParsedQuestion> parsedQs = questionParserService.parseQuestionsFromPages(qPages,
                    normFilter);

            if (deterministicQuestionClassifier != null) {
                for (QuestionParserService.ParsedQuestion pq : parsedQs) {
                    DeterministicQuestionClassifier.QuestionClassification cls = deterministicQuestionClassifier
                            .classifyQuestion(pq.getQuestionText(), pq.getOptions(), pq.getLevel());
                    if (cls.getClassification() == DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED) {
                        pq.setLevel("upsc-level");
                    } else if (cls
                            .getClassification() == DeterministicQuestionClassifier.ClassificationResult.FOUNDATION) {
                        pq.setLevel("foundation");
                    } else if (cls
                            .getClassification() == DeterministicQuestionClassifier.ClassificationResult.REVIEW_REQUIRED) {
                        pq.setSuspicious(true);
                        pq.setWarningReason(
                                pq.getWarningReason() != null ? pq.getWarningReason() + "; " + cls.getReason()
                                        : cls.getReason());
                    }
                }
            }

            // Fallback to Gemini if deterministic parser extracted 0 questions
            if (parsedQs.isEmpty() && qTextLen > 50) {
                log.info(
                        "[QB PIPELINE] Deterministic parser yielded 0 questions for {}. Retrying with Gemini LLM parser...",
                        qFile.getName());
                String combinedText = String.join("\n", qPages);
                List<QBQuestion> geminiQuestions = geminiParserService.parseQuestionsFromText(
                        combinedText, pair.getState(), pair.getStateSlug(), pair.getDistrict(), pair.getDistrictSlug(),
                        "General Knowledge", "general-knowledge", qFile.getId(), s3Key);

                for (int i = 0; i < geminiQuestions.size(); i++) {
                    QBQuestion gq = geminiQuestions.get(i);
                    QuestionParserService.ParsedQuestion pq = new QuestionParserService.ParsedQuestion();
                    pq.setQuestionNumber(i + 1);
                    pq.setQuestionText(gq.getQuestionText());

                    List<String> options = new ArrayList<>();
                    if (gq.getOptions() != null) {
                        for (QBQuestion.QBOption opt : gq.getOptions()) {
                            options.add(opt.getText());
                        }
                    }
                    pq.setOptions(options);
                    parsedQs.add(pq);
                }
            }

            if (parsedQs.isEmpty()) {
                String msg = "Zero questions parsed from document: " + qFile.getName();
                log.error("[QB PIPELINE] Batch {} FAILED during QUESTION_PARSING: {}", batch.getImportBatchId(), msg);
                batch.setStatus("FAILED");
                batch.setCurrentStage("QUESTION_PARSING");
                batch.setErrorMessage(msg);
                batch.setUpdatedAt(new Date());
                return batchRepo.save(batch);
            }

            // Stage: ANSWER_PARSING
            batch.setCurrentStage("ANSWER_PARSING");
            Map<Integer, AnswerParserService.ParsedAnswer> parsedAs = answerParserService.parseAnswersFromPages(aPages,
                    normFilter);
            if (parsedAs == null || parsedAs.isEmpty()) {
                String msg = "Zero answers/explanations parsed from solution document: "
                        + (sFile != null ? sFile.getName() : qFile.getName());
                log.error("[QB PIPELINE] Batch {} FAILED during ANSWER_PARSING: {}", batch.getImportBatchId(), msg);
                batch.setStatus("FAILED");
                batch.setCurrentStage("ANSWER_PARSING");
                batch.setErrorMessage(msg);
                batch.setUpdatedAt(new Date());
                return batchRepo.save(batch);
            }

            batch.setSuccessfullyParsed(parsedQs.size());
            audit.setTotalQuestionsExtracted(parsedQs.size());

            // Stage: MATCHING
            log.info("[QB PIPELINE] Batch {} [{}/{}] -> Stage: MATCHING", batch.getImportBatchId(), pair.getState(),
                    pair.getDistrict());
            batch.setStatus("MATCHING");
            batch.setCurrentStage("MATCHING");
            batch.setUpdatedAt(new Date());
            batchRepo.save(batch);

            QuestionMatchingService.MatchReport matchReport = questionMatchingService.matchAndBuildReport(
                    parsedQs, parsedAs, pair.getStateSlug(), pair.getDistrictSlug(), "easy",
                    qFile.getName(), s3Key, s3Key, GeminiQuestionParserService.calculateSHA256(qFile.getName()));

            int totalQs = parsedQs.size();
            int matchedCount = matchReport.getExactMatchCount() + matchReport.getFuzzyMatchCount();
            int unmatchedCount = matchReport.getUnmatchedCount();

            batch.setTotalQuestions(totalQs);
            batch.setSuccessfullyMatched(matchedCount);
            batch.setUnmatchedQuestions(unmatchedCount);

            if (matchedCount == 0) {
                String msg = "Zero question/answer matches produced for batch " + batch.getImportBatchId();
                log.error("[QB PIPELINE] Batch {} FAILED during MATCHING: {}", batch.getImportBatchId(), msg);
                batch.setStatus("FAILED");
                batch.setCurrentStage("MATCHING");
                batch.setErrorMessage(msg);
                batch.setUpdatedAt(new Date());
                return batchRepo.save(batch);
            }

            // Stage: VALIDATING
            log.info("[QB PIPELINE] Batch {} [{}/{}] -> Stage: VALIDATING", batch.getImportBatchId(), pair.getState(),
                    pair.getDistrict());
            batch.setStatus("VALIDATING");
            batch.setCurrentStage("VALIDATING");
            batch.setUpdatedAt(new Date());
            batchRepo.save(batch);

            importItemRepo.deleteByImportBatchId(batch.getImportBatchId());

            int invalidCount = 0;
            int duplicateCount = 0;
            List<QBQuestion> qbQuestionsToSave = new ArrayList<>();
            List<QBImportItem> importItemsToSave = new ArrayList<>();

            for (com.bodhganga.bodhganga.entity.Question mq : matchReport.getQuestions()) {
                QBImportItem item = new QBImportItem();
                item.setImportBatchId(batch.getImportBatchId());
                item.setQuestionNumber(mq.getQuestionNumber());
                item.setRawQuestionText(mq.getQuestion());
                item.setRawExplanationText(mq.getExplanation());

                if (mq.getQuestion() == null || mq.getQuestion().isBlank() || mq.getOptions() == null
                        || mq.getOptions().size() < 2) {
                    invalidCount++;
                    item.setStatus("INVALID");
                    item.setErrorMessage("Question text empty or insufficient options (< 2)");
                    importItemsToSave.add(item);
                    continue;
                }

                StringBuilder optsSb = new StringBuilder();
                List<QBQuestion.QBOption> opts = new ArrayList<>();
                String correctOptId = "A";

                String[] optLetters = { "A", "B", "C", "D", "E" };
                int correctIdx = mq.getCorrectAnswer() != null ? mq.getCorrectAnswer() : 0;

                for (int i = 0; i < mq.getOptions().size(); i++) {
                    String optId = i < optLetters.length ? optLetters[i] : String.valueOf((char) ('A' + i));
                    String optText = mq.getOptions().get(i);
                    boolean isCorr = (i == correctIdx);
                    opts.add(new QBQuestion.QBOption(optId, optText, isCorr));
                    optsSb.append(optId).append(":").append(optText).append(";");
                    if (isCorr) {
                        correctOptId = optId;
                    }
                }

                String qHash = GeminiQuestionParserService.calculateSHA256(mq.getQuestion() + "|" + optsSb.toString());

                Optional<QBQuestion> existingHashOpt = questionRepo.findByQuestionHash(qHash);
                if (existingHashOpt.isPresent()) {
                    duplicateCount++;
                    item.setStatus("DUPLICATE");
                    item.setErrorMessage("Duplicate question hash already exists in mongo: " + qHash);
                    importItemsToSave.add(item);
                    continue;
                }

                item.setStatus("REVIEW_REQUIRED".equalsIgnoreCase(mq.getStatus()) ? "UNMATCHED" : "MATCHED");
                importItemsToSave.add(item);

                QBQuestion q = new QBQuestion();
                q.setImportBatchId(batch.getImportBatchId());
                q.setQuestionNumber(mq.getQuestionNumber());
                q.setQuestionHash(qHash);
                q.setGoogleDriveFileId(qFile.getId());
                q.setS3Key(s3Key);
                q.setState(pair.getState());
                q.setStateSlug(pair.getStateSlug());
                q.setExam(pair.getDistrict());
                q.setExamSlug(pair.getDistrictSlug());
                q.setSubject("General Knowledge");
                q.setSubjectSlug("general-knowledge");
                q.setChapter("General Knowledge");
                q.setChapterSlug("general-knowledge");
                q.setTopic(mq.getTopic() != null ? mq.getTopic() : "General");
                q.setTopicSlug(GeminiQuestionParserService.generateSlug(q.getTopic()));
                q.setQuestionText(mq.getQuestion());
                q.setOptions(opts);
                q.setCorrectAnswer(correctOptId);
                q.setExplanation(mq.getExplanation() != null ? mq.getExplanation() : "");
                q.setDifficulty("MEDIUM");
                q.setConfidenceScore(0.9);
                q.setNeedsReview("REVIEW_REQUIRED".equalsIgnoreCase(mq.getStatus()));
                q.setPublished(true);

                qbQuestionsToSave.add(q);
            }

            batch.setInvalidQuestions(invalidCount);
            batch.setDuplicateQuestions(duplicateCount);

            if (qbQuestionsToSave.isEmpty()) {
                String msg = "Zero valid questions survived validation/deduplication for document: " + qFile.getName();
                log.error("[QB PIPELINE] Batch {} FAILED during VALIDATING: {}", batch.getImportBatchId(), msg);
                batch.setStatus("FAILED");
                batch.setCurrentStage("VALIDATING");
                batch.setErrorMessage(msg);
                batch.setUpdatedAt(new Date());
                return batchRepo.save(batch);
            }

            // Stage: PERSISTING
            log.info("[QB PIPELINE] Batch {} [{}/{}] -> Stage: PERSISTING", batch.getImportBatchId(), pair.getState(),
                    pair.getDistrict());
            batch.setStatus("PERSISTING");
            batch.setCurrentStage("PERSISTING");
            batch.setUpdatedAt(new Date());
            batchRepo.save(batch);

            List<QBQuestion> savedQbQuestions = questionRepo.saveAll(qbQuestionsToSave);
            importItemRepo.saveAll(importItemsToSave);

            batch.setPersistedQuestions(savedQbQuestions.size());

            if (savedQbQuestions.isEmpty()) {
                String msg = "Zero questions persisted to database for batch " + batch.getImportBatchId();
                log.error("[QB PIPELINE] Batch {} FAILED during PERSISTING: {}", batch.getImportBatchId(), msg);
                batch.setStatus("FAILED");
                batch.setCurrentStage("PERSISTING");
                batch.setErrorMessage(msg);
                batch.setUpdatedAt(new Date());
                return batchRepo.save(batch);
            }

            // Stage: GENERATING_TESTS
            log.info("[QB PIPELINE] Batch {} [{}/{}] -> Stage: GENERATING_TESTS", batch.getImportBatchId(),
                    pair.getState(), pair.getDistrict());
            batch.setStatus("GENERATING_TESTS");
            batch.setCurrentStage("GENERATING_TESTS");
            batch.setUpdatedAt(new Date());
            batchRepo.save(batch);

            int generatedTestsCount = 0;
            try {
                generatedTestsCount = testGeneratorService.generateTestsAndBundles(savedQbQuestions, qFile.getId(),
                        s3Key);
                batch.setGeneratedTests(generatedTestsCount);
            } catch (Exception testEx) {
                log.error("[QB PIPELINE] Test generation failed for batch {}: {}", batch.getImportBatchId(),
                        testEx.getMessage(), testEx);
                batch.setStatus("FAILED");
                batch.setCurrentStage("GENERATING_TESTS");
                batch.setErrorMessage("Zero tests generated: " + testEx.getMessage());
                batch.setUpdatedAt(new Date());
                return batchRepo.save(batch);
            }

            if (generatedTestsCount == 0) {
                String msg = "Zero tests generated for batch " + batch.getImportBatchId();
                log.error("[QB PIPELINE] Batch {} FAILED during GENERATING_TESTS: {}", batch.getImportBatchId(), msg);
                batch.setStatus("FAILED");
                batch.setCurrentStage("GENERATING_TESTS");
                batch.setErrorMessage(msg);
                batch.setUpdatedAt(new Date());
                return batchRepo.save(batch);
            }

            // Stage: Archival & Completion
            if (archiveFolderId != null && !archiveFolderId.isBlank()) {
                try {
                    driveService.moveToArchive(qFile.getId(), archiveFolderId);
                    if (sFile != null && !sFile.getId().equals(qFile.getId())) {
                        driveService.moveToArchive(sFile.getId(), archiveFolderId);
                    }
                } catch (Exception archiveEx) {
                    log.warn("[QB PIPELINE] Archival failed for file pair ({}, {}): {}", qDriveId, sDriveId,
                            archiveEx.getMessage());
                }
            }

            String finalStatus = (invalidCount > 0 || unmatchedCount > 0) ? "PARTIAL_SUCCESS" : "COMPLETED";
            batch.setStatus(finalStatus);
            batch.setCurrentStage("COMPLETED");
            batch.setCompletedAt(new Date());
            batch.setUpdatedAt(new Date());
            batchRepo.save(batch);

            audit.setGeminiCallsCount(1);
            audit.setQuestionsPassed(savedQbQuestions.size());
            audit.setQuestionsFlaggedReview(
                    (int) savedQbQuestions.stream().filter(q -> Boolean.TRUE.equals(q.getNeedsReview())).count());
            audit.setStatus(finalStatus);
            auditRepo.save(audit);

            return batch;

        } catch (Throwable e) {
            String currentStage = batch.getCurrentStage() != null ? batch.getCurrentStage()
                    : (batch.getStatus() != null ? batch.getStatus() : "PROCESSING");
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getName();
            log.error("[QB PIPELINE] Batch {} FAILED during stage {}: {}", batch.getImportBatchId(), currentStage,
                    errorMsg, e);

            batch.setStatus("FAILED");
            batch.setCurrentStage(currentStage);
            batch.setErrorMessage("Failed during stage " + currentStage + ": " + errorMsg);
            batch.setUpdatedAt(new Date());
            batchRepo.save(batch);

            audit.setStatus("FAILED");
            audit.setErrorMessage("Failed during stage " + currentStage + ": " + errorMsg);
            auditRepo.save(audit);

            if (e instanceof Exception) {
                throw (Exception) e;
            } else {
                throw new RuntimeException("Pipeline failed during stage " + currentStage + ": " + errorMsg, e);
            }
        }
    }

    private byte[] downloadBytes(File file) throws Exception {
        try (InputStream is = driveService.downloadFile(file.getId(), file.getMimeType())) {
            if (is == null)
                throw new IllegalStateException("Null download stream for file: " + file.getName());
            return is.readAllBytes();
        }
    }

    public boolean isRunning() {
        return isRunning.get();
    }
}
