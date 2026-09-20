package com.bodhganga.bodhganga.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class OcrService {

    private static final Logger log = LoggerFactory.getLogger(OcrService.class);

    @Value("${bodhganga.ocr.endpoint:${OCR_SERVICE_URL:http://localhost:8000}/ocr}")
    private String ocrEndpoint;

    public String getEffectiveEndpoint() {
        if (ocrEndpoint == null || ocrEndpoint.isBlank()) {
            return "http://localhost:8000/ocr";
        }
        String endpoint = ocrEndpoint.trim();
        if (!endpoint.endsWith("/ocr")) {
            if (endpoint.endsWith("/")) {
                endpoint = endpoint + "ocr";
            } else {
                endpoint = endpoint + "/ocr";
            }
        }
        return endpoint;
    }

    private final RestTemplate restTemplate = new RestTemplate();

    public static class PageOcrResult {
        private final int pageNumber;
        private final String rawText;
        private final double confidence;
        private final boolean success;
        private final String errorMessage;

        public PageOcrResult(int pageNumber, String rawText, double confidence, boolean success, String errorMessage) {
            this.pageNumber = pageNumber;
            this.rawText = rawText;
            this.confidence = confidence;
            this.success = success;
            this.errorMessage = errorMessage;
        }

        public int getPageNumber() {
            return pageNumber;
        }

        public String getRawText() {
            return rawText;
        }

        public double getConfidence() {
            return confidence;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }

    public static class OcrResult {
        private final List<String> pageTexts;
        private final List<PageOcrResult> pageResults;
        private final double averageConfidence;
        private final boolean success;
        private final int failedPagesCount;

        public OcrResult(List<String> pageTexts, List<PageOcrResult> pageResults, double averageConfidence,
                boolean success, int failedPagesCount) {
            this.pageTexts = pageTexts;
            this.pageResults = pageResults;
            this.averageConfidence = averageConfidence;
            this.success = success;
            this.failedPagesCount = failedPagesCount;
        }

        public OcrResult(List<String> pageTexts, double averageConfidence, boolean success) {
            this(pageTexts, new ArrayList<>(), averageConfidence, success, 0);
        }

        public List<String> getPageTexts() {
            return pageTexts;
        }

        public List<PageOcrResult> getPageResults() {
            return pageResults;
        }

        public double getAverageConfidence() {
            return averageConfidence;
        }

        public boolean isSuccess() {
            return success;
        }

        public int getFailedPagesCount() {
            return failedPagesCount;
        }
    }

    public OcrResult extractTextFromScannedPdf(byte[] pdfBytes) throws IOException {
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException("PDF byte array cannot be null or empty");
        }

        List<String> pageTexts = new ArrayList<>();
        List<PageOcrResult> pageResults = new ArrayList<>();
        double totalConfidence = 0.0;
        int pageCount = 0;
        int failedPages = 0;

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFRenderer renderer = new PDFRenderer(document);
            pageCount = document.getNumberOfPages();
            log.info("Starting OCR processing for PDF with {} pages...", pageCount);

            for (int i = 0; i < pageCount; i++) {
                int pageNumber = i + 1;
                log.info("Rendering PDF page {}/{} at 300 DPI for OCR...", pageNumber, pageCount);

                try {
                    BufferedImage image = renderer.renderImageWithDPI(i, 300);

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    ImageIO.write(image, "PNG", baos);
                    byte[] imageBytes = baos.toByteArray();

                    SinglePageOcrResponse ocrPage = processPageImage(imageBytes, pageNumber);
                    pageTexts.add(ocrPage.getText());
                    totalConfidence += ocrPage.getConfidence();

                    PageOcrResult pageRes = new PageOcrResult(pageNumber, ocrPage.getText(), ocrPage.getConfidence(),
                            true, null);
                    pageResults.add(pageRes);
                    log.info("OCR completed for page {}/{} (Confidence: {}, text length: {} chars)",
                            pageNumber, pageCount, String.format("%.2f", ocrPage.getConfidence()),
                            ocrPage.getText().length());
                } catch (Exception e) {
                    failedPages++;
                    log.error("OCR failed for page {}/{}: {}", pageNumber, pageCount, e.getMessage());
                    pageTexts.add("");
                    pageResults.add(new PageOcrResult(pageNumber, "", 0.0, false, e.getMessage()));
                }
            }
        }

        int successfulPages = pageCount - failedPages;
        double avgConfidence = successfulPages > 0 ? totalConfidence / successfulPages : 0.0;
        boolean overallSuccess = failedPages < pageCount;

        log.info("PDF OCR completed: {}/{} pages succeeded, average confidence: {}",
                successfulPages, pageCount, String.format("%.2f", avgConfidence));

        return new OcrResult(pageTexts, pageResults, avgConfidence, overallSuccess, failedPages);
    }

    private static class SinglePageOcrResponse {
        private final String text;
        private final double confidence;

        public SinglePageOcrResponse(String text, double confidence) {
            this.text = text;
            this.confidence = confidence;
        }

        public String getText() {
            return text;
        }

        public double getConfidence() {
            return confidence;
        }
    }

    @Value("${bodhganga.ocr.languages:${OCR_LANGUAGES:eng+mar}}")
    private String ocrLanguages;

    public String getOcrLanguages() {
        return ocrLanguages != null && !ocrLanguages.isBlank() ? ocrLanguages.trim() : "eng+mar";
    }

    private SinglePageOcrResponse processPageImage(byte[] imageBytes, int pageNumber) {
        // Attempt 1: Call FastAPI OCR service endpoint
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return "page_" + pageNumber + ".png";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    getEffectiveEndpoint(), HttpMethod.POST, requestEntity,
                    (Class<Map<String, Object>>) (Class<?>) Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String text = (String) responseBody.getOrDefault("text", "");
                Number confNum = (Number) responseBody.get("confidence");
                double confidence = confNum != null ? confNum.doubleValue() : -1.0;
                if (confidence >= 0.0) {
                    confidence = Math.max(0.0, Math.min(1.0, confidence));
                }
                return new SinglePageOcrResponse(text, confidence);
            }
        } catch (Exception e) {
            log.warn("OCR HTTP endpoint call failed for page {}: {}", pageNumber, e.getMessage());
        }

        // Attempt 2: Fallback to local Tesseract executable if present on Windows host
        try {
            File winTesseract = new File("C:\\Program Files\\Tesseract-OCR\\tesseract.exe");
            if (winTesseract.exists()) {
                File tempImage = File.createTempFile("ocr_page_" + pageNumber + "_", ".png");
                Files.write(tempImage.toPath(), imageBytes);

                File tempOutputBase = new File(tempImage.getParentFile(),
                        "ocr_out_" + pageNumber + "_" + System.currentTimeMillis());

                String langToUse = getOcrLanguages();
                File tessdataDir = new File(winTesseract.getParentFile(), "tessdata");
                if (langToUse.contains("mar")) {
                    File marTrained = new File(tessdataDir, "mar.traineddata");
                    if (!marTrained.exists()) {
                        log.warn(
                                "Marathi OCR traineddata (mar.traineddata) not found at {}. Falling back to 'eng' for local Tesseract",
                                marTrained.getAbsolutePath());
                        langToUse = "eng";
                    }
                }

                ProcessBuilder pb = new ProcessBuilder(
                        winTesseract.getAbsolutePath(),
                        tempImage.getAbsolutePath(),
                        tempOutputBase.getAbsolutePath(),
                        "-l", langToUse,
                        "--psm", "6",
                        "txt", "tsv");
                Process process = pb.start();
                process.waitFor();

                File txtFile = new File(tempOutputBase.getAbsolutePath() + ".txt");
                File tsvFile = new File(tempOutputBase.getAbsolutePath() + ".tsv");
                String text = "";
                if (txtFile.exists()) {
                    text = Files.readString(txtFile.toPath());
                    txtFile.delete();
                }

                double confidence = -1.0; // Sentinel for unknown confidence if TSV parsing fails
                if (tsvFile.exists()) {
                    try {
                        List<String> tsvLines = Files.readAllLines(tsvFile.toPath());
                        long totalConf = 0;
                        int wordCount = 0;
                        for (int i = 1; i < tsvLines.size(); i++) {
                            String[] cols = tsvLines.get(i).split("\t");
                            if (cols.length >= 11) {
                                try {
                                    int c = Integer.parseInt(cols[10].trim());
                                    if (c >= 0) {
                                        totalConf += c;
                                        wordCount++;
                                    }
                                } catch (NumberFormatException ignored) {
                                }
                            }
                        }
                        if (wordCount > 0) {
                            confidence = (double) totalConf / wordCount / 100.0;
                            confidence = Math.max(0.0, Math.min(1.0, confidence));
                        }
                    } catch (Exception tsvEx) {
                        log.warn("Could not calculate word confidence from TSV for page {}: {}", pageNumber,
                                tsvEx.getMessage());
                    } finally {
                        tsvFile.delete();
                    }
                }

                tempImage.delete();

                return new SinglePageOcrResponse(text, confidence);
            }
        } catch (Exception e) {
            log.error("Local Tesseract fallback execution failed for page {}: {}", pageNumber, e.getMessage());
        }

        throw new RuntimeException("OCR processing failed on page " + pageNumber
                + ": OCR service is unavailable and local OCR fallback failed");
    }
}
