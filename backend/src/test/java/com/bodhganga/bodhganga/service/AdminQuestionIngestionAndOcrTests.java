package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.repo.QuestionRepo;
import com.bodhganga.bodhganga.repo.QuizAttemptRepo;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = BodhgangaApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminQuestionIngestionAndOcrTests {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private QuestionRepo questionRepo;

        @Autowired
        private QuizAttemptRepo quizAttemptRepo;

        @Autowired
        private QuestionParserService questionParserService;

        @Autowired
        private AnswerParserService answerParserService;

        @Autowired
        private QuestionMatchingService questionMatchingService;

        @Autowired
        private QuestionIngestionService questionIngestionService;

        @BeforeEach
        void setUp() {
                questionRepo.deleteAll();
                quizAttemptRepo.deleteAll();
        }

        private byte[] createSamplePdfBytes(List<String> lines) throws IOException {
                try (PDDocument doc = new PDDocument()) {
                        PDPage page = new PDPage();
                        doc.addPage(page);
                        try (PDPageContentStream contentStream = new PDPageContentStream(doc, page)) {
                                contentStream.beginText();
                                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                                contentStream.newLineAtOffset(50, 700);
                                for (String line : lines) {
                                        contentStream.showText(line);
                                        contentStream.newLineAtOffset(0, -15);
                                }
                                contentStream.endText();
                        }
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        doc.save(baos);
                        return baos.toByteArray();
                }
        }

        @Test
        void test1_unauthorizedUploadRejected() throws Exception {
                mockMvc.perform(multipart("/api/admin/quiz/upload"))
                                .andExpect(status().is4xxClientError());
        }

        @Test
        @WithMockUser(authorities = "ROLE_USER")
        void test2_nonAdminUploadRejected() throws Exception {
                mockMvc.perform(multipart("/api/admin/quiz/upload"))
                                .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(authorities = "ROLE_ADMIN")
        void test3_validPdfAccepted() throws Exception {
                byte[] qPdf = createSamplePdfBytes(Arrays.asList(
                                "History",
                                "Q1. What is Akola history?",
                                "(A) OptA",
                                "(B) OptB",
                                "(C) OptC",
                                "(D) OptD"));
                byte[] aPdf = createSamplePdfBytes(Arrays.asList(
                                "Q1. (A) Akola is a historic city."));

                MockMultipartFile qFile = new MockMultipartFile("questionPdf", "q.pdf", "application/pdf", qPdf);
                MockMultipartFile aFile = new MockMultipartFile("answerPdf", "a.pdf", "application/pdf", aPdf);

                mockMvc.perform(multipart("/api/admin/quiz/upload")
                                .file(qFile)
                                .file(aFile)
                                .param("stateSlug", "maharashtra")
                                .param("districtSlug", "akola")
                                .param("testType", "easy"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.totalParsed").value(greaterThanOrEqualTo(1)));
        }

        @Test
        @WithMockUser(authorities = "ROLE_ADMIN")
        void test4_invalidFileHeaderRejected() throws Exception {
                MockMultipartFile invalidFile = new MockMultipartFile("questionPdf", "bad.txt", "text/plain",
                                "NOT A PDF".getBytes());
                MockMultipartFile aFile = new MockMultipartFile("answerPdf", "a.pdf", "application/pdf",
                                "%PDF-1.4".getBytes());

                mockMvc.perform(multipart("/api/admin/quiz/upload")
                                .file(invalidFile)
                                .file(aFile)
                                .param("stateSlug", "maharashtra")
                                .param("districtSlug", "akola")
                                .param("testType", "easy"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.message", containsString("magic bytes")));
        }

        @Test
        void test8_questionParserExtractsStructuredFields() {
                List<String> pages = Arrays.asList(
                                "History\nQ1. Which river flows through Akola?\n(A) Morna\n(B) Ganga\n(C) Yamuna\n(D) Godavari\n\nQ2. Akola is famous for?\n(A) Cotton\n(B) Silk\n(C) Tea\n(D) Jute\n");
                List<QuestionParserService.ParsedQuestion> parsed = questionParserService
                                .parseQuestionsFromPages(pages);
                assertEquals(2, parsed.size());
                assertEquals(1, parsed.get(0).getQuestionNumber());
                assertEquals("Which river flows through Akola?", parsed.get(0).getQuestionText());
                assertEquals(4, parsed.get(0).getOptions().size());
                assertEquals("History", parsed.get(0).getTopic());
        }

        @Test
        void test9_answerParserExtractsOptionIndexAndExplanation() {
                List<String> pages = Arrays.asList(
                                "Q1. (a) Morna river flows through Akola district.\nQ2. (a) Akola is known as the Cotton city of Maharashtra.\n");
                Map<Integer, AnswerParserService.ParsedAnswer> answers = answerParserService
                                .parseAnswersFromPages(pages);
                assertEquals(2, answers.size());
                assertNotNull(answers.get(1));
                assertEquals(0, answers.get(1).getCorrectOptionIndex()); // 0 = A
                assertTrue(answers.get(1).getExplanation().contains("Morna river"));
        }

        @Test
        void test10_questionAnswerMatchingCreatesDraftOrReviewRequired() {
                QuestionParserService.ParsedQuestion pq1 = QuestionParserService.ParsedQuestion.builder()
                                .questionNumber(1)
                                .questionText("Valid Q1 text")
                                .options(Arrays.asList("Opt A", "Opt B", "Opt C", "Opt D"))
                                .topic("Geography")
                                .level("foundation")
                                .difficulty("Easy")
                                .pageNumber(1)
                                .isSuspicious(false)
                                .build();

                AnswerParserService.ParsedAnswer pa1 = AnswerParserService.ParsedAnswer.builder()
                                .questionNumber(1)
                                .correctOptionIndex(1)
                                .explanation("Valid explanation for Q1")
                                .pageNumber(1)
                                .build();

                Map<Integer, AnswerParserService.ParsedAnswer> answerMap = new HashMap<>();
                answerMap.put(1, pa1);

                List<Question> result = questionMatchingService.matchAndBuildQuestions(
                                Arrays.asList(pq1), answerMap, "maharashtra", "akola", "easy", "doc1", "qKey", "aKey",
                                "hash123");

                assertEquals(1, result.size());
                assertEquals("DRAFT", result.get(0).getStatus());
                assertFalse(result.get(0).getIsActive());
                assertEquals(1, result.get(0).getCorrectAnswer());
        }

        @Test
        void test11_missingAnswerTriggersReviewRequired() {
                QuestionParserService.ParsedQuestion pq1 = QuestionParserService.ParsedQuestion.builder()
                                .questionNumber(1)
                                .questionText("Missing answer Q1")
                                .options(Arrays.asList("Opt A", "Opt B", "Opt C", "Opt D"))
                                .topic("History")
                                .pageNumber(1)
                                .build();

                List<Question> result = questionMatchingService.matchAndBuildQuestions(
                                Arrays.asList(pq1), Collections.emptyMap(), "maharashtra", "akola", "easy", "doc1",
                                "qKey", "aKey", "hash123");

                assertEquals(1, result.size());
                assertEquals("REVIEW_REQUIRED", result.get(0).getStatus());
        }

        @Test
        void test14_duplicateSourceIngestionIsIdempotent() throws Exception {
                byte[] qPdf = createSamplePdfBytes(Arrays.asList(
                                "History",
                                "Q1. Akola Q?",
                                "(A) A",
                                "(B) B",
                                "(C) C",
                                "(D) D"));
                byte[] aPdf = createSamplePdfBytes(Arrays.asList(
                                "Q1. (A) Exp"));

                MockMultipartFile qFile = new MockMultipartFile("questionPdf", "q.pdf", "application/pdf", qPdf);
                MockMultipartFile aFile = new MockMultipartFile("answerPdf", "a.pdf", "application/pdf", aPdf);

                QuestionIngestionService.IngestionResult res1 = questionIngestionService.ingestQuestionBankPdfs(
                                qFile, aFile, "maharashtra", "akola", "easy");
                assertTrue(res1.isSuccess());

                QuestionIngestionService.IngestionResult res2 = questionIngestionService.ingestQuestionBankPdfs(
                                qFile, aFile, "maharashtra", "akola", "easy");
                assertTrue(res2.isSuccess());
                assertTrue(res2.getMessage().contains("idempotent skip"));
        }

        @Test
        @WithMockUser(authorities = "ROLE_ADMIN")
        void test16_draftQuestionsHiddenFromPublicEndpointUntilPublished() throws Exception {
                Question draftQ = Question.builder()
                                .id("mh-akola-easy-1")
                                .stateSlug("maharashtra")
                                .districtSlug("akola")
                                .testType("easy")
                                .question("Draft Q text")
                                .options(Arrays.asList("A", "B", "C", "D"))
                                .correctAnswer(0)
                                .explanation("Draft exp")
                                .status("DRAFT")
                                .isActive(false)
                                .build();
                questionRepo.save(draftQ);

                // Verify public API hides DRAFT question
                mockMvc.perform(get("/api/quiz/questions")
                                .param("stateSlug", "maharashtra")
                                .param("districtSlug", "akola")
                                .param("testType", "easy"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data", hasSize(0)));

                // Publish question via admin endpoint
                mockMvc.perform(post("/api/admin/quiz/questions/mh-akola-easy-1/publish"))
                                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                                .andExpect(status().isOk());

                // Verify public API returns PUBLISHED question
                mockMvc.perform(get("/api/quiz/questions")
                                .param("stateSlug", "maharashtra")
                                .param("districtSlug", "akola")
                                .param("testType", "easy"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data", hasSize(1)))
                                .andExpect(jsonPath("$.data[0].id").value("mh-akola-easy-1"))
                                .andExpect(jsonPath("$.data[0].correctAnswer").doesNotExist())
                                .andExpect(jsonPath("$.data[0].explanation").doesNotExist());
        }
}
