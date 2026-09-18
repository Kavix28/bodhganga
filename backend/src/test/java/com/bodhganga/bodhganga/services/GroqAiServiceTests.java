package com.bodhganga.bodhganga.services;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class GroqAiServiceTests {

    @Test
    void testMissingApiKey_ThrowsIllegalStateException() {
        GroqAiService service = new GroqAiService();
        ReflectionTestUtils.setField(service, "apiKey", "");
        ReflectionTestUtils.setField(service, "model", "llama-3.3-70b-versatile");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            service.generalChat(List.of(), "Hello")
        );
        assertTrue(ex.getMessage().contains("Groq API key not configured"));
    }

    @Test
    void testServiceInitialization_DefaultsModel() {
        GroqAiService service = new GroqAiService();
        ReflectionTestUtils.setField(service, "apiKey", "dummy-groq-key");
        ReflectionTestUtils.setField(service, "model", "llama-3.3-70b-versatile");

        assertNotNull(service);
    }
}
