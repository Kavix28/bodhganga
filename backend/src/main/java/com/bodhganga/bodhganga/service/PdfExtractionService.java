package com.bodhganga.bodhganga.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfExtractionService {

    private static final Logger log = LoggerFactory.getLogger(PdfExtractionService.class);

    private final OcrService ocrService;

    public PdfExtractionService(OcrService ocrService) {
        this.ocrService = ocrService;
    }

    public List<String> extractTextPerPage(byte[] pdfBytes) throws IOException {
        List<String> pagesText = new ArrayList<>();
        if (pdfBytes == null || pdfBytes.length == 0) {
            return pagesText;
        }

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            int totalPages = document.getNumberOfPages();
            for (int i = 1; i <= totalPages; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String text = stripper.getText(document);
                pagesText.add(text != null ? text.trim() : "");
            }
        }

        int totalDigitalChars = pagesText.stream().mapToInt(String::length).sum();
        log.info("Extracted digital text character count: {}", totalDigitalChars);

        // Check if any individual page has insufficient digital text (< 30 chars)
        boolean hasInsufficientPages = pagesText.stream().anyMatch(t -> t == null || t.trim().length() < 30);

        if (hasInsufficientPages || totalDigitalChars < 100) {
            log.info(
                    "Digital text layer insufficient (<100 total chars or blank pages detected). Invoking OCR engine pipeline...");
            OcrService.OcrResult ocrResult = ocrService.extractTextFromScannedPdf(pdfBytes);
            return ocrResult.getPageTexts();
        }

        return pagesText;
    }

    public String extractFullText(byte[] pdfBytes) throws IOException {
        List<String> pages = extractTextPerPage(pdfBytes);
        return String.join("\n", pages);
    }
}
