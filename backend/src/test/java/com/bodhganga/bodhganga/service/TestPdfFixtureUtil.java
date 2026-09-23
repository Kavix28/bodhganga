package com.bodhganga.bodhganga.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.File;
import java.nio.file.Files;

public class TestPdfFixtureUtil {

    private static boolean realAkolaPdfUsed = false;
    private static boolean realEastJaintiaPdfUsed = false;

    /** Returns true if the last Akola PDF load used the real desktop PDF. */
    public static boolean isUsingRealAkolaPdf() {
        return realAkolaPdfUsed;
    }

    /** Returns true if the last East Jaintia PDF load used the real desktop PDF. */
    public static boolean isUsingRealEastJaintiaPdf() {
        return realEastJaintiaPdfUsed;
    }

    /** Returns the real desktop Akola question PDF File, or null if not present. */
    public static File getRealAkolaQuestionFile() {
        String[] dirs = {
                "C:\\Users\\chris\\OneDrive\\Desktop\\Bodhganga",
                "C:\\Users\\chris\\Desktop\\Bodhganga"
        };
        for (String dirPath : dirs) {
            File dir = new File(dirPath);
            if (dir.exists() && dir.isDirectory()) {
                File[] files = dir.listFiles(
                        (d, name) -> name.toLowerCase().contains("akola") && name.toLowerCase().contains("question"));
                if (files != null && files.length > 0) {
                    return files[0];
                }
            }
        }
        return null;
    }

    /** Returns the real desktop Akola answer PDF File, or null if not present. */
    public static File getRealAkolaAnswerFile() {
        String[] dirs = {
                "C:\\Users\\chris\\OneDrive\\Desktop\\Bodhganga",
                "C:\\Users\\chris\\Desktop\\Bodhganga"
        };
        for (String dirPath : dirs) {
            File dir = new File(dirPath);
            if (dir.exists() && dir.isDirectory()) {
                File[] files = dir.listFiles(
                        (d, name) -> name.toLowerCase().contains("akola")
                                && (name.toLowerCase().contains("answer") || name.toLowerCase().contains("solution")));
                if (files != null && files.length > 0) {
                    return files[0];
                }
            }
        }
        return null;
    }

    public static byte[] getOrGenerateAkolaQuestionPdfBytes() throws IOException {
        String[] dirs = {
                "C:\\Users\\chris\\OneDrive\\Desktop\\Bodhganga",
                "C:\\Users\\chris\\Desktop\\Bodhganga"
        };
        for (String dirPath : dirs) {
            File dir = new File(dirPath);
            if (dir.exists() && dir.isDirectory()) {
                File[] files = dir.listFiles(
                        (d, name) -> name.toLowerCase().contains("akola") && name.toLowerCase().contains("question"));
                if (files != null && files.length > 0) {
                    realAkolaPdfUsed = true;
                    return Files.readAllBytes(files[0].toPath());
                }
            }
        }
        realAkolaPdfUsed = false;
        return generateAkolaQuestionPdfBytes();
    }

    public static byte[] getOrGenerateAkolaAnswerPdfBytes() throws IOException {
        String[] dirs = {
                "C:\\Users\\chris\\OneDrive\\Desktop\\Bodhganga",
                "C:\\Users\\chris\\Desktop\\Bodhganga"
        };
        for (String dirPath : dirs) {
            File dir = new File(dirPath);
            if (dir.exists() && dir.isDirectory()) {
                File[] files = dir.listFiles((d, name) -> name.toLowerCase().contains("akola")
                        && (name.toLowerCase().contains("solution") || name.toLowerCase().contains("explanation")));
                if (files != null && files.length > 0) {
                    return Files.readAllBytes(files[0].toPath());
                }
            }
        }
        return generateAkolaAnswerPdfBytes();
    }

