package com.bodhganga.bodhganga.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class IntegratedParserAndClassifierTest {

    private PdfExtractionService pdfExtractionService;
    private QuestionParserService questionParserService;
    private DeterministicQuestionClassifier classifier;

    @BeforeEach
    void setUp() {
        pdfExtractionService = new PdfExtractionService(new OcrService());
        OcrTextNormalizationService normalizationService = new OcrTextNormalizationService();
        questionParserService = new QuestionParserService(normalizationService);
        classifier = new DeterministicQuestionClassifier(null);
    }

    @Test
    @DisplayName("Should extract and classify 20 synthetic questions (10 Foundation, 10 Statement-Based/Review)")
    void test20QuestionPipelineExtractionAndClassification() throws IOException {
        byte[] pdfBytes = generate20QuestionSyntheticPdf();

        // 1. PDFBox Text Extraction
        List<String> pagesText = pdfExtractionService.extractTextPerPage(pdfBytes);
        assertNotNull(pagesText);
        assertEquals(1, pagesText.size());

        // 2. QuestionParserService
        List<QuestionParserService.ParsedQuestion> parsedQuestions = questionParserService
                .parseQuestionsFromPages(pagesText);
        assertNotNull(parsedQuestions);
        assertTrue(parsedQuestions.size() >= 19,
                "Expected at least 19 parsed questions, got: " + parsedQuestions.size());

        // 3. Classification Counts
        int foundationCount = 0;
        int statementBasedCount = 0;
        int reviewRequiredCount = 0;

        for (QuestionParserService.ParsedQuestion q : parsedQuestions) {
            DeterministicQuestionClassifier.QuestionClassification classification = classifier.classifyQuestion(
                    q.getQuestionText(), q.getOptions());

            System.out.println("Q" + q.getQuestionNumber() + " [Options: " + q.getOptions() + "] -> "
                    + classification.getClassification() + " (" + classification.getReason() + ")");

            if (classification.getClassification() == DeterministicQuestionClassifier.ClassificationResult.FOUNDATION) {
                foundationCount++;
            } else if (classification
                    .getClassification() == DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED) {
                statementBasedCount++;
            } else {
                reviewRequiredCount++;
            }
        }

        System.out.println("Pipeline Verification Results:");
        System.out.println("Total Parsed Questions: " + parsedQuestions.size());
        System.out.println("FOUNDATION Count: " + foundationCount);
        System.out.println("STATEMENT_BASED Count: " + statementBasedCount);
        System.out.println("REVIEW_REQUIRED Count: " + reviewRequiredCount);

        assertTrue(foundationCount >= 9, "Expected at least 9 Foundation questions, got: " + foundationCount);
        assertTrue(statementBasedCount >= 9,
                "Expected at least 9 Statement-Based questions, got: " + statementBasedCount);
    }

    private byte[] generate20QuestionSyntheticPdf() throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                stream.newLineAtOffset(50, 750);

                // 10 FOUNDATION QUESTIONS
                stream.showText("Q1. What is the capital of Meghalaya?");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) Shillong (B) Tura (C) Jowai (D) Nongpoh");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q2. Which district of Himachal Pradesh has the smallest area?");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) Hamirpur (B) Bilaspur (C) Una (D) Solan");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q3. Who founded the city of Solan?");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) Bhagat Singh (B) Durga Singh (C) Hari Chand (D) Karam Chand");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q4. Which river flows through Mandi district?");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) Beas (B) Ravi (C) Sutlej (D) Chenab");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q5. Gross Domestic Product is defined as:");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) Total market value of final goods (B) Net export (C) Revenue (D) Tax");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q6. Under which Article is the Governor appointed?");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) Article 153 (B) Article 155 (C) Article 161 (D) Article 163");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q7. Which bank is the Lead Bank in Akola?");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) Bank of Maharashtra (B) SBI (C) CBI (D) PNB");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q8. Nartiang Monoliths are located in which hills?");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) Jaintia Hills (B) Garo Hills (C) Khasi Hills (D) Cachar");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q9. Who was the first Chief Commissioner of HP?");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) N. C. Mehta (B) E. P. Moon (C) Y. S. Parmar (D) Mehta");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q10. Where is Prashar Lake situated?");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) Mandi (B) Kullu (C) Shimla (D) Chamba");
                stream.newLineAtOffset(0, -16);

                // 10 STATEMENT_BASED QUESTIONS
                stream.showText("Q11. Statement I: Coal mining was banned in 2014.");
                stream.newLineAtOffset(0, -12);
                stream.showText("Statement II: Rat-hole mining was practiced in Meghalaya.");
                stream.newLineAtOffset(0, -12);
                stream.showText(
                        "(A) Both correct (B) Both incorrect (C) I correct II incorrect (D) I incorrect II correct");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q12. Consider the following statements regarding Prashar Lake:");
                stream.newLineAtOffset(0, -12);
                stream.showText("1. It is located in Mandi district.");
                stream.newLineAtOffset(0, -12);
                stream.showText("2. A pagoda-like temple is situated on its bank.");
                stream.newLineAtOffset(0, -12);
                stream.showText("Which of the statements given above is/are correct?");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) 1 only (B) 2 only (C) Both 1 and 2 (D) Neither 1 nor 2");
                stream.newLineAtOffset(0, -14);

                stream.showText(
                        "Q13. Assertion: Timber supply was essential. Reason: Lord Dalhousie negotiated lease in 1864.");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) Both A and R are true (B) Both false (C) A true R false (D) A false R true");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q14. Match List-I with List-II and select the correct answer:");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) A-1, B-2 (B) A-2, B-1 (C) A-1, B-1 (D) None");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q15. Match the following historical temples with founding rulers:");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) 1-a, 2-b (B) 1-b, 2-a (C) 1-a, 2-a (D) None");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q16. Arrange the following events in chronological order:");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) 1-2-3-4 (B) 2-1-3-4 (C) 3-1-2-4 (D) 4-3-2-1");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q17. Arrange the following Himalayan passes in correct sequence:");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) West to East (B) East to West (C) North to South (D) South to North");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q18. Consider the following statements regarding Solan district:");
                stream.newLineAtOffset(0, -12);
                stream.showText("1. Known as Mushroom City.");
                stream.newLineAtOffset(0, -12);
                stream.showText("2. Created in 1972.");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) 1 only (B) 2 only (C) Both 1 and 2 (D) Neither 1 nor 2");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q19. Which conditions must be met for a Money Bill under Article 110?");
                stream.newLineAtOffset(0, -12);
                stream.showText("(A) 1 and 2 only (B) 2 and 3 only (C) 1, 2 and 3 (D) None");
                stream.newLineAtOffset(0, -14);

                stream.showText("Q20. Q20. Broken question without proper options");
                stream.newLineAtOffset(0, -12);

                stream.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }
}
