package com.bodhganga.bodhganga.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Deterministic analyzer for evaluating whether a PDF document contains a usable digital text layer.
 * Prevents calling OCR unnecessarily when high-quality digital text is present,
 * and detects scanned or poor-quality text layers (garbage text) to trigger local OCR.
 */
@Component
public class PdfTextQualityAnalyzer {

    private static final Logger log = LoggerFactory.getLogger(PdfTextQualityAnalyzer.class);

    // Minimum average characters per page to consider digital text present
    private static final int MIN_AVG_CHARS_PER_PAGE = 40;
    // Minimum printable characters per page
    private static final int MIN_PRINTABLE_CHARS_PER_PAGE = 30;
    // Maximum allowed ratio of suspicious/unmapped control characters
    private static final double MAX_SUSPICIOUS_RATIO = 0.20;
    // Minimum overall quality score threshold
    private static final double MIN_QUALITY_SCORE_THRESHOLD = 0.60;

    public static class PageTextQuality {
        private final int pageNumber;
        private final int characterCount;
        private final int nonWhitespaceCount;
        private final int printableCount;
        private final int suspiciousCount;
        private final int wordCount;
        private final double whitespaceRatio;
        private final double suspiciousRatio;
        private final double qualityScore;
        private final boolean usable;

        public PageTextQuality(int pageNumber, int characterCount, int nonWhitespaceCount,
                               int printableCount, int suspiciousCount, int wordCount,
                               double whitespaceRatio, double suspiciousRatio,
                               double qualityScore, boolean usable) {
            this.pageNumber = pageNumber;
            this.characterCount = characterCount;
            this.nonWhitespaceCount = nonWhitespaceCount;
            this.printableCount = printableCount;
            this.suspiciousCount = suspiciousCount;
            this.wordCount = wordCount;
            this.whitespaceRatio = whitespaceRatio;
            this.suspiciousRatio = suspiciousRatio;
            this.qualityScore = qualityScore;
            this.usable = usable;
        }

        public int getPageNumber() { return pageNumber; }
        public int getCharacterCount() { return characterCount; }
        public int getNonWhitespaceCount() { return nonWhitespaceCount; }
        public int getPrintableCount() { return printableCount; }
        public int getSuspiciousCount() { return suspiciousCount; }
        public int getWordCount() { return wordCount; }
        public double getWhitespaceRatio() { return whitespaceRatio; }
        public double getSuspiciousRatio() { return suspiciousRatio; }
        public double getQualityScore() { return qualityScore; }
        public boolean isUsable() { return usable; }
    }

    public static class TextQualityResult {
        private final boolean usable;
        private final int totalCharacterCount;
        private final double averageCharacterCountPerPage;
        private final double qualityScore;
        private final String reason;
        private final List<PageTextQuality> pageQualities;

        public TextQualityResult(boolean usable, int totalCharacterCount, double averageCharacterCountPerPage,
                                 double qualityScore, String reason, List<PageTextQuality> pageQualities) {
            this.usable = usable;
            this.totalCharacterCount = totalCharacterCount;
            this.averageCharacterCountPerPage = averageCharacterCountPerPage;
            this.qualityScore = qualityScore;
            this.reason = reason;
            this.pageQualities = pageQualities;
        }

        public boolean isUsable() { return usable; }
        public int getTotalCharacterCount() { return totalCharacterCount; }
        public double getAverageCharacterCountPerPage() { return averageCharacterCountPerPage; }
        public double getQualityScore() { return qualityScore; }
        public String getReason() { return reason; }
        public List<PageTextQuality> getPageQualities() { return pageQualities; }
    }

