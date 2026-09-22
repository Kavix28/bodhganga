package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.repo.QuestionRepo;
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
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = BodhgangaApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class EastJaintiaIngestionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private QuestionRepo questionRepo;

    @BeforeEach
    void setUp() {
        if (questionRepo != null) {
            questionRepo.deleteAll();
        }
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testEastJaintiaAdminPdfIngestionAndValidation() throws Exception {
        byte[] questionPdfBytes = createSampleEastJaintiaQuestionPdf();
        byte[] answerPdfBytes = createSampleEastJaintiaAnswerPdf();

        MockMultipartFile qFile = new MockMultipartFile(
                "questionPdf", "east-jaintia-questions.pdf", "application/pdf", questionPdfBytes);
        MockMultipartFile aFile = new MockMultipartFile(
                "answerPdf", "east-jaintia-answers.pdf", "application/pdf", answerPdfBytes);

        // 1. First upload through Admin Controller (/api/admin/quiz/upload)
        mockMvc.perform(multipart("/api/admin/quiz/upload")
                .file(qFile)
                .file(aFile)
                .param("stateSlug", "meghalaya")
                .param("districtSlug", "east-jaintia-hills")
                .param("testType", "PRELIMS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalParsed", greaterThanOrEqualTo(2)));

        List<Question> ingested = questionRepo.findByStateSlugAndDistrictSlug("meghalaya", "east-jaintia-hills");
        assertFalse(ingested.isEmpty());

        // Verify status remains DRAFT or REVIEW_REQUIRED (no auto-publishing)
        boolean allUnpublished = ingested.stream().noneMatch(q -> "PUBLISHED".equalsIgnoreCase(q.getStatus()));
        assertTrue(allUnpublished, "Ingested questions must NOT be automatically published");

        long foundationCount = ingested.stream().filter(q -> "foundation".equalsIgnoreCase(q.getLevel())).count();
        long statementCount = ingested.stream()
                .filter(q -> "statement-based".equalsIgnoreCase(q.getLevel())
                        || "upsc-level".equalsIgnoreCase(q.getLevel()))
                .count();

        assertTrue(foundationCount > 0, "Expected Foundation-level questions");
        assertTrue(statementCount > 0, "Expected Statement-Based / UPSC-level questions");

        // 2. Test Idempotency: Uploading identical files must skip duplication
        mockMvc.perform(multipart("/api/admin/quiz/upload")
                .file(qFile)
                .file(aFile)
                .param("stateSlug", "meghalaya")
                .param("districtSlug", "east-jaintia-hills")
                .param("testType", "PRELIMS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message", containsString("idempotent skip")));

        List<Question> ingestedAfterReupload = questionRepo.findByStateSlugAndDistrictSlug("meghalaya",
                "east-jaintia-hills");
        assertEquals(ingested.size(), ingestedAfterReupload.size(),
                "Re-uploading duplicate PDF pair should not create duplicate records");
    }

    private byte[] createSampleEastJaintiaQuestionPdf() throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page1 = new PDPage();
            doc.addPage(page1);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page1)) {
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                cs.beginText();
                cs.newLineAtOffset(50, 750);
                cs.showText("East Jaintia Hills District Question Bank - Meghalaya");
                cs.newLineAtOffset(0, -25);
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                cs.showText("Q1. What is the headquarters of East Jaintia Hills district?");
                cs.newLineAtOffset(0, -15);
                cs.showText("(A) Khliehriat (B) Jowai (C) Nongpoh (D) Shillong");
                cs.newLineAtOffset(0, -25);
                cs.showText("Q2. Consider the following statements regarding East Jaintia Hills:");
                cs.newLineAtOffset(0, -15);
                cs.showText("Statement 1. It was bifurcated from West Jaintia Hills in 2012.");
                cs.newLineAtOffset(0, -15);
                cs.showText("Statement 2. The Lukha River flows through this district.");
                cs.newLineAtOffset(0, -15);
                cs.showText("Which of the statements given above is/are correct?");
                cs.newLineAtOffset(0, -15);
                cs.showText("(A) 1 only (B) 2 only (C) Both 1 and 2 (D) Neither 1 nor 2");
                cs.endText();
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] createSampleEastJaintiaAnswerPdf() throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page1 = new PDPage();
            doc.addPage(page1);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page1)) {
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                cs.beginText();
                cs.newLineAtOffset(50, 750);
                cs.showText("East Jaintia Hills Solutions");
                cs.newLineAtOffset(0, -25);
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                cs.showText("Q1. Answer: (A) Khliehriat");
                cs.newLineAtOffset(0, -15);
                cs.showText("Explanation: Khliehriat is the district headquarters of East Jaintia Hills.");
                cs.newLineAtOffset(0, -25);
                cs.showText("Q2. Answer: (C) Both 1 and 2");
                cs.newLineAtOffset(0, -15);
                cs.showText("Explanation: Both statements are correct regarding the bifurcation and Lukha river.");
                cs.endText();
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }
}
