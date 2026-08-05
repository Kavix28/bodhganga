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

/**
 * Scheduled ingestion pipeline for the Question Bank.
 *
 * <p>Drive traversal ← → S3 upload ← → Gemini parsing ← → Mongo save ← → Archive.
 *
 * <p>This service is <strong>completely independent</strong> of the State-material pipeline:
 * <ul>
 *   <li>Uses {@link QuestionBankDriveService} (dedicated QB service-account credentials).</li>
 *   <li>All folder IDs come from {@link QuestionBankProperties} — nothing is hardcoded.</li>
 *   <li>Gemini is called <em>once per PDF, during ingestion only</em> — never at exam time.</li>
 *   <li>Archive happens only after successful S3 + Mongo completion.</li>
 * </ul>
 */
@Service
public class QuestionBankPipelineTask {

    private static final Logger log = LoggerFactory.getLogger(QuestionBankPipelineTask.class);

    // ── Injected dependencies ────────────────────────────────────────────────
    private final QuestionBankProperties  props;
    private final QuestionBankDriveService driveService;
    private final S3Service               s3Service;
    private final GeminiQuestionParserService geminiParserService;
    private final TestGeneratorService    testGeneratorService;
    private final QBQuestionRepo          questionRepo;
    private final QBAuditRepo             auditRepo;

    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public QuestionBankPipelineTask(QuestionBankProperties props,
                                    QuestionBankDriveService driveService,
                                    S3Service s3Service,
                                    GeminiQuestionParserService geminiParserService,
                                    TestGeneratorService testGeneratorService,
                                    QBQuestionRepo questionRepo,
                                    QBAuditRepo auditRepo) {
        this.props             = props;
        this.driveService      = driveService;
        this.s3Service         = s3Service;
        this.geminiParserService = geminiParserService;
        this.testGeneratorService = testGeneratorService;
        this.questionRepo      = questionRepo;
        this.auditRepo         = auditRepo;
    }

    // ── Scheduled entry-point ────────────────────────────────────────────────

    @Scheduled(fixedDelayString = "${google.drive.qb.sync-interval-ms:600000}")
    public void scheduledSync() {
        if (!props.isPipelineEnabled()) {
            log.info("[QB PIPELINE] Scheduled sync skipped — google.drive.qb.pipeline.enabled=false.");
            return;
        }
        syncQuestionBank(false);
    }

    // ── Public API (also called by AdminQuestionBankPipelineController) ──────

    public void syncQuestionBank(boolean force) {

        // 1. Guard: QB Drive client must be initialized
        if (!driveService.isConfigured()) {
            String msg = "[QB PIPELINE] QB Drive client is not configured — check QB credentials. "
                    + "See startup logs for the root cause.";
            log.error(msg);
            if (force) throw new IllegalStateException(msg);
            return;
        }

        // 2. Guard: source folder required
        String sourceFolderId = props.getSourceFolderId();
        if (sourceFolderId == null || sourceFolderId.isBlank()
                || sourceFolderId.equalsIgnoreCase("REPLACE_WITH_SOURCE_FOLDER_ID")) {
            String msg = "[QB PIPELINE] google.drive.qb.source-folder-id is not set. "
                    + "Replace the placeholder with the real Drive folder ID before enabling the pipeline.";
            log.error(msg);
            if (force) throw new IllegalStateException(msg);
            return;
        }

        // 3. Warn if archive folder is missing (non-fatal)
        String archiveFolderId = props.getArchiveFolderId();
        if (archiveFolderId == null || archiveFolderId.isBlank()
                || archiveFolderId.equalsIgnoreCase("REPLACE_WITH_ARCHIVE_FOLDER_ID")) {
            log.warn("[QB PIPELINE] google.drive.qb.archive-folder-id is not set. "
                    + "Processed PDFs will not be archived and may be re-processed on next sync.");
            archiveFolderId = null;
        }

        // 4. Concurrency guard — one run at a time
        if (!isRunning.compareAndSet(false, true)) {
            String msg = "[QB PIPELINE] Pipeline is already running — skipping concurrent trigger.";
            log.warn(msg);
            if (force) throw new IllegalStateException(msg);
            return;
        }

        log.info("[QB PIPELINE] ── STARTED ── scanning source folder: {}", sourceFolderId);

        try {
            traverseAndIngest(sourceFolderId, new ArrayList<>(), archiveFolderId);
            log.info("[QB PIPELINE] ── COMPLETED ── successfully.");
        } catch (Exception e) {
            log.error("[QB PIPELINE] ── FAILED ── {}", e.getMessage(), e);
        } finally {
            isRunning.set(false);
        }
    }

    // ── Recursive traversal ──────────────────────────────────────────────────

    private void traverseAndIngest(String folderId, List<String> path, String archiveFolderId) {
        try {
            List<File> items = driveService.listFilesInFolder(folderId);
            if (items == null || items.isEmpty()) return;

            for (File item : items) {
                if ("application/vnd.google-apps.folder".equals(item.getMimeType())) {
                    List<String> nextPath = new ArrayList<>(path);
                    nextPath.add(item.getName());
                    traverseAndIngest(item.getId(), nextPath, archiveFolderId);
                } else if (item.getName() != null && item.getName().toLowerCase().endsWith(".pdf")) {
                    processPdfFile(item, path, archiveFolderId);
                }
            }
        } catch (IllegalStateException e) {
            // Drive client not configured — propagate to stop the whole run
            throw e;
        } catch (Exception e) {
            log.error("[QB PIPELINE] Error reading folder {} (path={}): {}",
                    folderId, path, e.getMessage(), e);
        }
    }

