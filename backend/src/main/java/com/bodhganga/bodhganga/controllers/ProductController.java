package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.StateRepo;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepo productRepo;
    private final MongoTemplate mongoTemplate;
    private final StateRepo stateRepo;

    public record DistrictCountDTO(
            String districtSlug,
            String districtName,
            long freeCount,
            long paidCount,
            long totalCount
    ) {}

    public ProductController(ProductRepo productRepo, MongoTemplate mongoTemplate, StateRepo stateRepo) {
        this.productRepo = productRepo;
        this.mongoTemplate = mongoTemplate;
        this.stateRepo = stateRepo;
    }

    /**
     * Dedicated District Counts Endpoint
     * GET /api/products/state/{stateSlug}/districts/counts
     * Returns canonical district identifiers and accurate material counts.
     */
    @GetMapping("/state/{stateSlug}/districts/counts")
    public ResponseEntity<List<DistrictCountDTO>> getDistrictCounts(@PathVariable String stateSlug) {
        String cleanStateSlug = Product.generateSlug(stateSlug);
        if (cleanStateSlug == null || cleanStateSlug.isBlank()) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }

        org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
        query.addCriteria(new org.springframework.data.mongodb.core.query.Criteria().andOperator(
                org.springframework.data.mongodb.core.query.Criteria.where("stateSlug").is(cleanStateSlug),
                org.springframework.data.mongodb.core.query.Criteria.where("districtSlug").nin("general", "state-images", "images", "stateimages", "state", null, ""),
                org.springframework.data.mongodb.core.query.Criteria.where("archived").ne(true),
                org.springframework.data.mongodb.core.query.Criteria.where("isDeleted").ne(true),
                new org.springframework.data.mongodb.core.query.Criteria().orOperator(
                        org.springframework.data.mongodb.core.query.Criteria.where("isPublished").is(true),
                        org.springframework.data.mongodb.core.query.Criteria.where("published").is(true)
                ),
                org.springframework.data.mongodb.core.query.Criteria.where("resourceScope").ne("STATE")
        ));

        List<Product> districtProducts = mongoTemplate.find(query, Product.class);

        java.util.Map<String, long[]> productCountsMap = new java.util.LinkedHashMap<>(); // slug -> [free, paid, total]
        java.util.Map<String, String> productNamesMap = new java.util.LinkedHashMap<>(); // slug -> display name

        for (Product p : districtProducts) {
            if (p == null || p.isStateScope() || Product.SCOPE_STATE.equalsIgnoreCase(p.getResourceScope())) continue;
            // Exclude state categories
            if (Product.isCanonicalStateCategory(p.getCategory())
                    || Product.isCanonicalStateCategory(p.getCategorySlug())
                    || Product.isCanonicalStateCategory(p.getSectionSlug())) {
                continue;
            }
            String rawDSlug = p.getDistrictSlug();
            if (rawDSlug == null || rawDSlug.isBlank()) continue;
            String cSlug = StateController.canonicalDistrictSlug(rawDSlug);
            if ("general".equalsIgnoreCase(cSlug) || "state".equalsIgnoreCase(cSlug)) continue;

            String rawDName = p.getDistrict();
            String cName = StateController.canonicalDistrictName(rawDName, cSlug);
            productNamesMap.putIfAbsent(cSlug, cName);

            boolean isFree = p.isFree() || p.getPrice() == null || p.getPrice() == 0.0
                    || "free".equalsIgnoreCase(p.getCategory())
                    || "free".equalsIgnoreCase(p.getCategorySlug());
            long[] counts = productCountsMap.computeIfAbsent(cSlug, k -> new long[3]);
            if (isFree) {
                counts[0]++; // free
            } else {
                counts[1]++; // paid
            }
            counts[2]++; // total
        }

        // Canonical state from stateRepo
        State canonicalState = null;
        java.util.Optional<State> byId = stateRepo.findById(cleanStateSlug);
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

        java.util.Map<String, DistrictCountDTO> resultMap = new java.util.LinkedHashMap<>();
        if (canonicalState != null && canonicalState.getDistricts() != null) {
            for (String rawDName : canonicalState.getDistricts()) {
                String cSlug = StateController.canonicalDistrictSlug(rawDName);
                String cName = StateController.canonicalDistrictName(rawDName, cSlug);
                long[] counts = productCountsMap.getOrDefault(cSlug, new long[]{0L, 0L, 0L});
                resultMap.put(cSlug, new DistrictCountDTO(cSlug, cName, counts[0], counts[1], counts[2]));
            }
        }

        for (java.util.Map.Entry<String, long[]> entry : productCountsMap.entrySet()) {
            String cSlug = entry.getKey();
            if (!resultMap.containsKey(cSlug)) {
                String cName = productNamesMap.getOrDefault(cSlug, cSlug);
                long[] counts = entry.getValue();
                resultMap.put(cSlug, new DistrictCountDTO(cSlug, cName, counts[0], counts[1], counts[2]));
            }
        }

        return ResponseEntity.ok(new java.util.ArrayList<>(resultMap.values()));
    }

    public record StateCategoryCountDTO(
            String categorySlug,
            String categoryName,
            long count,
            boolean isAvailable
    ) {}

    /**
     * Dedicated State Category Counts Endpoint
     * GET /api/products/state/{stateSlug}/categories/counts
     * Returns canonical counts for all 4 state categories:
     * Art & Culture, History, Heritage & Sites, Geography.
     * Enforces:
     * - stateSlug = requested state
     * - districtSlug = "general" (resourceScope = STATE)
     * - published = true, archived != true, isDeleted != true
     */
    @GetMapping("/state/{stateSlug}/categories/counts")
    public ResponseEntity<List<StateCategoryCountDTO>> getStateCategoryCounts(@PathVariable String stateSlug) {
        String cleanStateSlug = Product.generateSlug(stateSlug);
        if (cleanStateSlug == null || cleanStateSlug.isBlank()) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }

        List<Product> stateProducts = productRepo.findByStateSlugAndDistrictSlugAndArchivedFalse(cleanStateSlug, "general")
                .stream()
                .filter(p -> p != null
                        && cleanStateSlug.equalsIgnoreCase(p.getStateSlug())
                        && p.isStateScope()
                        && Boolean.TRUE.equals(p.isPublished())
                        && !Boolean.TRUE.equals(p.isArchived())
                        && !Boolean.TRUE.equals(p.getIsDeleted()))
                .collect(java.util.stream.Collectors.toList());

        long artCultureCount = stateProducts.stream().filter(p -> p.matchesCategory(Product.CATEGORY_ART_CULTURE)).count();
        long historyCount = stateProducts.stream().filter(p -> p.matchesCategory(Product.CATEGORY_HISTORY)).count();
        long heritageSitesCount = stateProducts.stream().filter(p -> p.matchesCategory(Product.CATEGORY_HERITAGE_SITES)).count();
        long geographyCount = stateProducts.stream().filter(p -> p.matchesCategory(Product.CATEGORY_GEOGRAPHY)).count();

        List<StateCategoryCountDTO> list = java.util.List.of(
                new StateCategoryCountDTO(Product.SLUG_ART_CULTURE, Product.CATEGORY_ART_CULTURE, artCultureCount, artCultureCount > 0),
                new StateCategoryCountDTO(Product.SLUG_HISTORY, Product.CATEGORY_HISTORY, historyCount, historyCount > 0),
                new StateCategoryCountDTO(Product.SLUG_HERITAGE_SITES, Product.CATEGORY_HERITAGE_SITES, heritageSitesCount, heritageSitesCount > 0),
                new StateCategoryCountDTO(Product.SLUG_GEOGRAPHY, Product.CATEGORY_GEOGRAPHY, geographyCount, geographyCount > 0)
        );

        return ResponseEntity.ok(list);
    }

    /**
     * Public API to get all published products
     */
    @GetMapping
    public ResponseEntity<ApiResponseDTO> getAllPublishedProducts() {
        List<Product> products = productRepo.findByIsPublishedTrue().stream()
                .filter(p -> p != null && !Boolean.TRUE.equals(p.isArchived()) && !Boolean.TRUE.equals(p.getIsDeleted()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(products)
                .build());
    }

    /**
     * Public API to get products by state slug.
     * Supports optional `scope` and `category` query parameters for state-scoped filtering.
     * When scope=state, returns ONLY state-scoped resources matching category (if provided).
     * When scope is omitted, returns published products belonging to this state for general state/district metrics.
     */
    @GetMapping("/state/{slug}")
    public ResponseEntity<ApiResponseDTO> getProductsByState(
            @PathVariable String slug,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String category) {
        String cleanSlug = Product.generateSlug(slug);
        if (cleanSlug == null || cleanSlug.isBlank()) {
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .data(java.util.Collections.emptyList())
                    .build());
        }

        if ("state".equalsIgnoreCase(scope) || "general".equalsIgnoreCase(scope)) {
            String canonicalCategory = category != null && !category.isBlank()
                    ? Product.resolveCanonicalCategory(category)
                    : null;

            List<Product> products = productRepo.findByStateSlugAndDistrictSlugAndArchivedFalse(cleanSlug, "general")
                    .stream()
                    .filter(p -> p != null
                            && cleanSlug.equalsIgnoreCase(p.getStateSlug())
                            && p.isStateScope()
                            && Boolean.TRUE.equals(p.isPublished())
                            && !Boolean.TRUE.equals(p.isArchived())
                            && !Boolean.TRUE.equals(p.getIsDeleted()))
                    .filter(p -> canonicalCategory == null || p.matchesCategory(canonicalCategory))
                    .collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .data(products)
                    .build());
        }

        List<Product> products = productRepo.findByStateSlug(cleanSlug).stream()
                .filter(p -> p != null
                        && cleanSlug.equalsIgnoreCase(p.getStateSlug())
                        && Boolean.TRUE.equals(p.isPublished())
                        && !Boolean.TRUE.equals(p.isArchived())
                        && !Boolean.TRUE.equals(p.getIsDeleted()))
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(products)
                .build());
    }

    /**
     * Public API to get strictly state-scoped products by state slug and category.
     * Enforces strict state isolation:
     * - Resource belongs to the requested state
     * - Resource is strictly state-scoped (districtSlug = "general", state-level classification)
     * - Resource category strictly matches the canonical requested category
     * - Resource satisfies publication and access rules (published=true, archived=false)
     * Never falls back to returning all resources or district resources.
     */
    @GetMapping("/state/{stateSlug}/category/{category}")
    public ResponseEntity<ApiResponseDTO> getProductsByStateAndCategory(
            @PathVariable String stateSlug,
            @PathVariable String category) {
        String cleanStateSlug = Product.generateSlug(stateSlug);
        String canonicalCategory = Product.resolveCanonicalCategory(category);

        if (cleanStateSlug == null || cleanStateSlug.isBlank() || canonicalCategory == null) {
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .data(java.util.Collections.emptyList())
                    .build());
        }

        List<Product> products = productRepo.findByStateSlugAndDistrictSlugAndArchivedFalse(cleanStateSlug, "general")
                .stream()
                .filter(p -> p != null
                        && cleanStateSlug.equalsIgnoreCase(p.getStateSlug())
                        && p.isStateScope()
                        && p.matchesCategory(canonicalCategory)
                        && Boolean.TRUE.equals(p.isPublished())
                        && !Boolean.TRUE.equals(p.isArchived())
                        && !Boolean.TRUE.equals(p.getIsDeleted()))
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(products)
                .build());
    }

    /**
     * Public API to get products by state slug and district slug
     */
    @GetMapping("/state/{stateSlug}/district/{districtSlug}")
    public ResponseEntity<ApiResponseDTO> getProductsByStateAndDistrict(
            @PathVariable String stateSlug,
            @PathVariable String districtSlug) {

        String cleanStateSlug = Product.generateSlug(stateSlug);
        String cleanDistrictSlug = Product.generateSlug(districtSlug);

        if (cleanDistrictSlug == null || "general".equalsIgnoreCase(cleanDistrictSlug) || "state".equalsIgnoreCase(cleanDistrictSlug)) {
            return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(java.util.Collections.emptyList())
                .build());
        }

        List<Product> products = productRepo
            .findByStateSlugAndDistrictSlugAndIsPublishedTrueAndArchivedFalse(
                    cleanStateSlug, cleanDistrictSlug)
            .stream()
            .filter(p -> p != null && !Boolean.TRUE.equals(p.getIsDeleted()))
            .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(ApiResponseDTO.builder()
            .success(true)
            .data(products)
            .build());
    }

    /**
     * Public API to get district section availability breakdown
     * Checks published free resources for History, Heritage Sites & Monuments,
     * Geography, Art & Culture.
     */
    @GetMapping("/state/{stateSlug}/district/{districtSlug}/sections")
    public ResponseEntity<ApiResponseDTO> getDistrictSectionAvailability(
            @PathVariable String stateSlug,
            @PathVariable String districtSlug) {
        String cleanStateSlug = Product.generateSlug(stateSlug);
        String cleanDistrictSlug = Product.generateSlug(districtSlug);

        List<Product> products = productRepo
                .findByStateSlugAndDistrictSlugAndIsPublishedTrueAndArchivedFalse(cleanStateSlug, cleanDistrictSlug);

        List<Product> freeProducts = products.stream()
                .filter(p -> p.isFree() || p.getPrice() == null || p.getPrice() == 0.0)
                .collect(java.util.stream.Collectors.toList());

        List<Product> paidProducts = products.stream()
                .filter(p -> !p.isFree() && p.getPrice() != null && p.getPrice() > 0.0)
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<String, Long> sectionCounts = new java.util.HashMap<>();
        sectionCounts.put("history", 0L);
        sectionCounts.put("heritage-monuments", 0L);
        sectionCounts.put("geography", 0L);
        sectionCounts.put("art-culture", 0L);

        for (Product p : freeProducts) {
            String secSlug = p.getSectionSlug() != null ? p.getSectionSlug().toLowerCase().trim() : "";
            if ("heritage-monuments".equals(secSlug) || "heritage".equals(secSlug) || "monuments".equals(secSlug)) {
                sectionCounts.put("heritage-monuments", sectionCounts.get("heritage-monuments") + 1);
                continue;
            }
            if ("geography".equals(secSlug)) {
                sectionCounts.put("geography", sectionCounts.get("geography") + 1);
                continue;
            }
            if ("art-culture".equals(secSlug) || "art".equals(secSlug) || "culture".equals(secSlug)) {
                sectionCounts.put("art-culture", sectionCounts.get("art-culture") + 1);
                continue;
            }
            if ("history".equals(secSlug)) {
                sectionCounts.put("history", sectionCounts.get("history") + 1);
                continue;
            }

            String cat = p.getCategory() != null ? p.getCategory().toLowerCase() : "";
            String title = p.getTitle() != null ? p.getTitle().toLowerCase() : "";
            String desc = p.getDescription() != null ? p.getDescription().toLowerCase() : "";
            String combined = cat + " " + title + " " + desc;

            if (combined.contains("heritage") || combined.contains("monument") || combined.contains("landmark")) {
                sectionCounts.put("heritage-monuments", sectionCounts.get("heritage-monuments") + 1);
            } else if (combined.contains("geography") || combined.contains("geographic")
                    || combined.contains("demography") || combined.contains("map")) {
                sectionCounts.put("geography", sectionCounts.get("geography") + 1);
            } else if (combined.contains("art") || combined.contains("culture") || combined.contains("tradition")
                    || combined.contains("festival")) {
                sectionCounts.put("art-culture", sectionCounts.get("art-culture") + 1);
            } else {
                sectionCounts.put("history", sectionCounts.get("history") + 1);
            }
        }

        java.util.Map<String, Object> sectionsMap = new java.util.LinkedHashMap<>();
        sectionsMap.put("history", java.util.Map.of("id", "history", "label", "History", "count",
                sectionCounts.get("history"), "isAvailable", sectionCounts.get("history") > 0));
        sectionsMap.put("heritage-monuments",
                java.util.Map.of("id", "heritage-monuments", "label", "Heritage Sites & Monuments", "count",
                        sectionCounts.get("heritage-monuments"), "isAvailable",
                        sectionCounts.get("heritage-monuments") > 0));
        sectionsMap.put("geography", java.util.Map.of("id", "geography", "label", "Geography", "count",
                sectionCounts.get("geography"), "isAvailable", sectionCounts.get("geography") > 0));
        sectionsMap.put("art-culture", java.util.Map.of("id", "art-culture", "label", "Art & Culture", "count",
                sectionCounts.get("art-culture"), "isAvailable", sectionCounts.get("art-culture") > 0));

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("stateSlug", cleanStateSlug);
        result.put("districtSlug", cleanDistrictSlug);
        result.put("sections", sectionsMap);
        result.put("freeTotal", freeProducts.size());
        result.put("paidTotal", paidProducts.size());

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(result)
                .build());
    }

    /**
     * Public API to get products by district slug
     */
    @GetMapping("/district/{districtSlug}")
    public ResponseEntity<ApiResponseDTO> getProductsByDistrict(@PathVariable String districtSlug) {
        String cleanDistrictSlug = Product.generateSlug(districtSlug);
        if (cleanDistrictSlug == null || "general".equalsIgnoreCase(cleanDistrictSlug) || "state".equalsIgnoreCase(cleanDistrictSlug)) {
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .data(java.util.Collections.emptyList())
                    .build());
        }
        List<Product> products = productRepo.findByDistrictSlugAndIsPublishedTrue(cleanDistrictSlug).stream()
                .filter(p -> p != null && !Boolean.TRUE.equals(p.isArchived()) && !Boolean.TRUE.equals(p.getIsDeleted()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(products)
                .build());
    }

    /**
     * Get single product by id
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> getProductById(@PathVariable String id) {
        return productRepo.findById(id)
                .map(p -> ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(p).build()))
                .orElse(ResponseEntity.status(404)
                        .body(ApiResponseDTO.builder().success(false).message("Not Found").build()));
    }

    /**
     * Admin API to create product
     */
    @PostMapping
    public ResponseEntity<ApiResponseDTO> createProduct(@RequestBody Product product) {
        product.setPrice(product.isFree() ? 0.0 : 99.0);
        product.setCreatedAt(new Date());
        if (product.getState() != null) {
            Map.Entry<String, String> st = com.bodhganga.bodhganga.util.DistrictParser.parseState(product.getState());
            product.setState(st.getKey());
            product.setStateSlug(st.getValue());
        }
        if (product.getDistrict() != null) {
            Map.Entry<String, String> dist = com.bodhganga.bodhganga.util.DistrictParser.parseDistrict(product.getDistrict());
            product.setDistrict(dist.getKey());
            product.setDistrictSlug(dist.getValue());
        } else {
            product.setDistrict("general");
            product.setDistrictSlug("general");
        }
        Product saved = productRepo.save(product);
        return ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(saved).build());
    }

    /**
     * Admin API to update product
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> updateProduct(@PathVariable String id, @RequestBody Product product) {
        if (!productRepo.existsById(id)) {
            return ResponseEntity.status(404)
                    .body(ApiResponseDTO.builder().success(false).message("Not Found").build());
        }
        product.setPrice(product.isFree() ? 0.0 : 99.0);
        product.setId(id);
        if (product.getState() != null) {
            Map.Entry<String, String> st = com.bodhganga.bodhganga.util.DistrictParser.parseState(product.getState());
            product.setState(st.getKey());
            product.setStateSlug(st.getValue());
        }
        if (product.getDistrict() != null) {
            Map.Entry<String, String> dist = com.bodhganga.bodhganga.util.DistrictParser.parseDistrict(product.getDistrict());
            product.setDistrict(dist.getKey());
            product.setDistrictSlug(dist.getValue());
        } else {
            product.setDistrict("general");
            product.setDistrictSlug("general");
        }
        Product saved = productRepo.save(product);
        return ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(saved).build());
    }

    /**
     * Admin API to delete product
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> deleteProduct(@PathVariable String id) {
        productRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponseDTO.builder().success(true).build());
    }
}
