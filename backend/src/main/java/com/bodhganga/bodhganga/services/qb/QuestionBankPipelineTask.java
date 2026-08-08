package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.config.QuestionBankProperties;
import com.bodhganga.bodhganga.entity.qb.QBAudit;
import com.bodhganga.bodhganga.entity.qb.QBQuestion;
import com.bodhganga.bodhganga.repo.qb.QBAuditRepo;
import com.bodhganga.bodhganga.repo.qb.QBQuestionRepo;
import com.bodhganga.bodhganga.services.S3Service;
import com.google.api.services.drive.model.File;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private final S3Service s3Service;
    private final GeminiQuestionParserService geminiParserService;
    private final TestGeneratorService testGeneratorService;
    private final QBQuestionRepo questionRepo;
    private final QBAuditRepo auditRepo;

    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public QuestionBankPipelineTask(QuestionBankProperties props,
                                    QuestionBankDriveService driveService,
                                    S3Service s3Service,
                                    GeminiQuestionParserService geminiParserService,
                                    TestGeneratorService testGeneratorService,
                                    QBQuestionRepo questionRepo,
                                    QBAuditRepo auditRepo) {
        this.props = props;
        this.driveService = driveService;
        this.s3Service = s3Service;
        this.geminiParserService = geminiParserService;
        this.testGeneratorService = testGeneratorService;
        this.questionRepo = questionRepo;
        this.auditRepo = auditRepo;
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

    public void syncQuestionBank(boolean force) {
        if (!driveService.isConfigured()) {
            String msg = "[QB PIPELINE] QB Drive client is not configured — check QB credentials.";
            log.error(msg);
            if (force) throw new IllegalStateException(msg);
            return;
        }

        String sourceFolderId = props.getSourceFolderId();
        if (sourceFolderId == null || sourceFolderId.isBlank()
                || sourceFolderId.equalsIgnoreCase("REPLACE_WITH_SOURCE_FOLDER_ID")) {
            String msg = "[QB PIPELINE] google.drive.qb.source-folder-id is not set.";
            log.error(msg);
            if (force) throw new IllegalStateException(msg);
            return;
        }

        String archiveFolderId = props.getArchiveFolderId();
        if (archiveFolderId == null || archiveFolderId.isBlank()
                || archiveFolderId.equalsIgnoreCase("REPLACE_WITH_ARCHIVE_FOLDER_ID")) {
            log.warn("[QB PIPELINE] google.drive.qb.archive-folder-id is not set. Processed PDFs will not be archived.");
            archiveFolderId = null;
        }

        if (!isRunning.compareAndSet(false, true)) {
            String msg = "[QB PIPELINE] Pipeline is already running — skipping concurrent trigger.";
            log.warn(msg);
            if (force) throw new IllegalStateException(msg);
            return;
        }

        long startTime = System.currentTimeMillis();
        log.info("========== QB SYNC START ==========");
        log.info("Checking Drive... Source Folder: {}", sourceFolderId);

        try {
            traverseAndIngest(sourceFolderId, new ArrayList<>(), archiveFolderId);
            long duration = System.currentTimeMillis() - startTime;
            log.info("SUCCESS (Execution time: {} ms)", duration);
            log.info("========== QB SYNC END ==========");
        } catch (Exception e) {
            log.error("[QB PIPELINE] Stage FAILED during traversal/ingest: {}", e.getMessage(), e);
            log.info("========== QB SYNC END (FAILED) ==========");
        } finally {
            isRunning.set(false);
        }
    }

    private void traverseAndIngest(String folderId, List<String> path, String archiveFolderId) throws Exception {
        List<File> items;
        try {
            items = driveService.listFilesInFolder(folderId);
        } catch (Exception e) {
            log.error("[QB PIPELINE] FAILED AT STAGE: Drive Folder Traversal (Folder ID: {}) - {}", folderId, e.getMessage());
            throw e;
        }

        if (items == null || items.isEmpty()) return;

        int folderCount = 0;
        int pdfCount = 0;
        for (File item : items) {
            if ("application/vnd.google-apps.folder".equals(item.getMimeType())) {
                folderCount++;
            } else if (item.getName() != null && item.getName().toLowerCase().endsWith(".pdf")) {
                pdfCount++;
            }
        }
        log.info("Found {} folders, Found {} PDFs in folder path: {}", folderCount, pdfCount, path);

        for (File item : items) {
            if ("application/vnd.google-apps.folder".equals(item.getMimeType())) {
                List<String> nextPath = new ArrayList<>(path);
                nextPath.add(item.getName());
                traverseAndIngest(item.getId(), nextPath, archiveFolderId);
            } else if (item.getName() != null && item.getName().toLowerCase().endsWith(".pdf")) {
                processPdfFile(item, path, archiveFolderId);
            }
        }
    }

    private void processPdfFile(File file, List<String> path, String archiveFolderId) {
        String state   = path.size() > 0 ? path.get(0) : "General";
        String exam    = path.size() > 1 ? path.get(1) : "State Exams";
        String subject = path.size() > 2 ? path.get(2) : "General Knowledge";

        String stateSlug   = GeminiQuestionParserService.generateSlug(state);
        String examSlug    = GeminiQuestionParserService.generateSlug(exam);
        String subjectSlug = GeminiQuestionParserService.generateSlug(subject);
        String fileName    = file.getName();

        log.info("Processing PDF: {}", fileName);

        QBAudit audit = new QBAudit();
        audit.setFileName(fileName);
        audit.setGoogleDriveFileId(file.getId());

        try {
            // Stage 1: Download
            byte[] bytes;
            try (InputStream stream = driveService.downloadFile(file.getId(), file.getMimeType())) {
                if (stream == null) {
                    log.warn("[QB PIPELINE] FAILED AT STAGE: Drive PDF Download - Null stream returned for {}", fileName);
                    return;
                }
                bytes = stream.readAllBytes();
            } catch (Exception e) {
                log.error("[QB PIPELINE] FAILED AT STAGE: Drive PDF Download for '{}' - {}", fileName, e.getMessage());
                throw e;
            }

            if (bytes.length == 0) {
                log.warn("[QB PIPELINE] FAILED AT STAGE: Drive PDF Download - Zero-byte file: {}", fileName);
                return;
            }

            // Stage 2: S3 Upload
            String s3Key = String.format("question-bank/%s/%s/%s/%s", stateSlug, examSlug, subjectSlug, fileName);
            log.info("Uploading S3 ... Target Key: {}", s3Key);
            try (InputStream is = new java.io.ByteArrayInputStream(bytes)) {
                s3Key = s3Service.uploadFileWithKey(is, (long) bytes.length, s3Key, "application/pdf");
            } catch (Exception e) {
                log.error("[QB PIPELINE] FAILED AT STAGE: S3 Upload for '{}' - {}", fileName, e.getMessage());
                throw e;
            }
            audit.setS3Key(s3Key);

            // Stage 3: PDF Text Extraction & Gemini Metadata Parsing
            String text = extractTextFromPdfBytes(bytes);
            if (text == null || text.isBlank()) {
                text = "PDF content could not be extracted from: " + fileName;
            }

            List<QBQuestion> extracted;
            try {
                log.info("Extracting metadata via Gemini ...");
                extracted = geminiParserService.parseQuestionsFromText(
                        text, state, stateSlug, exam, examSlug, subject, subjectSlug,
                        file.getId(), s3Key);
            } catch (Exception e) {
                log.error("[QB PIPELINE] FAILED AT STAGE: Gemini Metadata Extraction for '{}' - {}", fileName, e.getMessage());
                throw e;
            }

            audit.setGeminiCallsCount(1);
            audit.setTotalQuestionsExtracted(extracted.size());

            // Stage 4: Mongo Save & Dedup
            int passed  = 0;
            int flagged = 0;
            List<QBQuestion> savedQuestions = new ArrayList<>();

            try {
                for (QBQuestion q : extracted) {
                    Optional<QBQuestion> existing = questionRepo.findByGoogleDriveFileIdAndQuestionHash(
                            q.getGoogleDriveFileId(), q.getQuestionHash());

                    if (existing.isPresent()) {
                        savedQuestions.add(existing.get());
                        passed++;
                    } else {
                        QBQuestion saved = questionRepo.save(q);
                        savedQuestions.add(saved);
                        if (Boolean.TRUE.equals(saved.getNeedsReview())) flagged++;
                        else passed++;
                    }
                }
                log.info("Mongo Updated ... Saved {} questions (Passed: {}, Flagged: {})", savedQuestions.size(), passed, flagged);
            } catch (Exception e) {
                log.error("[QB PIPELINE] FAILED AT STAGE: Mongo Database Save for '{}' - {}", fileName, e.getMessage());
                throw e;
            }

            audit.setQuestionsPassed(passed);
            audit.setQuestionsFlaggedReview(flagged);

            // Stage 5: Test & Bundle Generation
            try {
                testGeneratorService.generateTestsAndBundles(savedQuestions, file.getId(), s3Key);
            } catch (Exception e) {
                log.error("[QB PIPELINE] FAILED AT STAGE: Test & Bundle Generation for '{}' - {}", fileName, e.getMessage());
                throw e;
            }

            // Stage 6: Archive
            if (archiveFolderId != null && !archiveFolderId.isBlank()) {
                try {
                    driveService.moveToArchive(file.getId(), archiveFolderId);
                    log.info("Archived ... File {} moved to folder {}", fileName, archiveFolderId);
                } catch (Exception archiveEx) {
                    log.error("[QB PIPELINE] FAILED AT STAGE: Google Drive Archival for '{}' - {}", fileName, archiveEx.getMessage());
                }
            }

            audit.setStatus("SUCCESS");
            auditRepo.save(audit);
            log.info("SUCCESS Processing {}", fileName);

        } catch (Exception e) {
            audit.setStatus("FAILED");
            audit.setErrorMessage(e.getMessage());
            auditRepo.save(audit);
        }
    }

    private String extractTextFromPdfBytes(byte[] bytes) {
        try (org.apache.pdfbox.pdmodel.PDDocument doc = org.apache.pdfbox.Loader.loadPDF(bytes)) {
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            return stripper.getText(doc);
        } catch (Exception e) {
            log.warn("[QB PIPELINE] PDFBox extraction failed: {}", e.getMessage());
            return null;
        }
    }

    public boolean isRunning() { return isRunning.get(); }
}
