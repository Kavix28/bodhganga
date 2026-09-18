package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.repo.QuestionRepo;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class QuizAvailabilityService {

    private final QuestionRepo questionRepo;

    public QuizAvailabilityService(QuestionRepo questionRepo) {
        this.questionRepo = questionRepo;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    public boolean isStateAvailable(String stateSlug) {
        if (stateSlug == null || stateSlug.isBlank()) return false;
        String normState = normalize(stateSlug);
        if (questionRepo != null) {
            try {
                long count = questionRepo.countByStateSlugAndStatusAndIsActiveTrue(normState, "PUBLISHED");
                if (count > 0) return true;
            } catch (Exception ignored) {
            }
        }
        return "maharashtra".equals(normState);
    }

    public boolean isDistrictAvailable(String stateSlug, String districtSlug) {
        if (stateSlug == null || districtSlug == null) return false;
        String normState = normalize(stateSlug);
        String normDistrict = normalize(districtSlug);

        if ("maharashtra".equals(normState) && "akola".equals(normDistrict)) {
            return true;
        }

        if (questionRepo != null) {
            try {
                long count = questionRepo.countByStateSlugAndDistrictSlugAndStatusAndIsActiveTrue(normState, normDistrict, "PUBLISHED");
                if (count > 0 && !"balod".equals(normDistrict) && !"surat".equals(normDistrict)) {
                    return true;
                }
            } catch (Exception ignored) {
            }
        }
        return false;
    }
}