    public static byte[] getOrGenerateEastJaintiaQuestionPdfBytes() throws IOException {
        String[] dirs = {
                "C:\\Users\\chris\\OneDrive\\Desktop\\Bodhganga",
                "C:\\Users\\chris\\Desktop\\Bodhganga"
        };
        for (String dirPath : dirs) {
            File dir = new File(dirPath);
            if (dir.exists() && dir.isDirectory()) {
                File[] files = dir.listFiles((d, name) -> name.toLowerCase().contains("east jaintia")
                        && name.toLowerCase().contains("question"));
                if (files != null && files.length > 0) {
                    realEastJaintiaPdfUsed = true;
                    return Files.readAllBytes(files[0].toPath());
                }
            }
        }
        realEastJaintiaPdfUsed = false;
        return generateEastJaintiaQuestionPdfBytes();
    }

    public static byte[] getOrGenerateEastJaintiaAnswerPdfBytes() throws IOException {
        String[] dirs = {
                "C:\\Users\\chris\\OneDrive\\Desktop\\Bodhganga",
                "C:\\Users\\chris\\Desktop\\Bodhganga"
        };
        for (String dirPath : dirs) {
            File dir = new File(dirPath);
            if (dir.exists() && dir.isDirectory()) {
                File[] files = dir.listFiles((d, name) -> name.toLowerCase().contains("east jaintia")
                        && (name.toLowerCase().contains("solution") || name.toLowerCase().contains("explanation")));
                if (files != null && files.length > 0) {
                    return Files.readAllBytes(files[0].toPath());
                }
            }
        }
        return generateEastJaintiaAnswerPdfBytes();
    }

    public static byte[] generateAkolaQuestionPdfBytes() throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(document, page);
            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
            cs.setLeading(12f);
            cs.newLineAtOffset(50, 750);

            int yCount = 0;
            PDPage currentPage = page;
            PDPageContentStream currentCs = cs;

            for (int i = 1; i <= 136; i++) {
                if (i == 1) {
                    currentCs.showText("GEOGRAPHY FOUNDATION LEVEL");
                    currentCs.newLine();
                    yCount++;
                } else if (i == 102) {
                    currentCs.endText();
                    currentCs.close();
                    currentPage = new PDPage();
                    document.addPage(currentPage);
                    currentCs = new PDPageContentStream(document, currentPage);
                    currentCs.beginText();
                    currentCs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                    currentCs.setLeading(12f);
                    currentCs.newLineAtOffset(50, 750);
                    yCount = 0;

                    currentCs.showText("UPSC-LEVEL");
                    currentCs.newLine();
                    yCount++;
                }

                if (yCount > 40) {
                    currentCs.endText();
                    currentCs.close();
                    currentPage = new PDPage();
                    document.addPage(currentPage);
                    currentCs = new PDPageContentStream(document, currentPage);
                    currentCs.beginText();
                    currentCs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                    currentCs.setLeading(12f);
                    currentCs.newLineAtOffset(50, 750);
                    yCount = 0;
                }

                if (i <= 101) {
                    if (i % 2 == 1) {
                        if (i == 115) {
                            currentCs.showText("Q" + i + ". What is the shape of the inner fortification wall?");
                        } else {
                            currentCs.showText("Q" + i + ". What is the factual detail regarding Akola district?");
                        }
                        currentCs.newLine();
                        yCount++;
                        currentCs.showText("A. Option Shillong");
                        currentCs.newLine();
                        yCount++;
                        currentCs.showText("B. Option Tura");
                        currentCs.newLine();
                        yCount++;
                        currentCs.showText("C. Option Jowai");
                        currentCs.newLine();
                        yCount++;
                        currentCs.showText("D. Option Nongpoh");
                        currentCs.newLine();
                        yCount++;
                    } else {
                        currentCs.showText("Q" + i + ". Consider the following statements about Akola:");
                        currentCs.newLine();
                        yCount++;
                        currentCs.showText("1. Statement 1 about Akola region.");
                        currentCs.newLine();
                        yCount++;
                        currentCs.showText("2. Statement 2 about Akola history.");
                        currentCs.newLine();
                        yCount++;
                        currentCs.showText("Which of the statements given above is/are correct?");
                        currentCs.newLine();
                        yCount++;
                        currentCs.showText("A. 1 only");
                        currentCs.newLine();
                        yCount++;
                        currentCs.showText("B. 2 only");
                        currentCs.newLine();
                        yCount++;
                        currentCs.showText("C. Both 1 and 2");
                        currentCs.newLine();
                        yCount++;
                        currentCs.showText("D. Neither 1 nor 2");
                        currentCs.newLine();
                        yCount++;
                    }
                } else {
                    currentCs.showText("Q" + i + ". [UPSC-Level] Analyze the administrative developments in Akola.");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("A. High level option A");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("B. High level option B");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("C. High level option C");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("D. High level option D");
                    currentCs.newLine();
                    yCount++;
                }
            }
            currentCs.endText();
            currentCs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    public static byte[] generateAkolaAnswerPdfBytes() throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(document, page);
            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
            cs.setLeading(12f);
            cs.newLineAtOffset(50, 750);

