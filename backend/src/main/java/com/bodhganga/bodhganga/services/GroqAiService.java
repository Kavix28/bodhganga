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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GroqAiService {

    private static final Logger log = LoggerFactory.getLogger(GroqAiService.class);

    @Value("${groq.api.key:${GROQ_API_KEY:}}")
    private String apiKey;

    @Value("${groq.model:${GROQ_MODEL:llama-3.3-70b-versatile}}")
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
        return callGroq(GENERAL_SYSTEM_PROMPT, history, userMessage);
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

        return callGroq(systemPrompt, history, userMessage);
    }

    @SuppressWarnings("unchecked")
    public String callGroq(String systemPrompt, List<Map<String, Object>> history, String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Groq API key not configured");
        }
        try {
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));

            if (history != null) {
                for (Map<String, Object> entry : history) {
                    String role = (String) entry.get("role");
                    String text = null;

                    Object partsObj = entry.get("parts");
                    if (partsObj instanceof List<?> partsList && !partsList.isEmpty()) {
                        Object firstPart = partsList.get(0);
                        if (firstPart instanceof Map<?, ?> partMap) {
                            text = (String) partMap.get("text");
                        }
                    } else if (entry.containsKey("content")) {
                        text = (String) entry.get("content");
                    } else if (entry.containsKey("text")) {
                        text = (String) entry.get("text");
                    }

                    if (text != null && !text.isBlank()) {
                        String normalizedRole = "user".equalsIgnoreCase(role) ? "user" : "assistant";
                        messages.add(Map.of("role", normalizedRole, "content", text));
                    }
                }
            }

            messages.add(Map.of("role", "user", "content", userMessage));

            Map<String, Object> body = Map.of(
                "model", model,
                "messages", messages,
                "temperature", 0.7,
                "max_tokens", 1024
            );

            String url = "https://api.groq.com/openai/v1/chat/completions";

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 401) {
                log.error("Groq API authorization failure (401): {}", response.body());
                throw new RuntimeException("Groq API key authorization failed");
            } else if (response.statusCode() == 429) {
                log.error("Groq API rate limit exceeded (429): {}", response.body());
                throw new RuntimeException("Groq rate limit exceeded");
            } else if (response.statusCode() >= 500) {
                log.error("Groq API server error ({}): {}", response.statusCode(), response.body());
                throw new RuntimeException("Groq service temporary failure (" + response.statusCode() + ")");
            } else if (response.statusCode() != 200) {
                log.error("Groq API error {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Groq API returned HTTP " + response.statusCode());
            }

            Map<String, Object> parsed = objectMapper.readValue(response.body(), Map.class);
            List<Map<String, Object>> choices = (List<Map<String, Object>>) parsed.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new RuntimeException("Malformed response from Groq API: missing choices");
            }
            Map<String, Object> choiceObj = choices.get(0);
            Map<String, Object> messageObj = (Map<String, Object>) choiceObj.get("message");
            if (messageObj == null || !messageObj.containsKey("content")) {
                throw new RuntimeException("Malformed response from Groq API: missing content");
            }
            return (String) messageObj.get("content");

        } catch (IOException | InterruptedException e) {
            log.error("Groq call failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to reach AI service: " + e.getMessage(), e);
        }
    }
}
