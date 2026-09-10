package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepo productRepo;

    public ProductController(ProductRepo productRepo) {
        this.productRepo = productRepo;
    }

    /**
     * Public API to get all published products
     */
    @GetMapping
    public ResponseEntity<ApiResponseDTO> getAllPublishedProducts() {
        List<Product> products = productRepo.findByIsPublishedTrue();
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(products)
                .build());
    }

    /**
     * Public API to get products by state slug
     */
    @GetMapping("/state/{slug}")
    public ResponseEntity<ApiResponseDTO> getProductsByState(@PathVariable String slug) {
        String cleanSlug = Product.generateSlug(slug);
        List<Product> products = productRepo.findByStateSlugAndDistrictSlugAndArchivedFalse(cleanSlug, "general");
        if (products.isEmpty()) {
            products = productRepo.findByStateSlug(cleanSlug).stream()
                    .filter(p -> Boolean.TRUE.equals(p.isPublished()) && !Boolean.TRUE.equals(p.isArchived()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(products)
                .build());
    }

    /**
     * Public API to get products by state slug and category
     */
    @GetMapping("/state/{stateSlug}/category/{category}")
    public ResponseEntity<ApiResponseDTO> getProductsByStateAndCategory(@PathVariable String stateSlug,
            @PathVariable String category) {
        String cleanStateSlug = Product.generateSlug(stateSlug);
        List<Product> products = productRepo.findByStateSlugAndCategoryAndIsPublishedTrue(cleanStateSlug, category)
                .stream()
                .filter(p -> !Boolean.TRUE.equals(p.isArchived()))
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
    public ResponseEntity<ApiResponseDTO> getProductsByStateAndDistrict(@PathVariable String stateSlug,
            @PathVariable String districtSlug) {
        String cleanStateSlug = Product.generateSlug(stateSlug);
        String cleanDistrictSlug = Product.generateSlug(districtSlug);
        List<Product> products = productRepo
                .findByStateSlugAndDistrictSlugAndIsPublishedTrueAndArchivedFalse(cleanStateSlug, cleanDistrictSlug);
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
        List<Product> products = productRepo.findByDistrictSlugAndIsPublishedTrue(cleanDistrictSlug).stream()
                .filter(p -> !Boolean.TRUE.equals(p.isArchived()))
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
            product.setStateSlug(Product.generateSlug(product.getState()));
        }
        if (product.getDistrict() != null) {
            product.setDistrictSlug(Product.generateSlug(product.getDistrict()));
        } else {
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
            product.setStateSlug(Product.generateSlug(product.getState()));
        }
        if (product.getDistrict() != null) {
            product.setDistrictSlug(Product.generateSlug(product.getDistrict()));
        } else {
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
