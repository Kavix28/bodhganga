package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.File;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;

@SpringBootTest(classes = BodhgangaApplication.class)
@ActiveProfiles("test")
public class AkolaOcrDiagnosticDump {

    @Autowired
    private PdfExtractionService pdfExtractionService;

    @Autowired
    private QuestionParserService questionParserService;

    @Autowired
    private AnswerParserService answerParserService;

    @Autowired
    private AkolaTextNormalizationFilter akolaTextNormalizationFilter;

    @Test
    void runDiagnosticDumpIfRealPdfAvailable() throws Exception {
        File qFile = TestPdfFixtureUtil.getRealAkolaQuestionFile();
        File aFile = TestPdfFixtureUtil.getRealAkolaAnswerFile();
        if (qFile == null || aFile == null) {
            System.out.println("Real Akola PDFs not found on machine — skipping diagnostic dump.");
            return;
        }

        byte[] qBytes = Files.readAllBytes(qFile.toPath());
        List<String> qPages = pdfExtractionService.extractTextPerPage(qBytes);

        System.out.println("=== QUESTION PDF TOTAL PAGES: " + qPages.size() + " ===");

        List<QuestionParserService.ParsedQuestion> parsedQuestions = questionParserService
                .parseQuestionsFromPages(qPages, akolaTextNormalizationFilter);
        System.out.println("PARSED QUESTIONS COUNT: " + parsedQuestions.size());

        byte[] aBytes = Files.readAllBytes(aFile.toPath());
        List<String> aPages = pdfExtractionService.extractTextPerPage(aBytes);
        System.out.println("=== SOLUTION PDF TOTAL PAGES: " + aPages.size() + " ===");

        Map<Integer, AnswerParserService.ParsedAnswer> parsedAnswers = answerParserService.parseAnswersFromPages(aPages,
                akolaTextNormalizationFilter);
        System.out.println("PARSED ANSWERS COUNT: " + parsedAnswers.size());
    }
}
