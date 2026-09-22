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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DocumentExtractionRouterTest {

    private PdfExtractionService pdfExtractionService;
    private OcrService ocrService;
    private PdfTextQualityAnalyzer textQualityAnalyzer;
    private DocumentExtractionRouter router;

    @BeforeEach
    void setUp() {
        pdfExtractionService = mock(PdfExtractionService.class);
        ocrService = mock(OcrService.class);
        textQualityAnalyzer = new PdfTextQualityAnalyzer();
        router = new DocumentExtractionRouter(pdfExtractionService, ocrService, textQualityAnalyzer);
    }

    @Test
    @DisplayName("Should route to TEXT_LAYER when PDF has usable digital text")
    void testRoutesToTextLayer() throws IOException {
        byte[] digitalPdfBytes = createSyntheticPdfWithText(
                "Q1. Which river flows through Kullu valley?\n" +
                "(A) Beas (B) Sutlej (C) Chenab (D) Ravi\n" +
                "Q2. What is the district headquarters of Lahaul and Spiti?\n" +
                "(A) Keylong (B) Kaza (C) Udaipur (D) Recong Peo\n"
        );

        when(pdfExtractionService.extractTextPerPage(any(byte[].class)))
                .thenReturn(List.of("Q1. Which river flows through Kullu valley?\n(A) Beas (B) Sutlej (C) Chenab (D) Ravi"));

        DocumentExtractionRouter.ExtractionResult result = router.routeAndExtract(digitalPdfBytes);

        assertTrue(result.isSuccess());
        assertEquals(DocumentExtractionRouter.ExtractionMethod.TEXT_LAYER, result.getExtractionMethod());
        assertFalse(result.getPageTexts().isEmpty());
        verify(pdfExtractionService, times(1)).extractTextPerPage(digitalPdfBytes);
        verify(ocrService, never()).extractTextFromScannedPdf(any());
    }

    @Test
    @DisplayName("Should route to LOCAL_OCR when PDF lacks usable digital text layer")
    void testRoutesToLocalOcr() throws IOException {
        byte[] scannedPdfBytes = createSyntheticEmptyPdf();

        OcrService.OcrResult mockOcrResult = new OcrService.OcrResult(
                List.of("Scanned OCR extracted page text"),
                0.88,
                true
        );

        when(ocrService.extractTextFromScannedPdf(scannedPdfBytes)).thenReturn(mockOcrResult);

        DocumentExtractionRouter.ExtractionResult result = router.routeAndExtract(scannedPdfBytes);

        assertTrue(result.isSuccess());
        assertEquals(DocumentExtractionRouter.ExtractionMethod.LOCAL_OCR, result.getExtractionMethod());
        assertEquals("Scanned OCR extracted page text", result.getPageTexts().get(0));
        verify(ocrService, times(1)).extractTextFromScannedPdf(scannedPdfBytes);
        verify(pdfExtractionService, never()).extractTextPerPage(any());
    }

    private byte[] createSyntheticPdfWithText(String text) throws IOException {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream stream = new PDPageContentStream(doc, page)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                stream.newLineAtOffset(50, 700);

                for (String line : text.split("\n")) {
                    stream.showText(line);
                    stream.newLineAtOffset(0, -18);
                }
                stream.endText();
            }
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] createSyntheticEmptyPdf() throws IOException {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            doc.addPage(new PDPage());
            doc.save(baos);
            return baos.toByteArray();
        }
    }
}
