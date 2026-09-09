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

    public static class OcrResult {
        private final List<String> pageTexts;
        private final double averageConfidence;
        private final boolean success;

        public OcrResult(List<String> pageTexts, double averageConfidence, boolean success) {
            this.pageTexts = pageTexts;
            this.averageConfidence = averageConfidence;
            this.success = success;
        }

        public List<String> getPageTexts() {
            return pageTexts;
        }

        public double getAverageConfidence() {
            return averageConfidence;
        }

        public boolean isSuccess() {
            return success;
        }
    }

    public OcrResult extractTextFromScannedPdf(byte[] pdfBytes) throws IOException {
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException("PDF byte array cannot be null or empty");
        }

        List<String> pageTexts = new ArrayList<>();
        double totalConfidence = 0.0;
        int pageCount = 0;

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFRenderer renderer = new PDFRenderer(document);
            pageCount = document.getNumberOfPages();

            for (int i = 0; i < pageCount; i++) {
                int pageNumber = i + 1;
                log.info("Rendering PDF page {}/{} for OCR...", pageNumber, pageCount);

                // Render at 200 DPI for high quality OCR without bloated image size
                BufferedImage image = renderer.renderImageWithDPI(i, 200);

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(image, "PNG", baos);
                byte[] imageBytes = baos.toByteArray();

                SinglePageOcrResponse ocrPage = processPageImage(imageBytes, pageNumber);
                pageTexts.add(ocrPage.getText());
                totalConfidence += ocrPage.getConfidence();
            }
        }

        double avgConfidence = pageCount > 0 ? totalConfidence / pageCount : 0.0;
        return new OcrResult(pageTexts, avgConfidence, true);
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
                Number confNum = (Number) responseBody.getOrDefault("confidence", 0.85);
                return new SinglePageOcrResponse(text, confNum.doubleValue());
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

                ProcessBuilder pb = new ProcessBuilder(
                        winTesseract.getAbsolutePath(),
                        tempImage.getAbsolutePath(),
                        tempOutputBase.getAbsolutePath(),
                        "-l", "eng");
                Process process = pb.start();
                process.waitFor();

                File txtFile = new File(tempOutputBase.getAbsolutePath() + ".txt");
                String text = "";
                if (txtFile.exists()) {
                    text = Files.readString(txtFile.toPath());
                    txtFile.delete();
                }
                tempImage.delete();

                return new SinglePageOcrResponse(text, 0.90);
            }
        } catch (Exception e) {
            log.error("Local Tesseract fallback execution failed for page {}: {}", pageNumber, e.getMessage());
        }

        throw new RuntimeException("OCR processing failed on page " + pageNumber
                + ": OCR service is unavailable and local OCR fallback failed");
    }
}
