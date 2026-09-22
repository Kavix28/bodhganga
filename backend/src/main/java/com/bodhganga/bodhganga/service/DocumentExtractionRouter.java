package com.bodhganga.bodhganga.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

/**
 * Local-first Document Extraction Router.
 * Determines whether to extract PDF text via PDFBox digital text layer or Local OCR (Tesseract),
 * guaranteeing zero reliance on external Vision APIs.
 */
@Service
public class DocumentExtractionRouter {

    private static final Logger log = LoggerFactory.getLogger(DocumentExtractionRouter.class);

    public enum ExtractionMethod {
        TEXT_LAYER,
        LOCAL_OCR
    }

    public static class ExtractionResult {
        private final ExtractionMethod extractionMethod;
        private final List<String> pageTexts;
        private final PdfTextQualityAnalyzer.TextQualityResult textQuality;
        private final OcrService.OcrResult ocrResult;
        private final boolean success;
        private final String message;

        public ExtractionResult(ExtractionMethod extractionMethod, List<String> pageTexts,
                                PdfTextQualityAnalyzer.TextQualityResult textQuality,
                                OcrService.OcrResult ocrResult, boolean success, String message) {
            this.extractionMethod = extractionMethod;
            this.pageTexts = pageTexts;
            this.textQuality = textQuality;
            this.ocrResult = ocrResult;
            this.success = success;
            this.message = message;
        }

        public ExtractionMethod getExtractionMethod() { return extractionMethod; }
        public List<String> getPageTexts() { return pageTexts; }
        public PdfTextQualityAnalyzer.TextQualityResult getTextQuality() { return textQuality; }
        public OcrService.OcrResult getOcrResult() { return ocrResult; }
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }

    private final PdfExtractionService pdfExtractionService;
    private final OcrService ocrService;
    private final PdfTextQualityAnalyzer pdfTextQualityAnalyzer;

    public DocumentExtractionRouter(PdfExtractionService pdfExtractionService,
                                   OcrService ocrService,
                                   PdfTextQualityAnalyzer pdfTextQualityAnalyzer) {
        this.pdfExtractionService = pdfExtractionService;
        this.ocrService = ocrService;
        this.pdfTextQualityAnalyzer = pdfTextQualityAnalyzer;
    }

    public ExtractionResult routeAndExtract(byte[] pdfBytes) throws IOException {
        if (pdfBytes == null || pdfBytes.length == 0) {
            return new ExtractionResult(ExtractionMethod.TEXT_LAYER, List.of(), null, null, false,
                    "PDF byte array is null or empty");
        }

        PdfTextQualityAnalyzer.TextQualityResult qualityResult = pdfTextQualityAnalyzer.analyze(pdfBytes);

        if (qualityResult.isUsable()) {
            log.info("Local-First Router decision: [TEXT_LAYER] -> {}", qualityResult.getReason());
            List<String> pageTexts = pdfExtractionService.extractTextPerPage(pdfBytes);
            return new ExtractionResult(
                    ExtractionMethod.TEXT_LAYER,
                    pageTexts,
                    qualityResult,
                    null,
                    true,
                    "Extracted via PDFBox text layer: " + qualityResult.getReason()
            );
        } else {
            log.info("Local-First Router decision: [LOCAL_OCR] -> {}", qualityResult.getReason());
            try {
                OcrService.OcrResult ocrResult = ocrService.extractTextFromScannedPdf(pdfBytes);
                List<String> pageTexts = ocrResult.getPageTexts();
                return new ExtractionResult(
                        ExtractionMethod.LOCAL_OCR,
                        pageTexts,
                        qualityResult,
                        ocrResult,
                        ocrResult.isSuccess(),
                        "Extracted via Local OCR (Tesseract): " + ocrResult.getAverageConfidence() + " avg confidence"
                );
            } catch (Exception e) {
                log.error("Local OCR pipeline failed during document routing: {}", e.getMessage(), e);
                return new ExtractionResult(
                        ExtractionMethod.LOCAL_OCR,
                        List.of(),
                        qualityResult,
                        null,
                        false,
                        "Local OCR processing failed: " + e.getMessage()
                );
            }
        }
    }
}
