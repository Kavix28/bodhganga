package com.bodhganga.bodhganga.services;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class GeminiAiService {

    private final GroqAiService groqAiService;

    public GeminiAiService(GroqAiService groqAiService) {
        this.groqAiService = groqAiService;
    }

    public String generalChat(List<Map<String, Object>> history, String userMessage) {
        return groqAiService.generalChat(history, userMessage);
    }

    public String studyChat(String userName, List<String> purchasedDistricts,
                             List<Map<String, Object>> history, String userMessage) {
        return groqAiService.studyChat(userName, purchasedDistricts, history, userMessage);
    }
}
