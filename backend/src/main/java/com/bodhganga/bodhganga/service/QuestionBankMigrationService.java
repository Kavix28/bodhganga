package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.repo.QuestionRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class QuestionBankMigrationService {

    private static final Logger logger = LoggerFactory.getLogger(QuestionBankMigrationService.class);

    private final QuestionRepo questionRepo;

    @Autowired
    public QuestionBankMigrationService(QuestionRepo questionRepo) {
        this.questionRepo = questionRepo;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void migrateLegacyQuestionClassifications() {
        logger.info("Starting Question Bank Foundation/Statement-Based classification normalization audit...");
        try {
            List<Question> allQuestions = questionRepo.findAll();
            if (allQuestions == null || allQuestions.isEmpty()) {
                logger.info("QuestionBankMigration: No questions found in MongoDB collection.");
                return;
            }

            int totalUpdated = 0;
            for (Question q : allQuestions) {
                boolean modified = false;
                String currentTestType = q.getTestType() != null ? q.getTestType().toLowerCase(Locale.ROOT) : "";
                String currentLevel = q.getLevel() != null ? q.getLevel().toLowerCase(Locale.ROOT) : "";

                if ("master".equalsIgnoreCase(currentTestType)) {
                    if (!"master".equals(q.getTestType())) {
                        q.setTestType("master");
                        modified = true;
                    }
                } else if ("upsc-level".equalsIgnoreCase(currentLevel)
                        || "statement-based".equalsIgnoreCase(currentLevel)
                        || "statement_based".equalsIgnoreCase(currentLevel)
                        || "advanced".equalsIgnoreCase(currentTestType)
                        || "statement-based".equalsIgnoreCase(currentTestType)
                        || "statement_based".equalsIgnoreCase(currentTestType)) {

                    if (!"statement-based".equals(q.getTestType())) {
                        q.setTestType("statement-based");
                        modified = true;
                    }
                    if (!"statement-based".equals(q.getLevel())) {
                        q.setLevel("statement-based");
                        modified = true;
                    }
                } else if ("foundation".equalsIgnoreCase(currentLevel)
                        || "easy".equalsIgnoreCase(currentTestType)
                        || "medium".equalsIgnoreCase(currentTestType)
                        || "hard".equalsIgnoreCase(currentTestType)
                        || "foundation".equalsIgnoreCase(currentTestType)) {

                    if (!"foundation".equals(q.getTestType())) {
                        q.setTestType("foundation");
                        modified = true;
                    }
                    if (!"foundation".equals(q.getLevel())) {
                        q.setLevel("foundation");
                        modified = true;
                    }
                }

                if (modified) {
                    questionRepo.save(q);
                    totalUpdated++;
                }
            }

            logger.info("QuestionBankMigration completed cleanly. Scanned: {}, Normalized: {}", allQuestions.size(),
                    totalUpdated);
        } catch (Exception e) {
            logger.error("QuestionBankMigration encountered an error during startup migration audit: {}",
                    e.getMessage(), e);
        }
    }
}
