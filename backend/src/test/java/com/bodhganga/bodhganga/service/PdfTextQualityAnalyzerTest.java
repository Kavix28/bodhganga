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

import static org.junit.jupiter.api.Assertions.*;

class PdfTextQualityAnalyzerTest {

    private PdfTextQualityAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new PdfTextQualityAnalyzer();
    }

    @Test
    @DisplayName("Should detect high-quality digital text PDF as usable")
    void testUsableDigitalTextPdf() throws IOException {
        byte[] pdfBytes = createSyntheticPdfWithText(
                "1. What is the capital of Himachal Pradesh?\n" +
                "(A) Shimla (B) Manali (C) Dharamshala (D) Mandi\n\n" +
                "2. Which district has the highest literacy rate in Himachal Pradesh?\n" +
                "(A) Hamirpur (B) Kangra (C) Una (D) Solan\n\n" +
                "3. The river Beas originates near which pass?\n" +
                "(A) Rohtang Pass (B) Baralacha Pass (C) Shipki La (D) Kunzum Pass\n"
        );

        PdfTextQualityAnalyzer.TextQualityResult result = analyzer.analyze(pdfBytes);

        assertTrue(result.isUsable(), "Digital text PDF should be classified as usable");
        assertTrue(result.getTotalCharacterCount() > 100);
        assertTrue(result.getQualityScore() >= 0.60);
        assertTrue(result.getReason().contains("Usable digital text layer"));
    }

    @Test
    @DisplayName("Should detect empty PDF as unusable")
    void testEmptyPdf() throws IOException {
        byte[] pdfBytes = createSyntheticEmptyPdf();

        PdfTextQualityAnalyzer.TextQualityResult result = analyzer.analyze(pdfBytes);

        assertFalse(result.isUsable(), "Empty PDF should be classified as unusable");
        assertEquals(0, result.getTotalCharacterCount());
        assertTrue(result.getReason().contains("Insufficient text layer"));
    }

    @Test
    @DisplayName("Should handle null or empty byte array gracefully")
    void testNullOrEmptyBytes() throws IOException {
        PdfTextQualityAnalyzer.TextQualityResult nullResult = analyzer.analyze(null);
        assertFalse(nullResult.isUsable());

        PdfTextQualityAnalyzer.TextQualityResult emptyResult = analyzer.analyze(new byte[0]);
        assertFalse(emptyResult.isUsable());
    }

    private byte[] createSyntheticPdfWithText(String text) throws IOException {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream stream = new PDPageContentStream(doc, page)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                stream.newLineAtOffset(50, 700);

                String[] lines = text.split("\n");
                for (String line : lines) {
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
