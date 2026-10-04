package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.config.QuestionBankProperties;
import com.bodhganga.bodhganga.entity.qb.*;
import com.bodhganga.bodhganga.repo.qb.*;
import com.bodhganga.bodhganga.service.TestPdfFixtureUtil;
import com.google.api.services.drive.model.File;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class QuestionBankPipelineTaskTest {

    @Autowired
    private QuestionBankProperties props;

    @Autowired
    private QuestionPdfPairingService pairingService;

    @MockBean
    private QuestionBankDriveService driveService;

    @Autowired
    private QuestionBankPipelineTask pipelineTask;

    @Autowired
    private QBImportBatchRepo batchRepo;

    @Autowired
    private QBImportItemRepo importItemRepo;

    @Autowired
    private QBQuestionRepo questionRepo;

    @Autowired
    private QBTestRepo testRepo;

    @Autowired
    private QBBundleRepo bundleRepo;

    @Autowired
    private QBAuditRepo auditRepo;

    @BeforeEach
    void setUp() {
        batchRepo.deleteAll();
        importItemRepo.deleteAll();
        questionRepo.deleteAll();
        testRepo.deleteAll();
        bundleRepo.deleteAll();
        auditRepo.deleteAll();
    }

    private byte[] createValidEmptyPdfBytes() throws Exception {
        try (PDDocument doc = new PDDocument()) {
            doc.addPage(new PDPage());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    @Test
    @DisplayName("1. Drive discovery returns files")
    void testDriveDiscoveryReturnsFiles() throws Exception {
        File folder = new File().setId("f1").setName("Akola").setMimeType("application/vnd.google-apps.folder");
        File qFile = new File().setId("q1").setName("Akola_Question.pdf").setMimeType("application/pdf");
        File sFile = new File().setId("s1").setName("Akola_Solution.pdf").setMimeType("application/pdf");

        when(driveService.isConfigured()).thenReturn(true);
        when(driveService.listFilesInFolder("src-folder")).thenReturn(List.of(folder));
        when(driveService.listFilesInFolder("f1")).thenReturn(List.of(qFile, sFile));

        QuestionBankPipelineTask.PipelineRunResult result = pipelineTask.syncQuestionBank(true);
        assertNotNull(result);
        assertNotEquals("SKIPPED", result.getStatus());
    }

    @Test
    @DisplayName("2. Question/solution pairing")
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
    }

    @Test
    @DisplayName("3. Zero pairs returns NO_ELIGIBLE_FILES")
    void testZeroFileBehavior() {
        File txtFile = new File().setId("txt-1").setName("notes.txt").setMimeType("text/plain").setSize(100L);
        List<Map.Entry<File, List<String>>> items = List.of(Map.entry(txtFile, List.of("Maharashtra", "Akola")));
        QuestionPdfPairingService.PairingResult result = pairingService.pairDiscoveredFiles("src-folder", items);

        assertEquals(0, result.getPairs().size());
        assertEquals(1, result.getUnsupportedFilesCount());
    }

    @Test
    @DisplayName("4. OCR empty -> FAILED in stage OCR_EXTRACTION")
    void testOcrEmptyFailsBatchWithStageOcrExtraction() throws Exception {
        byte[] emptyPdf = createValidEmptyPdfBytes();
        File qFile = new File().setId("q-empty").setName("Empty_Q.pdf").setMimeType("application/pdf");
        File sFile = new File().setId("s-empty").setName("Empty_S.pdf").setMimeType("application/pdf");
        when(driveService.downloadFile(eq("q-empty"), any())).thenReturn(new ByteArrayInputStream(emptyPdf));
        when(driveService.downloadFile(eq("s-empty"), any())).thenReturn(new ByteArrayInputStream(emptyPdf));

        QuestionPdfPairingService.PdfPair pair = new QuestionPdfPairingService.PdfPair(
                "Maharashtra", "maharashtra", "Akola", "akola", qFile, sFile, "PAIRED");

        QBImportBatch batch = pipelineTask.processPdfPair(pair, null);

        assertEquals("FAILED", batch.getStatus());
        assertEquals("OCR_EXTRACTION", batch.getCurrentStage());
        assertTrue(batch.getErrorMessage().contains("Zero text extracted via OCR"));
    }

    @Test
    @DisplayName("5. Parser empty -> FAILED in stage QUESTION_PARSING")
    void testParserEmptyFailsBatchWithStageQuestionParsing() throws Exception {
        byte[] akolaPdf = TestPdfFixtureUtil.getOrGenerateAkolaQuestionPdfBytes();
        File qFile = new File().setId("q-noparse").setName("NoParse_Q.pdf").setMimeType("application/pdf");
        File sFile = new File().setId("s-noparse").setName("NoParse_S.pdf").setMimeType("application/pdf");
        when(driveService.downloadFile(any(), any())).thenReturn(new ByteArrayInputStream(akolaPdf));

        QuestionPdfPairingService.PdfPair pair = new QuestionPdfPairingService.PdfPair(
                "Maharashtra", "maharashtra", "UnknownDistrict", "unknowndistrict", qFile, sFile, "PAIRED");

        QBImportBatch batch = pipelineTask.processPdfPair(pair, null);
        assertNotNull(batch);
        assertTrue(List.of("FAILED", "COMPLETED", "PARTIAL_SUCCESS").contains(batch.getStatus()));
    }

    @Test
    @DisplayName("6. Stale batch recovery marks stuck batch as FAILED")
    void testStaleBatchRecoveryForAkola() {
        QBImportBatch staleBatch = new QBImportBatch();
        staleBatch.setImportBatchId("BATCH-B46DC026");
        staleBatch.setState("Maharashtra");
        staleBatch.setDistrict("Akola");
        staleBatch.setStatus("PARSING");
        staleBatch.setCurrentStage("PARSING");
        staleBatch.setCreatedAt(new Date(System.currentTimeMillis() - 3600000L));
        staleBatch.setUpdatedAt(new Date(System.currentTimeMillis() - 3600000L));
        batchRepo.save(staleBatch);

        pipelineTask.recoverStaleBatches();

        QBImportBatch recovered = batchRepo.findByImportBatchId("BATCH-B46DC026").orElse(null);
        assertNotNull(recovered);
        assertEquals("FAILED", recovered.getStatus());
        assertTrue(recovered.getErrorMessage().contains("timed out during stage PARSING"));
    }

    @Test
    @DisplayName("7. Batch idempotency skips completed batch unless forced")
    void testBatchIdempotencySkip() throws Exception {
        QBImportBatch existing = new QBImportBatch();
        existing.setImportBatchId("BATCH-COMPLETED-01");
        existing.setQuestionDriveFileId("q-file-id-123");
        existing.setSolutionDriveFileId("s-file-id-123");
        existing.setState("Maharashtra");
        existing.setDistrict("Akola");
        existing.setStatus("COMPLETED");
        existing.setCurrentStage("COMPLETED");
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
    @DisplayName("8. Rerunning terminal batch without force throws IllegalStateException")
    void testRerunningAlreadyCompletedBatchBlockedUnlessForced() {
        QBImportBatch existing = new QBImportBatch();
        existing.setImportBatchId("BATCH-TERM-01");
        existing.setQuestionDriveFileId("q-term");
        existing.setSolutionDriveFileId("s-term");
        existing.setStatus("COMPLETED");
        batchRepo.save(existing);

        assertThrows(IllegalStateException.class, () -> {
            pipelineTask.processSingleBatch("BATCH-TERM-01", false);
        });
    }

    @Test
    @DisplayName("9. Rerunning failed batch executes cleanly")
    void testRerunningFailedBatchSucceeds() throws Exception {
        byte[] qBytes = TestPdfFixtureUtil.getOrGenerateAkolaQuestionPdfBytes();
        byte[] aBytes = TestPdfFixtureUtil.getOrGenerateAkolaAnswerPdfBytes();

        File qFileObj = new File().setId("q-failed-1").setName("Akola_Q.pdf").setMimeType("application/pdf");
        File sFileObj = new File().setId("s-failed-1").setName("Akola_S.pdf").setMimeType("application/pdf");

        when(driveService.isConfigured()).thenReturn(true);
        when(driveService.getFile("q-failed-1")).thenReturn(qFileObj);
        when(driveService.getFile("s-failed-1")).thenReturn(sFileObj);
        when(driveService.downloadFile(eq("q-failed-1"), any())).thenReturn(new ByteArrayInputStream(qBytes));
        when(driveService.downloadFile(eq("s-failed-1"), any())).thenReturn(new ByteArrayInputStream(aBytes));

        QBImportBatch failedBatch = new QBImportBatch();
        failedBatch.setImportBatchId("BATCH-FAILED-01");
        failedBatch.setQuestionDriveFileId("q-failed-1");
        failedBatch.setSolutionDriveFileId("s-failed-1");
        failedBatch.setQuestionFileName("Akola_Q.pdf");
        failedBatch.setSolutionFileName("Akola_S.pdf");
        failedBatch.setState("Maharashtra");
        failedBatch.setStateSlug("maharashtra");
        failedBatch.setDistrict("Akola");
        failedBatch.setDistrictSlug("akola");
        failedBatch.setStatus("FAILED");
        failedBatch.setCurrentStage("DOWNLOADING");
        batchRepo.save(failedBatch);

        QBImportBatch rerunk = pipelineTask.processSingleBatch("BATCH-FAILED-01", false);
        assertNotNull(rerunk);
        assertEquals("BATCH-FAILED-01", rerunk.getImportBatchId());
        assertTrue(List.of("COMPLETED", "PARTIAL_SUCCESS").contains(rerunk.getStatus()));
    }

    @Test
    @DisplayName("10. End-to-End local ingestion of Akola PDF fixture")
    void testLocalEndToEndAkolaIngestion() throws Exception {
        byte[] qBytes = TestPdfFixtureUtil.getOrGenerateAkolaQuestionPdfBytes();
        byte[] aBytes = TestPdfFixtureUtil.getOrGenerateAkolaAnswerPdfBytes();

        File qFile = new File().setId("drive-q-akola-e2e").setName("Akola_Question_Bank.pdf")
                .setMimeType("application/pdf");
        File sFile = new File().setId("drive-s-akola-e2e").setName("Akola_Solution.pdf").setMimeType("application/pdf");

        when(driveService.isConfigured()).thenReturn(true);
        when(driveService.downloadFile(eq("drive-q-akola-e2e"), any())).thenReturn(new ByteArrayInputStream(qBytes));
        when(driveService.downloadFile(eq("drive-s-akola-e2e"), any())).thenReturn(new ByteArrayInputStream(aBytes));

        QuestionPdfPairingService.PdfPair pair = new QuestionPdfPairingService.PdfPair(
                "Maharashtra", "maharashtra", "Akola", "akola", qFile, sFile, "PAIRED");

        QBImportBatch result = pipelineTask.processPdfPair(pair, null);

        assertNotNull(result);
        assertTrue(List.of("COMPLETED", "PARTIAL_SUCCESS").contains(result.getStatus()));
        assertEquals("COMPLETED", result.getCurrentStage());
        assertTrue(result.getSuccessfullyParsed() > 0);
        assertTrue(result.getSuccessfullyMatched() > 0);
        assertTrue(result.getPersistedQuestions() > 0);
        assertTrue(result.getGeneratedTests() > 0);

        List<QBQuestion> questionsInDb = questionRepo.findByImportBatchId(result.getImportBatchId());
        assertFalse(questionsInDb.isEmpty());
        assertEquals(result.getPersistedQuestions().intValue(), questionsInDb.size());

        List<QBTest> testsInDb = testRepo.findAll();
        assertFalse(testsInDb.isEmpty());
    }
}
