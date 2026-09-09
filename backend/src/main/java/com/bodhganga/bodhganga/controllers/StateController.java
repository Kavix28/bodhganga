package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.StateRepo;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/states")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000" })
public class StateController {

    private final StateRepo stateRepo;
    private final MongoTemplate mongoTemplate;

    public StateController(StateRepo stateRepo, MongoTemplate mongoTemplate) {
        this.stateRepo = stateRepo;
        this.mongoTemplate = mongoTemplate;
    }

    public record DistrictInfo(String district, String districtSlug, long count) {
    }

    /**
     * GET /api/states/available
     * Returns all states that have at least one published product.
     *
     * CRITICAL FIX: No longer requires a State document to exist in the states
     * collection.
     * Derived directly from the products aggregation so any ingested state always
     * appears.
     */
    /**
     * GET /api/states/available
     * Returns all canonical states from the states collection, enriched with
     * product resource counts.
     * Guarantees that states exist independently of product counts and never vanish
     * if products are 0.
     */
    @GetMapping("/available")
    public ResponseEntity<List<java.util.Map<String, Object>>> getAvailableStates() {
        // 1. Get published, non-archived product counts per state slug
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(
                        Criteria.where("isPublished").is(true)
                                .and("archived").ne(true)
                                .and("stateSlug").exists(true).ne(null).ne("").ne("general")),
                Aggregation.group("stateSlug")
                        .first("state").as("name")
                        .count().as("notesCount"),
                Aggregation.project("name", "notesCount")
                        .and("_id").as("id")
                        .andExclude("_id"));

        AggregationResults<org.bson.Document> results = mongoTemplate.aggregate(agg, "products",
                org.bson.Document.class);

        java.util.Map<String, Long> productCountsBySlug = new java.util.HashMap<>();
        java.util.Map<String, String> stateNamesBySlug = new java.util.HashMap<>();

        for (org.bson.Document doc : results.getMappedResults()) {
            String slug = doc.getString("id");
            String name = doc.getString("name");
            Number countNum = (Number) doc.get("notesCount");
            long count = countNum != null ? countNum.longValue() : 0L;
            if (slug != null && !slug.isBlank()) {
                productCountsBySlug.put(slug, count);
                if (name != null && !name.isBlank()) {
                    stateNamesBySlug.put(slug, name);
                }
            }
        }

        // 2. Fetch canonical states master data
        List<State> canonicalStates = stateRepo.findAll();
        java.util.Map<String, java.util.Map<String, Object>> resultMap = new java.util.LinkedHashMap<>();

        // Populate canonical states first
        for (State s : canonicalStates) {
            String slug = Product.generateSlug(s.getName());
            if (s.getId() != null && !s.getId().isBlank()) {
                slug = Product.generateSlug(s.getId());
            }
            long count = productCountsBySlug.getOrDefault(slug, 0L);

            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", slug);
            m.put("stateSlug", slug);
            m.put("name", s.getName());
            m.put("notesCount", count);
            m.put("isAvailable", count > 0);
            resultMap.put(slug, m);
        }

        // Add any remaining product-derived states not covered in canonical states
        for (java.util.Map.Entry<String, Long> entry : productCountsBySlug.entrySet()) {
            String slug = entry.getKey();
            if (!resultMap.containsKey(slug)) {
                String displayName = stateNamesBySlug.getOrDefault(slug, slug);
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("id", slug);
                m.put("stateSlug", slug);
                m.put("name", displayName);
                m.put("notesCount", entry.getValue());
                m.put("isAvailable", entry.getValue() > 0);
                resultMap.put(slug, m);
            }
        }

