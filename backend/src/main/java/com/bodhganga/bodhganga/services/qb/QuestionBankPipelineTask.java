package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.config.QuestionBankProperties;
import com.bodhganga.bodhganga.entity.qb.QBAudit;
import com.bodhganga.bodhganga.entity.qb.QBQuestion;
import com.bodhganga.bodhganga.repo.qb.QBAuditRepo;
import com.bodhganga.bodhganga.repo.qb.QBQuestionRepo;
import com.bodhganga.bodhganga.services.S3Service;
import com.bodhganga.bodhganga.util.DistrictParser;
import com.bodhganga.bodhganga.util.ProductMetadataUtil;
import com.google.api.services.drive.model.File;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
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
            if (force)
                throw new IllegalStateException(msg);
            return;
        }

        String sourceFolderId = props.getSourceFolderId();
        if (sourceFolderId == null || sourceFolderId.isBlank()
                || sourceFolderId.equalsIgnoreCase("REPLACE_WITH_SOURCE_FOLDER_ID")) {
            String msg = "[QB PIPELINE] google.drive.qb.source-folder-id is not set.";
            log.error(msg);
            if (force)
                throw new IllegalStateException(msg);
            return;
        }

        String archiveFolderId = props.getArchiveFolderId();
        if (archiveFolderId == null || archiveFolderId.isBlank()
                || archiveFolderId.equalsIgnoreCase("REPLACE_WITH_ARCHIVE_FOLDER_ID")) {
            log.warn(
                    "[QB PIPELINE] google.drive.qb.archive-folder-id is not set. Processed PDFs will not be archived.");
            archiveFolderId = null;
        }

        if (!isRunning.compareAndSet(false, true)) {
            String msg = "[QB PIPELINE] Pipeline is already running — skipping concurrent trigger.";
            log.warn(msg);
            if (force)
                throw new IllegalStateException(msg);
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
            log.error("[QB PIPELINE] FAILED AT STAGE: Drive Folder Traversal (Folder ID: {}) - {}", folderId,
                    e.getMessage());
            throw e;
        }

        if (items == null || items.isEmpty())
            return;

        DistrictParser.ParsedLocation location = DistrictParser.extractLocation(path, null);
        String currentFolderName = path.isEmpty() ? "" : path.get(path.size() - 1);
        boolean isQbRootFolder = ProductMetadataUtil.isQuestionBankFolder(currentFolderName);

        // Check if current folder is a Question Bank root containing "Question Bank"
        // and/or "Answer Key" subfolders
        File qbSubFolder = null;
        File akSubFolder = null;

        for (File item : items) {
            if ("application/vnd.google-apps.folder".equals(item.getMimeType())) {
                String norm = ProductMetadataUtil.normalizeFolderName(item.getName());
                if (norm.equals("question bank") || norm.equals("question-bank") || norm.equals("question_bank")) {
                    qbSubFolder = item;
                } else if (norm.equals("answer key") || norm.equals("answer-key") || norm.equals("answer_key")) {
                    akSubFolder = item;
                }
            }
        }

        if (qbSubFolder != null || akSubFolder != null) {
            log.info("[QB PIPELINE] Discovered Question Bank asset structure under State='{}' ({}), District='{}' ({})",
                    location.getState(), location.getStateSlug(), location.getDistrict(), location.getDistrictSlug());

            processQuestionBankStructure(qbSubFolder, akSubFolder, location, path, archiveFolderId);
            return; // Finished processing this District's Question Bank root
        }

        // Standard Recursive Traversal for folders
        for (File item : items) {
            if ("application/vnd.google-apps.folder".equals(item.getMimeType())) {
                // Ignore course folders during Question Bank traversal
                if (ProductMetadataUtil.isFreeFolder(item.getName())
                        || ProductMetadataUtil.isPaidFolder(item.getName())) {
                    log.info("[QB PIPELINE][SKIPPED] Skipping course folder in QB traversal: {}", item.getName());
                    continue;
                }
                List<String> nextPath = new ArrayList<>(path);
                nextPath.add(item.getName());
                traverseAndIngest(item.getId(), nextPath, archiveFolderId);
            } else if (item.getName() != null && item.getName().toLowerCase().endsWith(".pdf")) {
                if (isQbRootFolder || !location.getStateSlug().equals("general")) {
                    processSinglePdfFile(item, null, location, path, archiveFolderId);
                }
            }
        }
    }

    /**
     * Process paired Question Bank + Answer Key PDFs for a specific State &
     * District.
     */
    private void processQuestionBankStructure(File qbSubFolder, File akSubFolder,
            DistrictParser.ParsedLocation location,
            List<String> path, String archiveFolderId) {
        List<File> questionFiles = new ArrayList<>();
        List<File> answerKeyFiles = new ArrayList<>();

        try {
            if (qbSubFolder != null) {
                List<File> fetched = driveService.listFilesInFolder(qbSubFolder.getId());
                if (fetched != null) {
                    for (File f : fetched) {
                        if (f.getName() != null && f.getName().toLowerCase().endsWith(".pdf")) {
                            questionFiles.add(f);
                        }
                    }
                }
            }
            if (akSubFolder != null) {
                List<File> fetched = driveService.listFilesInFolder(akSubFolder.getId());
                if (fetched != null) {
                    for (File f : fetched) {
                        if (f.getName() != null && f.getName().toLowerCase().endsWith(".pdf")) {
                            answerKeyFiles.add(f);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("[QB PIPELINE] Error listing QB asset subfolders for State={}, District={}: {}",
                    location.getStateSlug(), location.getDistrictSlug(), e.getMessage());
            return;
        }

        log.info("[QB PIPELINE] Found {} Question PDFs, {} Answer Key PDFs for State='{}', District='{}'",
                questionFiles.size(), answerKeyFiles.size(), location.getState(), location.getDistrict());

        Map<File, File> pairs = pairQuestionAndAnswerKeyFiles(questionFiles, answerKeyFiles);

        // Report unmatched answer key files
        Set<String> matchedAnswerKeyIds = new HashSet<>();
        for (File ak : pairs.values()) {
            if (ak != null)
                matchedAnswerKeyIds.add(ak.getId());
        }
        for (File ak : answerKeyFiles) {
            if (!matchedAnswerKeyIds.contains(ak.getId())) {
                log.warn(
                        "[QB PIPELINE][UNMATCHED_ANSWER_KEY] Answer Key PDF has no matching Question PDF in District='{}': {} (Drive ID: {})",
                        location.getDistrict(), ak.getName(), ak.getId());
            }
        }

        // Process each paired set
        for (Map.Entry<File, File> entry : pairs.entrySet()) {
            File qFile = entry.getKey();
            File aFile = entry.getValue();

            if (aFile == null) {
                log.info(
                        "[QB PIPELINE][UNMATCHED_QUESTION_PDF] Question PDF without paired Answer Key PDF: {} (State={}, District={})",
                        qFile.getName(), location.getStateSlug(), location.getDistrictSlug());
            } else {
                log.info(
                        "[QB PIPELINE][MATCHED_PAIR] Question PDF '{}' paired with Answer Key PDF '{}' (State={}, District={})",
                        qFile.getName(), aFile.getName(), location.getStateSlug(), location.getDistrictSlug());
            }

            processSinglePdfFile(qFile, aFile, location, path, archiveFolderId);
        }
    }

    /**
     * Pair Question PDFs with Answer Key PDFs based on State, District, and
     * normalized filename.
     */
    public static Map<File, File> pairQuestionAndAnswerKeyFiles(List<File> questionFiles, List<File> answerKeyFiles) {
        Map<File, File> pairs = new LinkedHashMap<>();
        if (questionFiles == null || questionFiles.isEmpty()) {
            return pairs;
        }

        Map<String, List<File>> answerKeyMap = new HashMap<>();
        if (answerKeyFiles != null) {
            for (File ak : answerKeyFiles) {
                String keyName = normalizePdfName(ak.getName());
                answerKeyMap.computeIfAbsent(keyName, k -> new ArrayList<>()).add(ak);
            }
        }

        for (File qf : questionFiles) {
            String qKey = normalizePdfName(qf.getName());
            List<File> candidates = answerKeyMap.get(qKey);

            if (candidates != null && candidates.size() == 1) {
                pairs.put(qf, candidates.get(0));
            } else if (candidates != null && candidates.size() > 1) {
                log.warn(
                        "[QB PIPELINE][AMBIGUOUS_PAIRING] Multiple Answer Key PDFs matched Question PDF '{}': Skipping answer key association.",
                        qf.getName());
                pairs.put(qf, null);
            } else {
                pairs.put(qf, null);
            }
        }
        return pairs;
    }

    public static String normalizePdfName(String name) {
        if (name == null)
            return "";
        String clean = name.toLowerCase().trim();
        if (clean.endsWith(".pdf")) {
            clean = clean.substring(0, clean.length() - 4);
        }
        clean = clean.replaceAll("(?i)[\\s_\\-]*(answer[s]?[\\s_\\-]*key|ans[\\s_\\-]*key|key|solutions?|ans)$", "")
                .trim();
        clean = clean.replaceAll("[^a-z0-9]", "");
        return clean;
    }

    private void processSinglePdfFile(File qFile, File aFile, DistrictParser.ParsedLocation location,
            List<String> path, String archiveFolderId) {
        String state = location.getState();
        String stateSlug = location.getStateSlug();
        String district = location.getDistrict();
        String districtSlug = location.getDistrictSlug();
        String exam = "State Exams";
        String examSlug = "state-exams";
        String subject = "General Knowledge";
        String subjectSlug = "general-knowledge";
        String fileName = qFile.getName();

        log.info("[QB PIPELINE] Processing Question Set: {} (State={}, District={})", fileName, stateSlug,
                districtSlug);

        QBAudit audit = new QBAudit();
        audit.setFileName(fileName);
        audit.setGoogleDriveFileId(qFile.getId());

        try {
            // Stage 1: Download Question PDF
            byte[] qBytes = downloadDriveFile(qFile);
            if (qBytes == null || qBytes.length == 0) {
                log.warn("[QB PIPELINE] Zero-byte or failed download for Question PDF: {}", fileName);
                return;
            }

            // Stage 2: S3 Upload for Question PDF
            String qS3Key = String.format("question-bank/%s/%s/questions/%s", stateSlug, districtSlug, fileName);
            try (InputStream is = new ByteArrayInputStream(qBytes)) {
                qS3Key = s3Service.uploadFileWithKey(is, (long) qBytes.length, qS3Key, "application/pdf");
            } catch (Exception e) {
                log.error("[QB PIPELINE] S3 Upload failed for Question PDF '{}': {}", fileName, e.getMessage());
                throw e;
            }
            audit.setS3Key(qS3Key);

            // Stage 3: Extract Question Text
            String qText = extractTextFromPdfBytes(qBytes);
            if (qText == null || qText.isBlank()) {
                log.warn("[QB PIPELINE] PDFBox failed to extract text from Question PDF: {}", fileName);
                qText = "PDF content could not be extracted from: " + fileName;
            }

            // Stage 4: Download & Upload Answer Key PDF (if matched)
            String aText = null;
            if (aFile != null) {
                byte[] aBytes = downloadDriveFile(aFile);
                if (aBytes != null && aBytes.length > 0) {
                    String aS3Key = String.format("question-bank/%s/%s/answer-keys/%s", stateSlug, districtSlug,
                            aFile.getName());
                    try (InputStream is = new ByteArrayInputStream(aBytes)) {
                        s3Service.uploadFileWithKey(is, (long) aBytes.length, aS3Key, "application/pdf");
                    } catch (Exception e) {
                        log.warn("[QB PIPELINE] S3 Upload failed for Answer Key PDF '{}': {}", aFile.getName(),
                                e.getMessage());
                    }
                    aText = extractTextFromPdfBytes(aBytes);
                }
            }

            // Stage 5: Gemini AI Parsing
            List<QBQuestion> extracted;
            try {
                log.info("[QB PIPELINE] Invoking Gemini for State={}, District={}, QuestionPDF={}, HasAnswerKey={}",
                        stateSlug, districtSlug, fileName, (aText != null));

                extracted = geminiParserService.parseQuestionsFromText(
                        qText, aText, state, stateSlug, district, districtSlug,
                        exam, examSlug, subject, subjectSlug, qFile.getId(), qS3Key);
            } catch (Exception e) {
                log.error("[QB PIPELINE] Gemini extraction failed for '{}': {}", fileName, e.getMessage(), e);
                throw e;
            }

            audit.setGeminiCallsCount(1);
            audit.setTotalQuestionsExtracted(extracted.size());

            // Stage 6: MongoDB Persistence & Deduplication
            int passed = 0;
            int flagged = 0;
            int duplicates = 0;
            List<QBQuestion> savedQuestions = new ArrayList<>();

            for (QBQuestion q : extracted) {
                Optional<QBQuestion> existing = questionRepo.findByGoogleDriveFileIdAndQuestionHash(
                        q.getGoogleDriveFileId(), q.getQuestionHash());

                if (existing.isPresent()) {
                    savedQuestions.add(existing.get());
                    duplicates++;
                } else {
                    // Secondary global hash check per state/district to prevent duplicates across
                    // files
                    Optional<QBQuestion> existingByHash = questionRepo.findByQuestionHash(q.getQuestionHash());
                    if (existingByHash.isPresent()) {
                        savedQuestions.add(existingByHash.get());
                        duplicates++;
                    } else {
                        QBQuestion saved = questionRepo.save(q);
                        savedQuestions.add(saved);
                        if (Boolean.TRUE.equals(saved.getNeedsReview()))
                            flagged++;
                        else
                            passed++;
                    }
                }
            }

            log.info("[QB PIPELINE] Saved {} questions for PDF {} (Passed: {}, Flagged: {}, Duplicates: {})",
                    savedQuestions.size(), fileName, passed, flagged, duplicates);

            audit.setQuestionsPassed(passed);
            audit.setQuestionsFlaggedReview(flagged);

            // Stage 7: Test & Bundle Generation
            if (!savedQuestions.isEmpty()) {
                try {
                    testGeneratorService.generateTestsAndBundles(savedQuestions, qFile.getId(), qS3Key);
                } catch (Exception e) {
                    log.error("[QB PIPELINE] Test & Bundle Generation failed for '{}': {}", fileName, e.getMessage());
                }
            }

            // Stage 8: Archive processed Drive files
            if (archiveFolderId != null && !archiveFolderId.isBlank()) {
                try {
                    driveService.moveToArchive(qFile.getId(), archiveFolderId);
                    if (aFile != null) {
                        driveService.moveToArchive(aFile.getId(), archiveFolderId);
                    }
                    log.info("[QB PIPELINE] Archived Drive files: {} (and answer key if present)", fileName);
                } catch (Exception archiveEx) {
                    log.error("[QB PIPELINE] Drive Archival failed for '{}': {}", fileName, archiveEx.getMessage());
                }
            }

            audit.setStatus("SUCCESS");
            auditRepo.save(audit);
            log.info("[QB PIPELINE][SUCCESS] Completed ingestion for PDF: {}", fileName);

        } catch (Exception e) {
            log.error("[QB PIPELINE][FAILED] Exception processing PDF {}: {}", fileName, e.getMessage(), e);
            audit.setStatus("FAILED");
            audit.setErrorMessage(e.getMessage());
            auditRepo.save(audit);
        }
    }

    private byte[] downloadDriveFile(File file) {
        try (InputStream stream = driveService.downloadFile(file.getId(), file.getMimeType())) {
            if (stream == null) {
                log.warn("[QB PIPELINE] Null stream returned from Drive for file: {}", file.getName());
                return null;
            }
            return stream.readAllBytes();
        } catch (Exception e) {
            log.error("[QB PIPELINE] Drive Download error for file {}: {}", file.getName(), e.getMessage());
            return null;
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

    public boolean isRunning() {
        return isRunning.get();
    }
}
