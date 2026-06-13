package com.bodhganga.bodhganga.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GeminiAiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiService.class);

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GENERAL_SYSTEM_PROMPT =
        "You are BodhGanga's friendly assistant. BodhGanga (bodhganga.in) is an Indian ed-tech platform " +
        "providing district-specific study resources for state competitive exams (e.g. HPAS, HPPSC, state PSCs).\n\n" +
        "Key facts:\n" +
        "- Resources organized by State -> District\n" +
        "- Paid district bundles cost Rs.99 (one-time per district)\n" +
        "- Free resources (sample notes, MCQs, revision sheets) available without purchase\n" +
        "- Register with mobile OTP, browse states/districts, pay via Razorpay (UPI/cards/net banking)\n" +
        "- After payment, resources accessible from Library/Dashboard\n" +
        "- Currently live: Himachal Pradesh -> Chamba District (free + paid resources)\n" +
        "- More states/districts being added continuously\n" +
        "- For support: contact via the website support section\n\n" +
        "Tone: helpful, warm, concise. If asked about exam study topics, mention the Study Companion " +
        "feature (available after login) can help with that. Keep answers short unless detail is needed.";

    public String generalChat(List<Map<String, Object>> history, String userMessage) {
        return callGemini(GENERAL_SYSTEM_PROMPT, history, userMessage);
    }

    public String studyChat(String userName, List<String> purchasedDistricts,
                             List<Map<String, Object>> history, String userMessage) {
        String districts = purchasedDistricts.isEmpty()
                ? "none yet (free resources only)"
                : String.join(", ", purchasedDistricts);

        String systemPrompt =
            "You are BodhGanga's AI Study Companion - a knowledgeable, encouraging exam prep tutor.\n\n" +
            "Student profile:\n" +
            "- Name: " + userName + "\n" +
            "- Purchased districts: " + districts + "\n\n" +
            "Your role:\n" +
            "- Help prepare for Indian state competitive exams (HPAS, HPPSC, state PSCs, etc.)\n" +
            "- Answer questions about history, geography, polity, economy, culture of their districts/states\n" +
            "- Explain concepts clearly with state/district-relevant examples\n" +
            "- Quiz them on demand (MCQ or short-answer style)\n" +
            "- Give study strategies, important topics, exam tips for their specific state exam\n" +
            "- Use bullet points for lists. Use Hindi terms where culturally relevant.\n" +
            "- If asked about something outside their purchased districts, answer generally.\n\n" +
            "Tone: encouraging, like a senior who cracked the exam. Never condescending.";

        return callGemini(systemPrompt, history, userMessage);
    }

    @SuppressWarnings("unchecked")
    private String callGemini(String systemPrompt, List<Map<String, Object>> history, String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Gemini API key not configured");
        }
        try {
            List<Map<String, Object>> contents = new java.util.ArrayList<>();
            if (history != null) contents.addAll(history);
            contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userMessage))
            ));

            Map<String, Object> body = Map.of(
                "system_instruction", Map.of(
                    "parts", List.of(Map.of("text", systemPrompt))
                ),
                "contents", contents,
                "generationConfig", Map.of(
                    "maxOutputTokens", 1024,
                    "temperature", 0.7
                )
            );

            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                         + model + ":generateContent?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini API error {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Gemini API returned " + response.statusCode());
            }

            Map<String, Object> parsed = objectMapper.readValue(response.body(), Map.class);
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) parsed.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");

        } catch (IOException | InterruptedException e) {
            log.error("Gemini call failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to reach AI service: " + e.getMessage(), e);
        }
    }
}
