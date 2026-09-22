package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.entity.Question;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class LocalIngestionPipelineTest {

    private QuestionIngestionService ingestionService;
    private PdfExtractionService pdfExtractionService;
    private QuestionParserService questionParserService;
    private AnswerParserService answerParserService;
    private QuestionMatchingService questionMatchingService;
    private OcrTextNormalizationService normalizationService;
    private DocumentExtractionRouter extractionRouter;
    private DeterministicQuestionClassifier questionClassifier;

    @BeforeEach
    void setUp() {
        OcrService ocrService = new OcrService();
        pdfExtractionService = new PdfExtractionService(ocrService);
        normalizationService = new OcrTextNormalizationService();
        questionParserService = new QuestionParserService(normalizationService);
        answerParserService = new AnswerParserService(normalizationService);
        questionMatchingService = new QuestionMatchingService(normalizationService);

        PdfTextQualityAnalyzer textQualityAnalyzer = new PdfTextQualityAnalyzer();
        extractionRouter = new DocumentExtractionRouter(pdfExtractionService, ocrService, textQualityAnalyzer);
        questionClassifier = new DeterministicQuestionClassifier(null);

        ingestionService = new QuestionIngestionService(
                pdfExtractionService,
                questionParserService,
                answerParserService,
                questionMatchingService,
                null,
                null,
                null,
                extractionRouter,
                questionClassifier);
    }

    @Test
    @DisplayName("Should successfully ingest questions from synthetic digital text PDFs in local dry-run mode")
    void testLocalDigitalIngestionPipelineDryRun() throws IOException {
        byte[] questionPdfBytes = createSyntheticQuestionPdf();
        byte[] answerPdfBytes = createSyntheticAnswerPdf();

        MockMultipartFile questionFile = new MockMultipartFile(
                "questionPdfFile", "east-jaintia-questions.pdf", "application/pdf", questionPdfBytes);
        MockMultipartFile answerFile = new MockMultipartFile(
                "answerPdfFile", "east-jaintia-answers.pdf", "application/pdf", answerPdfBytes);

        QuestionIngestionService.IngestionResult result = ingestionService.ingestQuestionBankPdfs(
                questionFile, answerFile, "meghalaya", "east-jaintia-hills", "master", true);

        assertTrue(result.isSuccess(), "Ingestion result should report success");
        assertTrue(result.isDryRun(), "Result should be marked dryRun");
        assertEquals(2, result.getTotalParsed(), "Should parse exactly 2 questions");
        assertNotNull(result.getIngestedQuestions());
        assertEquals(2, result.getIngestedQuestions().size());

        Question q1 = result.getIngestedQuestions().get(0);
        assertEquals(1, q1.getQuestionNumber());
        assertEquals("meghalaya", q1.getStateSlug());
        assertEquals("east-jaintia-hills", q1.getDistrictSlug());
        assertNotNull(q1.getQuestion());
        assertNotNull(q1.getOptions());
        assertEquals(4, q1.getOptions().size());
        assertFalse(q1.getIsActive(), "Parsed draft question must not be active prior to admin publish");
    }

    private byte[] createSyntheticQuestionPdf() throws IOException {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream stream = new PDPageContentStream(doc, page)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                stream.newLineAtOffset(50, 700);

                stream.showText("History");
                stream.newLineAtOffset(0, -20);
                stream.showText("Q1. Which hills region is home to the Nartiang Monoliths in Meghalaya?");
                stream.newLineAtOffset(0, -18);
                stream.showText("(A) Jaintia Hills (B) Garo Hills (C) Khasi Hills (D) Assam Valley");
                stream.newLineAtOffset(0, -25);

                stream.showText("Q2. Consider the following statements regarding coal mining in East Jaintia Hills:");
                stream.newLineAtOffset(0, -18);
                stream.showText("1. Rat-hole mining was traditionally practiced in the region.");
                stream.newLineAtOffset(0, -18);
                stream.showText("2. NGT imposed a ban on unregulated mining in 2014.");
                stream.newLineAtOffset(0, -18);
                stream.showText("Which of the statements given above is/are correct?");
                stream.newLineAtOffset(0, -18);
                stream.showText("(A) 1 only (B) 2 only (C) Both 1 and 2 (D) Neither 1 nor 2");
                stream.endText();
            }
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] createSyntheticAnswerPdf() throws IOException {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream stream = new PDPageContentStream(doc, page)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                stream.newLineAtOffset(50, 700);

                stream.showText("Answer Key & Explanations");
                stream.newLineAtOffset(0, -20);
                stream.showText("1. (A) Jaintia Hills");
                stream.newLineAtOffset(0, -18);
                stream.showText(
                        "Explanation: Nartiang Monoliths are located in West Jaintia Hills district of Meghalaya.");
                stream.newLineAtOffset(0, -25);

                stream.showText("2. (C) Both 1 and 2");
                stream.newLineAtOffset(0, -18);
                stream.showText(
                        "Explanation: Both statements are factual. The National Green Tribunal banned rat-hole mining in 2014.");
                stream.endText();
            }
            doc.save(baos);
            return baos.toByteArray();
        }
    }
}