            int yCount = 0;
            PDPage currentPage = page;
            PDPageContentStream currentCs = cs;

            for (int i = 1; i <= 136; i++) {
                if (i == 55)
                    continue; // Skip Q55 in answer PDF as per Akola baseline

                if (yCount > 40) {
                    currentCs.endText();
                    currentCs.close();
                    currentPage = new PDPage();
                    document.addPage(currentPage);
                    currentCs = new PDPageContentStream(document, currentPage);
                    currentCs.beginText();
                    currentCs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                    currentCs.setLeading(12f);
                    currentCs.newLineAtOffset(50, 750);
                    yCount = 0;
                }

                if (i == 89) {
                    currentCs.showText("Q89. (a) A ritual performance of traditional dance");
                } else {
                    currentCs.showText("Q" + i + ". (a) Detailed explanation for question " + i);
                }
                currentCs.newLine();
                yCount++;
            }
            currentCs.endText();
            currentCs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    public static byte[] generateEastJaintiaQuestionPdfBytes() throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(document, page);
            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
            cs.setLeading(12f);
            cs.newLineAtOffset(50, 750);

            int yCount = 0;
            PDPage currentPage = page;
            PDPageContentStream currentCs = cs;

            for (int i = 1; i <= 80; i++) {
                if (yCount > 40) {
                    currentCs.endText();
                    currentCs.close();
                    currentPage = new PDPage();
                    document.addPage(currentPage);
                    currentCs = new PDPageContentStream(document, currentPage);
                    currentCs.beginText();
                    currentCs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                    currentCs.setLeading(12f);
                    currentCs.newLineAtOffset(50, 750);
                    yCount = 0;
                }

                if (i % 2 == 1) {
                    currentCs.showText("Q" + i + ". What is the administrative headquarters of East Jaintia Hills?");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("A. Khliehriat");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("B. Jowai");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("C. Shillong");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("D. Nongstoin");
                    currentCs.newLine();
                    yCount++;
                } else {
                    currentCs.showText("Q" + i + ". Consider the following statements regarding East Jaintia Hills:");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("1. Khliehriat is the district headquarters.");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("2. The district was created in 2012.");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("Which of the statements given above is/are correct?");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("A. 1 only");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("B. 2 only");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("C. Both 1 and 2");
                    currentCs.newLine();
                    yCount++;
                    currentCs.showText("D. Neither 1 nor 2");
                    currentCs.newLine();
                    yCount++;
                }
            }
            currentCs.endText();
            currentCs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    public static byte[] generateEastJaintiaAnswerPdfBytes() throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(document, page);
            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
            cs.setLeading(12f);
            cs.newLineAtOffset(50, 750);

            int yCount = 0;
            PDPage currentPage = page;
            PDPageContentStream currentCs = cs;

            for (int i = 1; i <= 80; i++) {
                if (yCount > 40) {
                    currentCs.endText();
                    currentCs.close();
                    currentPage = new PDPage();
                    document.addPage(currentPage);
                    currentCs = new PDPageContentStream(document, currentPage);
                    currentCs.beginText();
                    currentCs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                    currentCs.setLeading(12f);
                    currentCs.newLineAtOffset(50, 750);
                    yCount = 0;
                }

                currentCs.showText("Q" + i
                        + ". (a) Khliehriat is the administrative headquarters of East Jaintia Hills district.");
                currentCs.newLine();
                yCount++;
            }
            currentCs.endText();
            currentCs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }
}
