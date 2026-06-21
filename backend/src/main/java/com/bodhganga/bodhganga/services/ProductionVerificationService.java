package com.bodhganga.bodhganga.services;

import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.StateRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductionVerificationService {

    private static final org.slf4j.Logger log = LoggerFactory.getLogger(ProductionVerificationService.class);

    private final StateRepo stateRepo;
    private final ProductRepo productRepo;

    public ProductionVerificationService(StateRepo stateRepo, ProductRepo productRepo) {
        this.stateRepo = stateRepo;
        this.productRepo = productRepo;
    }

    public Map<String, Object> getSummary() {
        Map<String, Object> summary = new HashMap<>();

        List<State> allStates = stateRepo.findAll();
        long totalStates = allStates.stream().filter(s -> "STATE".equalsIgnoreCase(s.getType())).count();
        long totalUTs = allStates.size() - totalStates;

        long totalDistricts = 0;
        long coveredDistricts = 0;

        List<Product> allProducts = productRepo.findAll();
        // Group published products by state slug and district slug
        Set<String> coveredCombinations = allProducts.stream()
                .filter(Product::isPublished)
                .map(p -> p.getStateSlug() + "|" + p.getDistrictSlug())
                .collect(Collectors.toSet());

        for (State state : allStates) {
            String stateSlug = state.getId(); // state.getId() is the state slug in DB (e.g. "bihar")
            if (state.getDistricts() != null) {
                totalDistricts += state.getDistricts().size();
                for (String district : state.getDistricts()) {
                    String districtSlug = Product.generateSlug(district);
                    if (coveredCombinations.contains(stateSlug + "|" + districtSlug)) {
                        coveredDistricts++;
                    }
                }
            }
        }

        long uncoveredDistricts = totalDistricts - coveredDistricts;
        double coveragePercentage = totalDistricts > 0 ? (coveredDistricts * 100.0) / totalDistricts : 0.0;

        summary.put("totalStates", totalStates);
        summary.put("totalUTs", totalUTs);
        summary.put("totalDistricts", totalDistricts);
        summary.put("coveredDistricts", coveredDistricts);
        summary.put("uncoveredDistricts", uncoveredDistricts);
        summary.put("coveragePercentage", Math.round(coveragePercentage * 100.0) / 100.0);
        summary.put("totalProducts", (long) allProducts.size());
        summary.put("publishedProducts", allProducts.stream().filter(Product::isPublished).count());
        summary.put("importedProducts", allProducts.stream().filter(p -> Boolean.TRUE.equals(p.getImportedFromDrive())).count());
        summary.put("failedProducts", allProducts.stream().filter(p -> IngestionStatus.FAILED == p.getIngestionStatus()).count());
        summary.put("archivedProducts", allProducts.stream().filter(Product::isArchived).count());

        return summary;
    }

    public List<Map<String, Object>> getDistricts() {
        List<Map<String, Object>> result = new ArrayList<>();
        List<State> allStates = stateRepo.findAll();
        List<Product> allProducts = productRepo.findAll();

        // Group products by stateSlug -> districtSlug -> List<Product>
        Map<String, Map<String, List<Product>>> groupedProducts = allProducts.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getStateSlug() != null ? p.getStateSlug() : "",
                        Collectors.groupingBy(p -> p.getDistrictSlug() != null ? p.getDistrictSlug() : "")
                ));

        for (State state : allStates) {
            String stateSlug = state.getId();
            String stateName = state.getName();
            String stateType = state.getType();

            if (state.getDistricts() != null) {
                for (String district : state.getDistricts()) {
                    String districtSlug = Product.generateSlug(district);

                    List<Product> districtProducts = groupedProducts
                            .getOrDefault(stateSlug, Collections.emptyMap())
                            .getOrDefault(districtSlug, Collections.emptyList());

                    long productCount = districtProducts.size();
                    long publishedCount = districtProducts.stream().filter(Product::isPublished).count();
                    boolean isLive = publishedCount > 0;

                    Map<String, Object> districtMap = new LinkedHashMap<>();
                    districtMap.put("stateName", stateName);
                    districtMap.put("stateSlug", stateSlug);
                    districtMap.put("stateType", stateType);
                    districtMap.put("districtName", district);
                    districtMap.put("districtSlug", districtSlug);
                    districtMap.put("productCount", productCount);
                    districtMap.put("publishedProductCount", publishedCount);
                    districtMap.put("isLive", isLive);
                    districtMap.put("status", isLive ? "LIVE" : "EMPTY");

                    result.add(districtMap);
                }
            }
        }

        return result;
    }

    public Map<String, Object> getLeaks() {
        Map<String, Object> leaks = new HashMap<>();
        List<State> allStates = stateRepo.findAll();
        List<Product> allProducts = productRepo.findAll();

        // Identify covered state/district combinations
        Set<String> coveredCombinations = allProducts.stream()
                .filter(Product::isPublished)
                .map(p -> p.getStateSlug() + "|" + p.getDistrictSlug())
                .collect(Collectors.toSet());

        List<Map<String, Object>> uncoveredList = new ArrayList<>();

        for (State state : allStates) {
            String stateSlug = state.getId();
            String stateName = state.getName();
            if (state.getDistricts() != null) {
                for (String district : state.getDistricts()) {
                    String districtSlug = Product.generateSlug(district);
                    if (!coveredCombinations.contains(stateSlug + "|" + districtSlug)) {
                        Map<String, Object> uncovered = new LinkedHashMap<>();
                        uncovered.put("stateName", stateName);
                        uncovered.put("stateSlug", stateSlug);
                        uncovered.put("districtName", district);
                        uncovered.put("districtSlug", districtSlug);
                        uncoveredList.add(uncovered);
                    }
                }
            }
        }

        List<Product> failedProducts = allProducts.stream()
                .filter(p -> IngestionStatus.FAILED == p.getIngestionStatus())
                .collect(Collectors.toList());

        leaks.put("uncoveredCount", uncoveredList.size());
        leaks.put("uncoveredDistricts", uncoveredList);
        leaks.put("failedIngestionCount", failedProducts.size());
        leaks.put("failedIngestionProducts", failedProducts);

        return leaks;
    }

    public Map<String, Object> getCoverage() {
        Map<String, Object> coverage = new HashMap<>();

        List<State> allStates = stateRepo.findAll();
        long totalDistricts = 0;
        long coveredDistricts = 0;

        List<Product> allProducts = productRepo.findAll();
        Set<String> coveredCombinations = allProducts.stream()
                .filter(Product::isPublished)
                .map(p -> p.getStateSlug() + "|" + p.getDistrictSlug())
                .collect(Collectors.toSet());

        for (State state : allStates) {
            String stateSlug = state.getId();
            if (state.getDistricts() != null) {
                totalDistricts += state.getDistricts().size();
                for (String district : state.getDistricts()) {
                    String districtSlug = Product.generateSlug(district);
                    if (coveredCombinations.contains(stateSlug + "|" + districtSlug)) {
                        coveredDistricts++;
                    }
                }
            }
        }

        double coveragePercentage = totalDistricts > 0 ? (coveredDistricts * 100.0) / totalDistricts : 0.0;

        coverage.put("totalDistricts", totalDistricts);
        coverage.put("coveredDistricts", coveredDistricts);
        coverage.put("coveragePercentage", Math.round(coveragePercentage * 100.0) / 100.0);

        return coverage;
    }

    public Map<String, Object> reconcileAll() {
        log.info("[RECONCILIATION] Starting global reconciliation of all states and products.");
        List<State> allStates = stateRepo.findAll();
        List<Product> allProducts = productRepo.findAll();

        // Group products by stateSlug -> List<Product>
        Map<String, List<Product>> stateProducts = allProducts.stream()
                .collect(Collectors.groupingBy(p -> p.getStateSlug() != null ? p.getStateSlug() : ""));

        long updatedStatesCount = 0;

        for (State state : allStates) {
            String stateSlug = state.getId();
            List<Product> products = stateProducts.getOrDefault(stateSlug, Collections.emptyList());

            int notesCount = 0;
            int questionsCount = 0;
            int solutionsCount = 0;

            for (Product p : products) {
                if (p.isPublished()) {
                    String contentType = p.getContentType() != null ? p.getContentType().toUpperCase() : "";
                    String category = p.getCategory() != null ? p.getCategory().toLowerCase() : "";

                    if (category.contains("note") || "PDF".equals(contentType)) {
                        notesCount++;
                    } else if (category.contains("question") || "Question Bank".equalsIgnoreCase(p.getCategory())) {
                        questionsCount++;
                    } else {
                        solutionsCount++;
                    }
                }
            }

            if (state.getNotesCount() != notesCount ||
                state.getQuestionsCount() != questionsCount ||
                state.getSolutionsCount() != solutionsCount) {

                state.setNotesCount(notesCount);
                state.setQuestionsCount(questionsCount);
                state.setSolutionsCount(solutionsCount);
                state.setUpdatedAt(new Date());
                stateRepo.save(state);
                updatedStatesCount++;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Global reconciliation complete. Updated " + updatedStatesCount + " state counters.");
        return response;
    }

    public Map<String, Object> reconcileDistrict(String stateSlug, String districtSlug) {
        log.info("[RECONCILIATION] Reconciling district: state={}, district={}", stateSlug, districtSlug);
        Optional<State> stateOpt = stateRepo.findById(stateSlug);
        if (stateOpt.isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "State not found: " + stateSlug);
            return err;
        }

        State state = stateOpt.get();
        List<Product> products = productRepo.findByStateSlug(stateSlug);

        // Filter products specifically for the district
        List<Product> districtProducts = products.stream()
                .filter(p -> districtSlug.equals(p.getDistrictSlug()))
                .collect(Collectors.toList());

        long totalProducts = districtProducts.size();
        long publishedProducts = districtProducts.stream().filter(Product::isPublished).count();

        // Also trigger state-level reconciliation since district changed
        reconcileAll();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("stateSlug", stateSlug);
        response.put("districtSlug", districtSlug);
        response.put("totalProducts", totalProducts);
        response.put("publishedProducts", publishedProducts);
        response.put("message", "District reconciliation complete.");
        return response;
    }
}
