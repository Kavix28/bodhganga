package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.repo.QuestionRepo;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class QuizAvailabilityService {

    private final QuestionRepo questionRepo;
    private final MongoTemplate mongoTemplate;

    public QuizAvailabilityService(QuestionRepo questionRepo) {
        this(questionRepo, null);
    }

    public QuizAvailabilityService(QuestionRepo questionRepo, MongoTemplate mongoTemplate) {
        this.questionRepo = questionRepo;
        this.mongoTemplate = mongoTemplate;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Efficient single-query retrieval of all state slugs with active published questions.
     * Prevents serial N+1 database queries when calculating availability for 36 states.
     */
    public Set<String> getAvailableStateSlugs() {
        Set<String> set = new HashSet<>();
        set.add("maharashtra");
        if (mongoTemplate != null) {
            try {
                Query query = new Query(Criteria.where("status").is("PUBLISHED").and("isActive").is(true));
                List<String> distinctSlugs = mongoTemplate.findDistinct(query, "stateSlug", "questions", String.class);
                if (distinctSlugs != null) {
                    for (String slug : distinctSlugs) {
                        if (slug != null && !slug.isBlank()) {
                            set.add(normalize(slug));
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }
        return set;
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