        List<java.util.Map<String, Object>> finalStates = new java.util.ArrayList<>(resultMap.values());
        return ResponseEntity.ok(finalStates);
    }

    /**
     * GET /api/states/{stateSlug}/districts
     * Get districts of a state from canonical master data, enriched with published
     * product counts.
     */
    @GetMapping("/{stateSlug}/districts")
    public ResponseEntity<List<DistrictInfo>> getAvailableDistricts(@PathVariable String stateSlug) {
        String cleanStateSlug = Product.generateSlug(stateSlug);

        // Aggregate published product counts per district
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("isPublished").is(true)
                        .and("archived").ne(true)
                        .and("stateSlug").is(cleanStateSlug)
                        .and("district").exists(true).ne(null).ne("")
                        .nin("general", "State images", "state images", "images")
                        .and("districtSlug").nin("general", "state-images", "images", "stateimages")),
                Aggregation.group("district", "districtSlug").count().as("count"),
                Aggregation.project("count")
                        .and("_id.district").as("district")
                        .and("_id.districtSlug").as("districtSlug")
                        .andExclude("_id"));

        AggregationResults<DistrictInfo> results = mongoTemplate.aggregate(agg, "products", DistrictInfo.class);
        java.util.Map<String, DistrictInfo> productDistrictsMap = new java.util.LinkedHashMap<>();

        for (DistrictInfo info : results.getMappedResults()) {
            if (info.districtSlug() != null && !info.districtSlug().isBlank()) {
                productDistrictsMap.put(info.districtSlug(), info);
            }
        }

        // Check canonical state in stateRepo
        State canonicalState = null;
        Optional<State> byId = stateRepo.findById(cleanStateSlug);
        if (byId.isPresent()) {
            canonicalState = byId.get();
        } else {
            for (State s : stateRepo.findAll()) {
                if (Product.generateSlug(s.getName()).equals(cleanStateSlug)) {
                    canonicalState = s;
                    break;
                }
            }
        }

        java.util.Map<String, DistrictInfo> resultMap = new java.util.LinkedHashMap<>();

        if (canonicalState != null && canonicalState.getDistricts() != null) {
            for (String dName : canonicalState.getDistricts()) {
                String dSlug = Product.generateSlug(dName);
                long count = productDistrictsMap.containsKey(dSlug) ? productDistrictsMap.get(dSlug).count() : 0L;
                resultMap.put(dSlug, new DistrictInfo(dName, dSlug, count));
            }
        }

        // Add any additional product-derived districts
        for (java.util.Map.Entry<String, DistrictInfo> entry : productDistrictsMap.entrySet()) {
            if (!resultMap.containsKey(entry.getKey())) {
                resultMap.put(entry.getKey(), entry.getValue());
            }
        }

        return ResponseEntity.ok(new java.util.ArrayList<>(resultMap.values()));
    }

    /**
     * GET /api/states
     * Get all states and UTs
     */
    @GetMapping
    public ResponseEntity<ApiResponseDTO> getAllStates() {
        List<State> states = stateRepo.findAll();
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("States retrieved successfully")
                .data(states)
                .build());
    }

    /**
     * GET /api/states/type/{type}
     * Get states by type (STATE or UT)
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponseDTO> getByType(@PathVariable String type) {
        List<State> states = stateRepo.findByType(type.toUpperCase());
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("States of type " + type + " retrieved")
                .data(states)
                .build());
    }

    /**
     * GET /api/states/{id}
     * Get state by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> getById(@PathVariable String id) {
        return stateRepo.findById(id)
                .map(state -> ResponseEntity.ok(ApiResponseDTO.builder()
                        .success(true)
                        .message("State retrieved")
                        .data(state)
                        .build()))
                .orElse(ResponseEntity.status(404).body(ApiResponseDTO.builder()
                        .success(false)
                        .message("State not found")
                        .build()));
    }

    /**
     * GET /api/states/code/{code}
     * Get state by state code (e.g. MH, DL)
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponseDTO> getByCode(@PathVariable String code) {
        return stateRepo.findByCode(code.toUpperCase())
                .map(state -> ResponseEntity.ok(ApiResponseDTO.builder()
                        .success(true)
                        .message("State retrieved")
                        .data(state)
                        .build()))
                .orElse(ResponseEntity.status(404).body(ApiResponseDTO.builder()
                        .success(false)
                        .message("State not found with code: " + code)
                        .build()));
    }

    /**
     * POST /api/states
     * Create or update a state (admin only)
     */
    @PostMapping
    public ResponseEntity<ApiResponseDTO> createState(@RequestBody State state) {
        if (state.getCreatedAt() == null) {
            state.setCreatedAt(new Date());
        }
        // Auto-generate ID from name if not set
        if (state.getId() == null || state.getId().isEmpty()) {
            state.setId(state.getName().toLowerCase()
                    .replaceAll("[^a-z0-9\\s]", "")
                    .replaceAll("\\s+", "-"));
        }
        State saved = stateRepo.save(state);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("State created successfully")
                .data(saved)
                .build());
    }

    /**
     * PUT /api/states/{id}
     * Update a state (admin only)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> updateState(@PathVariable String id, @RequestBody State state) {
        if (!stateRepo.existsById(id)) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("State not found")
                    .build());
        }
        state.setId(id);
        state.setUpdatedAt(new Date());
        State updated = stateRepo.save(state);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("State updated successfully")
                .data(updated)
                .build());
    }

    /**
     * DELETE /api/states/{id}
     * Delete a state (admin only)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> deleteState(@PathVariable String id) {
        if (!stateRepo.existsById(id)) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("State not found")
                    .build());
        }
        stateRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("State deleted successfully")
                .build());
    }
}
