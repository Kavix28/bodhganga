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
import com.google.api.services.drive.model.File;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class QuestionBankPipelineTaskTest {

    @Autowired
    private QuestionBankProperties props;

    @Autowired
    private QuestionPdfPairingService pairingService;

    @Autowired
    private QuestionBankPipelineTask pipelineTask;

    @Autowired
    private QBImportBatchRepo batchRepo;

    @Autowired
    private QBImportItemRepo importItemRepo;

    @Autowired
    private QBQuestionRepo questionRepo;

    @Autowired
    private QBAuditRepo auditRepo;

    @BeforeEach
    void setUp() {
        batchRepo.deleteAll();
        importItemRepo.deleteAll();
        questionRepo.deleteAll();
        auditRepo.deleteAll();
    }

    @Test
    @DisplayName("1. Prove pairing service correctly pairs Question PDF and Solution PDF")
    void testPdfPairingServiceSuccess() {
        File qFile = new File().setId("drive-q-1").setName("Akola_Question_Bank.pdf").setMimeType("application/pdf")
                .setSize(1024L);
        File sFile = new File().setId("drive-s-1").setName("Akola_Solution_Explanation.pdf")
                .setMimeType("application/pdf").setSize(1024L);
        File folder = new File().setId("folder-1").setName("Akola").setMimeType("application/vnd.google-apps.folder");

        List<Map.Entry<File, List<String>>> items = List.of(
                Map.entry(folder, List.of("Maharashtra")),
                Map.entry(qFile, List.of("Maharashtra", "Akola")),
                Map.entry(sFile, List.of("Maharashtra", "Akola")));

        QuestionPdfPairingService.PairingResult result = pairingService.pairDiscoveredFiles("src-folder", items);

        assertEquals(1, result.getTotalFoldersDiscovered());
        assertEquals(2, result.getTotalFilesDiscovered());
        assertEquals(2, result.getTotalPdfsDiscovered());
        assertEquals(1, result.getMatchedPairsCount());
        assertEquals(1, result.getPairs().size());

        QuestionPdfPairingService.PdfPair pair = result.getPairs().get(0);
        assertEquals("PAIRED", pair.getStatus());
        assertEquals("Maharashtra", pair.getState());
        assertEquals("Akola", pair.getDistrict());
        assertEquals("drive-q-1", pair.getQuestionFile().getId());
        assertEquals("drive-s-1", pair.getSolutionFile().getId());
    }

    @Test
    @DisplayName("2. Prove ambiguous PDF pairing is flagged when only solution PDF exists")
    void testPdfPairingServiceAmbiguous() {
        File sFile = new File().setId("drive-s-only").setName("Akola_Solution.pdf").setMimeType("application/pdf")
                .setSize(1024L);

        List<Map.Entry<File, List<String>>> items = List.of(
                Map.entry(sFile, List.of("Maharashtra", "Akola")));

        QuestionPdfPairingService.PairingResult result = pairingService.pairDiscoveredFiles("src-folder", items);

        assertEquals(1, result.getPairs().size());
        assertEquals("AMBIGUOUS", result.getPairs().get(0).getStatus());
    }

    @Test
    @DisplayName("3. Prove zero-file scan returns NO_ELIGIBLE_FILES and is NOT reported as SUCCESS")
    void testZeroFileBehavior() {
        File txtFile = new File().setId("txt-1").setName("notes.txt").setMimeType("text/plain").setSize(100L);

        List<Map.Entry<File, List<String>>> items = List.of(
                Map.entry(txtFile, List.of("Maharashtra", "Akola")));

        QuestionPdfPairingService.PairingResult result = pairingService.pairDiscoveredFiles("src-folder", items);

        assertEquals(0, result.getPairs().size());
        assertEquals(1, result.getUnsupportedFilesCount());
        assertEquals(1, result.getSkippedFilesCount());
    }

    @Test
    @DisplayName("4. Prove Stale Batch Recovery marks stuck Akola batch BATCH-B46DC026 as FAILED with diagnostic error containing original PARSING stage")
    void testStaleBatchRecoveryForAkola() {
        QBImportBatch staleBatch = new QBImportBatch();
        staleBatch.setImportBatchId("BATCH-B46DC026");
        staleBatch.setState("Maharashtra");
        staleBatch.setStateSlug("maharashtra");
        staleBatch.setDistrict("Akola");
        staleBatch.setDistrictSlug("akola");
        staleBatch.setStatus("PARSING");
        staleBatch.setTotalQuestions(0);
        staleBatch.setCreatedAt(new Date(System.currentTimeMillis() - 3600000L)); // 1 hour ago
        staleBatch.setUpdatedAt(new Date(System.currentTimeMillis() - 3600000L));

        batchRepo.save(staleBatch);

        // Run recovery scan
        pipelineTask.recoverStaleBatches();

        QBImportBatch recovered = batchRepo.findByImportBatchId("BATCH-B46DC026").orElse(null);
        assertNotNull(recovered);
        assertEquals("FAILED", recovered.getStatus());
        assertTrue(recovered.getErrorMessage().contains("Stale batch recovered: timed out during stage PARSING"),
                "Error message must specify original stuck stage 'PARSING'. Actual message: "
                        + recovered.getErrorMessage());

        List<QBAudit> audits = auditRepo.findAll();
        assertFalse(audits.isEmpty());
        assertEquals("FAILED", audits.get(0).getStatus());
    }

    @Test
    @DisplayName("5. Prove batch idempotency skips already COMPLETED batch")
    void testBatchIdempotencySkip() throws Exception {
        QBImportBatch existing = new QBImportBatch();
        existing.setImportBatchId("BATCH-COMPLETED-01");
        existing.setQuestionDriveFileId("q-file-id-123");
        existing.setSolutionDriveFileId("s-file-id-123");
        existing.setState("Maharashtra");
        existing.setDistrict("Akola");
        existing.setStatus("COMPLETED");
        existing.setSuccessfullyMatched(10);
        batchRepo.save(existing);

        File qFile = new File().setId("q-file-id-123").setName("Akola_Q.pdf").setMimeType("application/pdf");
        File sFile = new File().setId("s-file-id-123").setName("Akola_S.pdf").setMimeType("application/pdf");

        QuestionPdfPairingService.PdfPair pair = new QuestionPdfPairingService.PdfPair(
                "Maharashtra", "maharashtra", "Akola", "akola", qFile, sFile, "PAIRED");

        QBImportBatch processed = pipelineTask.processPdfPair(pair, null);

        assertEquals("BATCH-COMPLETED-01", processed.getImportBatchId());
        assertEquals("COMPLETED", processed.getStatus());
        assertEquals(10, processed.getSuccessfullyMatched());
    }

    @Test
    @DisplayName("6. Prove syncQuestionBank recovers stale batch even when Drive client is not configured")
    void testStaleRecoveryUnblockedByDriveConfig() {
        QBImportBatch staleBatch = new QBImportBatch();
        staleBatch.setImportBatchId("BATCH-STALE-DRIVE-FAIL");
        staleBatch.setState("Maharashtra");
        staleBatch.setDistrict("Akola");
        staleBatch.setStatus("DOWNLOADING");
        staleBatch.setCreatedAt(new Date(System.currentTimeMillis() - 3600000L));
        staleBatch.setUpdatedAt(new Date(System.currentTimeMillis() - 3600000L));
        batchRepo.save(staleBatch);

        // syncQuestionBank executes recoverStaleBatches BEFORE drive configuration
        // check
        QuestionBankPipelineTask.PipelineRunResult result = pipelineTask.syncQuestionBank(false);

        QBImportBatch recovered = batchRepo.findByImportBatchId("BATCH-STALE-DRIVE-FAIL").orElse(null);
        assertNotNull(recovered);
        assertEquals("FAILED", recovered.getStatus());
        assertTrue(recovered.getErrorMessage().contains("timed out during stage DOWNLOADING"));
    }
}
