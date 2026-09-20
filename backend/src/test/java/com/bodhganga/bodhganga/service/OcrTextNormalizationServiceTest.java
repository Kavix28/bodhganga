package com.bodhganga.bodhganga.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests verifying that OcrTextNormalizationService functions generically,
 * without any dependency on district-specific rules or question numbers.
 */
public class OcrTextNormalizationServiceTest {

    private OcrTextNormalizationService service;

    @BeforeEach
    void setUp() {
        service = new OcrTextNormalizationService();
    }

    @Test
    void testMojibakeAndWhitespaceNormalization() {
        String input = "This is a test â€™ containing mojibake â€œquotesâ€ \u00A0 with NBSP and zero-width\u200B space.";
        String normalized = service.normalizeText(input);

        assertFalse(normalized.contains("â€™"));
        assertFalse(normalized.contains("â€œ"));
        assertFalse(normalized.contains("\u00A0"));
        assertFalse(normalized.contains("\u200B"));
        assertTrue(
                normalized.contains("This is a test ' containing mojibake \"quotes\" with NBSP and zero-width space."));
    }

    @Test
    void testGenericBrandingAndHeaderRemoval() {
        String input = "Sample document content line 1.\n" +
                "© Bodhganga Academy | All Rights Reserved.\n" +
                "A Knowledge Initiative by BodhGanga Academy\n" +
                "For UPSC | State PSC | SSC | CUET | Defence | Interview Preparation\n" +
                "Sample document content line 2.\n" +
                "42\n" +
                "Sample document content line 3.";

        String normalized = service.normalizeText(input);

        assertFalse(normalized.contains("Bodhganga Academy"));
        assertFalse(normalized.contains("Knowledge Initiative"));
        assertFalse(normalized.contains("For UPSC"));
        assertFalse(normalized.contains("\n42\n"));
        assertTrue(normalized.contains("Sample document content line 1."));
        assertTrue(normalized.contains("Sample document content line 2."));
        assertTrue(normalized.contains("Sample document content line 3."));
    }

    @Test
    void testCleanOptionAndQuestionText() {
        String rawOpt = "(A)   First Option Text  ";
        String cleanOpt = service.cleanOptionText(rawOpt);
        assertEquals("First Option Text", cleanOpt);

        String rawQ = "Q12. What is the capital city?  ";
        String cleanQ = service.cleanQuestionText(rawQ);
        assertEquals("What is the capital city?", cleanQ);
    }
}
