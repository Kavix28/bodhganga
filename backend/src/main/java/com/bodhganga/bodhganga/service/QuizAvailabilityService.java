package com.bodhganga.bodhganga.service;

import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class QuizAvailabilityService {

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Checks if quiz question bank is available for the given state.
     * Indicates that the state has at least one active quiz question bank
     * (Maharashtra).
     */
    public boolean isStateAvailable(String stateSlug) {
        return "maharashtra".equals(normalize(stateSlug));
    }

    /**
     * Checks if quiz question bank is available for the given state and district
     * combination.
     * Enforces the exact combination: maharashtra + akola.
     */
    public boolean isDistrictAvailable(String stateSlug, String districtSlug) {
        return "maharashtra".equals(normalize(stateSlug)) && "akola".equals(normalize(districtSlug));
    }
}
