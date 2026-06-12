package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.entity.Order;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.OrderRepo;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.services.GeminiAiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final Logger log = LoggerFactory.getLogger(AiController.class);

    private final GeminiAiService geminiAiService;
    private final OrderRepo orderRepo;
    private final ProductRepo productRepo;
    private final UserRepo userRepo;

    public AiController(GeminiAiService geminiAiService, OrderRepo orderRepo,
                        ProductRepo productRepo, UserRepo userRepo) {
        this.geminiAiService = geminiAiService;
        this.orderRepo = orderRepo;
        this.productRepo = productRepo;
        this.userRepo = userRepo;
    }

    /**
     * POST /api/ai/general
     * Public - no auth required. Site FAQ assistant.
     */
    @PostMapping("/general")
    public ResponseEntity<Map<String, Object>> generalChat(@RequestBody Map<String, Object> body) {
        try {
            String message = (String) body.get("message");
            if (message == null || message.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "reply", "Message is required"));
            }
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> history =
                (List<Map<String, Object>>) body.getOrDefault("history", List.of());

            String reply = geminiAiService.generalChat(history, message);
            return ResponseEntity.ok(Map.of("success", true, "reply", reply));

        } catch (Exception e) {
            log.error("General AI chat error: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", false,
                "reply", "Sorry, I am having trouble right now. Please try again in a moment."));
        }
    }

    /**
     * POST /api/ai/study
     * Auth-required - personalized study companion.
     */
    @PostMapping("/study")
    public ResponseEntity<Map<String, Object>> studyChat(@RequestBody Map<String, Object> body) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()
                    || "anonymousUser".equals(auth.getPrincipal())) {
                return ResponseEntity.status(401).body(Map.of("success", false,
                    "reply", "Please log in to use the Study Companion."));
            }

            String email = auth.getName();

            String message = (String) body.get("message");
            if (message == null || message.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "reply", "Message is required"));
            }
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> history =
                (List<Map<String, Object>>) body.getOrDefault("history", List.of());

            Optional<User> userOpt = userRepo.findByEmail(email);
            String userName = "Student";
            String userId = email;
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getName() != null && !user.getName().isBlank()) userName = user.getName();
                if (user.getId() != null) userId = user.getId();
            }

            List<String> purchasedDistricts = getPurchasedDistricts(userId);
            String reply = geminiAiService.studyChat(userName, purchasedDistricts, history, message);
            return ResponseEntity.ok(Map.of("success", true, "reply", reply));

        } catch (Exception e) {
            log.error("Study AI chat error: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", false,
                "reply", "Sorry, I am having trouble right now. Please try again in a moment."));
        }
    }

    private List<String> getPurchasedDistricts(String userId) {
        try {
            return orderRepo.findByUserId(userId).stream()
                .filter(o -> "PAID".equals(o.getStatus()))
                .map(Order::getProductId)
                .filter(pid -> pid != null && !pid.isBlank())
                .map(pid -> {
                    Optional<Product> p = productRepo.findById(pid);
                    return p.map(Product::getDistrict).orElse(null);
                })
                .filter(d -> d != null && !d.isBlank())
                .distinct()
                .toList();
        } catch (Exception e) {
            log.warn("Could not fetch purchased districts for {}: {}", userId, e.getMessage());
            return List.of();
        }
    }
}
