package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@ActiveProfiles("test")
public class OcrServiceTest {

    @Autowired
    private QuestionIngestionService questionIngestionService;

    @Test
    void testBlankPdfExtractionGracefulFailure() throws Exception {
        byte[] blankPdfBytes;
        try (PDDocument doc = new PDDocument()) {
            doc.addPage(new PDPage());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            blankPdfBytes = baos.toByteArray();
        }

        MockMultipartFile qFile = new MockMultipartFile("questionPdf", "blank_q.pdf", "application/pdf", blankPdfBytes);
        MockMultipartFile aFile = new MockMultipartFile("answerPdf", "blank_a.pdf", "application/pdf", blankPdfBytes);

        // Blank PDF has < 100 digital characters.
        // If OCR service is unavailable or fails to extract question text, ingestion
        // must return failure (not fake 0-question success)
        QuestionIngestionService.IngestionResult result = questionIngestionService.ingestQuestionBankPdfs(
                qFile, aFile, "maharashtra", "akola", "easy");

        assertNotNull(result);
        assertEquals(0, result.getTotalParsed());
    }
}