    // ── Per-PDF processing ───────────────────────────────────────────────────

    private void processPdfFile(File file, List<String> path, String archiveFolderId) {
        String state   = path.size() > 0 ? path.get(0) : "General";
        String exam    = path.size() > 1 ? path.get(1) : "State Exams";
        String subject = path.size() > 2 ? path.get(2) : "General Knowledge";

        String stateSlug   = GeminiQuestionParserService.generateSlug(state);
        String examSlug    = GeminiQuestionParserService.generateSlug(exam);
        String subjectSlug = GeminiQuestionParserService.generateSlug(subject);
        String fileName    = file.getName();

        log.info("[QB PIPELINE] Processing PDF: {} (State={}, Exam={}, Subject={})",
                fileName, state, exam, subject);

        QBAudit audit = new QBAudit();
        audit.setFileName(fileName);
        audit.setGoogleDriveFileId(file.getId());

        try {
            // ── 1. Download from Drive ────────────────────────────────────────
            byte[] bytes;
            try (InputStream stream = driveService.downloadFile(file.getId(), file.getMimeType())) {
                if (stream == null) {
                    log.warn("[QB PIPELINE] Download returned null stream for '{}' — skipping.", fileName);
                    return;
                }
                bytes = stream.readAllBytes();
            }

            if (bytes.length == 0) {
                log.warn("[QB PIPELINE] Zero-byte content for '{}' — skipping.", fileName);
                return;
            }

            // ── 2. Upload to S3 ───────────────────────────────────────────────
            String s3Key = String.format("question-bank/%s/%s/%s/%s",
                    stateSlug, examSlug, subjectSlug, fileName);
            try (InputStream is = new java.io.ByteArrayInputStream(bytes)) {
                s3Key = s3Service.uploadFileWithKey(is, (long) bytes.length, s3Key, "application/pdf");
            }
            audit.setS3Key(s3Key);

            // ── 3. PDF → text ─────────────────────────────────────────────────
            String text = extractTextFromPdfBytes(bytes);
            if (text == null || text.isBlank()) {
                log.warn("[QB PIPELINE] PDFBox returned empty text for '{}' — Gemini will receive raw placeholder.",
                        fileName);
                text = "PDF content could not be extracted from: " + fileName;
            }

            // ── 4. Gemini (ONE TIME ONLY — never at live exam time) ───────────
            List<QBQuestion> extracted = geminiParserService.parseQuestionsFromText(
                    text, state, stateSlug, exam, examSlug, subject, subjectSlug,
                    file.getId(), s3Key);

            audit.setGeminiCallsCount(1);
            audit.setTotalQuestionsExtracted(extracted.size());

            // ── 5. Dedup + Save ────────────────────────────────────────────────
            int passed  = 0;
            int flagged = 0;
            List<QBQuestion> savedQuestions = new ArrayList<>();

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

            audit.setQuestionsPassed(passed);
            audit.setQuestionsFlaggedReview(flagged);

            // ── 6. Test & Bundle generation ───────────────────────────────────
            testGeneratorService.generateTestsAndBundles(savedQuestions, file.getId(), s3Key);

            // ── 7. Archive (ONLY on full SUCCESS) ─────────────────────────────
            if (archiveFolderId != null && !archiveFolderId.isBlank()) {
                try {
                    driveService.moveToArchive(file.getId(), archiveFolderId);
                    log.info("[QB PIPELINE] Archived '{}' → folder {}", fileName, archiveFolderId);
                } catch (Exception archiveEx) {
                    // Archive failure is non-fatal — log and continue; the pipeline itself succeeded
                    log.error("[QB PIPELINE] Archive move failed for '{}': {} (S3 + Mongo are intact)",
                            fileName, archiveEx.getMessage(), archiveEx);
                }
            }

            audit.setStatus("SUCCESS");
            auditRepo.save(audit);

        } catch (Exception e) {
            log.error("[QB PIPELINE] Error processing '{}': {}", fileName, e.getMessage(), e);
            audit.setStatus("FAILED");
            audit.setErrorMessage(e.getMessage());
            auditRepo.save(audit);
        }
    }

    // ── PDF text extraction ───────────────────────────────────────────────────

    private String extractTextFromPdfBytes(byte[] bytes) {
        // PDFBox 3.x API: Loader.loadPDF(byte[]) — pass raw bytes directly
        try (org.apache.pdfbox.pdmodel.PDDocument doc = org.apache.pdfbox.Loader.loadPDF(bytes)) {
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            return stripper.getText(doc);
        } catch (Exception e) {
            log.warn("[QB PIPELINE] PDFBox extraction failed: {}", e.getMessage());
            return null;
        }
    }

    // ── Status ────────────────────────────────────────────────────────────────

    public boolean isRunning() { return isRunning.get(); }
}