    public TextQualityResult analyze(byte[] pdfBytes) throws IOException {
        if (pdfBytes == null || pdfBytes.length == 0) {
            return new TextQualityResult(false, 0, 0.0, 0.0,
                    "PDF byte array is null or empty", List.of());
        }

        List<PageTextQuality> pageQualities = new ArrayList<>();
        int totalChars = 0;
        int totalUsablePages = 0;
        double sumQualityScores = 0.0;

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            int pageCount = document.getNumberOfPages();

            if (pageCount == 0) {
                return new TextQualityResult(false, 0, 0.0, 0.0,
                        "PDF contains 0 pages", List.of());
            }

            for (int p = 1; p <= pageCount; p++) {
                stripper.setStartPage(p);
                stripper.setEndPage(p);
                String pageText = stripper.getText(document);
                if (pageText == null) {
                    pageText = "";
                }

                PageTextQuality pageQual = analyzePageText(p, pageText);
                pageQualities.add(pageQual);

                totalChars += pageQual.getCharacterCount();
                if (pageQual.isUsable()) {
                    totalUsablePages++;
                }
                sumQualityScores += pageQual.getQualityScore();
            }

            double avgCharsPerPage = (double) totalChars / pageCount;
            double avgQualityScore = sumQualityScores / pageCount;
            double usablePageRatio = (double) totalUsablePages / pageCount;

            boolean overallUsable = totalChars >= 100
                    && avgCharsPerPage >= MIN_AVG_CHARS_PER_PAGE
                    && usablePageRatio >= 0.75
                    && avgQualityScore >= MIN_QUALITY_SCORE_THRESHOLD;

            String reason;
            if (overallUsable) {
                reason = String.format("Usable digital text layer: %d total chars across %d pages (avg %.1f chars/page, quality score: %.2f)",
                        totalChars, pageCount, avgCharsPerPage, avgQualityScore);
            } else if (totalChars < 100) {
                reason = String.format("Insufficient text layer: only %d total chars across %d pages (likely scanned PDF)",
                        totalChars, pageCount);
            } else if (usablePageRatio < 0.75) {
                reason = String.format("Poor text layer quality: only %d of %d pages contain usable text (usable ratio: %.2f)",
                        totalUsablePages, pageCount, usablePageRatio);
            } else {
                reason = String.format("Text layer quality score too low: %.2f (threshold: %.2f)",
                        avgQualityScore, MIN_QUALITY_SCORE_THRESHOLD);
            }

            log.info("PDF Text Quality Analysis complete: usable={}, reason='{}'", overallUsable, reason);
            return new TextQualityResult(overallUsable, totalChars, avgCharsPerPage, avgQualityScore, reason, pageQualities);
        }
    }

    private PageTextQuality analyzePageText(int pageNumber, String pageText) {
        int charCount = pageText.length();
        if (charCount == 0) {
            return new PageTextQuality(pageNumber, 0, 0, 0, 0, 0,
                    0.0, 0.0, 0.0, false);
        }

        int nonWsCount = 0;
        int printableCount = 0;
        int suspiciousCount = 0;

        for (int i = 0; i < charCount; i++) {
            char c = pageText.charAt(i);
            if (!Character.isWhitespace(c)) {
                nonWsCount++;
            }

            // Printable check: Standard Unicode Letters/Digits/Punctuation or Devanagari block (\u0900-\u097F)
            if (Character.isLetterOrDigit(c)
                    || (c >= '\u0900' && c <= '\u097F')
                    || (c >= 32 && c <= 126)) {
                printableCount++;
            }

            // Suspicious / garbage text check: Unmapped replacement char or unexpected control characters
            if (c == '\uFFFD' || (c < 32 && c != '\n' && c != '\r' && c != '\t')) {
                suspiciousCount++;
            }
        }

        double wsRatio = (double) (charCount - nonWsCount) / charCount;
        double suspRatio = (double) suspiciousCount / charCount;

        // Word count (tokens of length >= 2 consisting of letters/digits/Devanagari)
        String[] tokens = pageText.split("\\s+");
        int wordCount = 0;
        for (String token : tokens) {
            if (token.length() >= 2 && token.matches(".*[\\p{L}\\p{N}\\u0900-\\u097F].*")) {
                wordCount++;
            }
        }

        double charScore = Math.min(1.0, (double) printableCount / 100.0);
        double wordScore = Math.min(1.0, (double) wordCount / 15.0);
        double suspPenalty = suspRatio * 2.0;

        double qualityScore = Math.max(0.0, Math.min(1.0, (0.5 * charScore) + (0.5 * wordScore) - suspPenalty));

        boolean pageUsable = charCount >= MIN_AVG_CHARS_PER_PAGE
                && printableCount >= MIN_PRINTABLE_CHARS_PER_PAGE
                && suspRatio <= MAX_SUSPICIOUS_RATIO
                && wordCount >= 3;

        return new PageTextQuality(pageNumber, charCount, nonWsCount, printableCount, suspiciousCount, wordCount,
                wsRatio, suspRatio, qualityScore, pageUsable);
    }
}
