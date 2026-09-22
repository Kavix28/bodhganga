package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.services.GroqAiService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class GroqTextLiveIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(GroqTextLiveIntegrationTest.class);

    @Test
    @EnabledIfSystemProperty(named = "groq.integration.enabled", matches = "true")
    @EnabledIfEnvironmentVariable(named = "GROQ_API_KEY", matches = ".+")
    void testLiveGroqTextApi_ClassificationReasoning() throws Exception {
        String apiKey = System.getenv("GROQ_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getProperty("GROQ_API_KEY");
        }
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getProperty("groq.api.key");
        }
        assertNotNull(apiKey, "GROQ_API_KEY is missing");
        assertFalse(apiKey.isBlank(), "GROQ_API_KEY is blank");

        GroqAiService groqAiService = new GroqAiService();
        ReflectionTestUtils.setField(groqAiService, "apiKey", apiKey);
        ReflectionTestUtils.setField(groqAiService, "model", "llama-3.3-70b-versatile");

        String systemPrompt = "You are a Question Bank text classifier. Output valid JSON with classification field.";
        String userPrompt = "Classify this question text: 'Statement I: Chamba was founded in 920 AD. Statement II: Sahil Varman moved the capital from Brahmpura to Chamba.' Options: (A) Both true (B) Both false. JSON: {\"classification\": \"STATEMENT_BASED\"}";

        log.info("Sending text payload to live Groq Text Reasoning API...");
        String responseJson = groqAiService.callGroqJson(systemPrompt, userPrompt);

        assertNotNull(responseJson, "Groq Text response must not be null");
        assertFalse(responseJson.isBlank(), "Groq Text response must not be blank");
        log.info("Received response from live Groq Text API (Length: {} chars)", responseJson.length());
        assertTrue(
                responseJson.contains("STATEMENT_BASED") || responseJson.contains("classification"),
                "Response must contain expected classification JSON structure");
    }
}
