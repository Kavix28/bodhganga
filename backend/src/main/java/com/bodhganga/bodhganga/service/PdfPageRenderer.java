package com.bodhganga.bodhganga.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfPageRenderer {

    private static final Logger log = LoggerFactory.getLogger(PdfPageRenderer.class);

    private static final int DEFAULT_DPI = 150;

    public List<byte[]> renderPdfToPngImages(byte[] pdfBytes) throws IOException {
        return renderPdfToPngImages(pdfBytes, DEFAULT_DPI);
    }

    public List<byte[]> renderPdfToPngImages(byte[] pdfBytes, int dpi) throws IOException {
        List<byte[]> pageImages = new ArrayList<>();
        if (pdfBytes == null || pdfBytes.length == 0) {
            return pageImages;
        }

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFRenderer renderer = new PDFRenderer(document);
            int totalPages = document.getNumberOfPages();
            log.info("Rendering PDF ({} pages) to PNG images at {} DPI...", totalPages, dpi);

            for (int i = 0; i < totalPages; i++) {
                byte[] pngBytes = renderPageToPngInternal(renderer, i, dpi);
                pageImages.add(pngBytes);
            }
        }

        log.info("Successfully rendered {} PDF pages to PNG images", pageImages.size());
        return pageImages;
    }

    public byte[] renderPageToPng(byte[] pdfBytes, int pageIndex, int dpi) throws IOException {
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException("PDF byte array cannot be null or empty");
        }

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFRenderer renderer = new PDFRenderer(document);
            return renderPageToPngInternal(renderer, pageIndex, dpi);
        }
    }

    private byte[] renderPageToPngInternal(PDFRenderer renderer, int pageIndex, int dpi) throws IOException {
        BufferedImage image = renderer.renderImageWithDPI(pageIndex, dpi, ImageType.RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        return baos.toByteArray();
    }
}
