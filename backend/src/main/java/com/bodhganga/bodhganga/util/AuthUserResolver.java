package com.bodhganga.bodhganga.util;

import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.UserRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AuthUserResolver {

    private static final Logger log = LoggerFactory.getLogger(AuthUserResolver.class);
    private final UserRepo userRepo;

    public AuthUserResolver(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    /**
     * Resolves the authenticated User entity from Spring Security Authentication.
     * Supports resolution by email (case-insensitive) or mobile number
     * (normalized).
     */
    public Optional<User> resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            return Optional.empty();
        }

        String principalName = authentication.getName();
        if (principalName == null || principalName.isBlank()) {
            return Optional.empty();
        }

        String cleaned = principalName.trim();

        // 1. Check by email (case-insensitive)
        Optional<User> userOpt = userRepo.findByEmailIgnoreCase(cleaned);
        if (userOpt.isPresent()) {
            return userOpt;
        }

        // 2. Check by exact phone number
        userOpt = userRepo.findByPhoneNo(cleaned);
        if (userOpt.isPresent()) {
            return userOpt;
        }

        // 3. Normalize phone number (digits only, strip 91 prefix if 12 digits)
        String digitsOnly = cleaned.replaceAll("[^0-9]", "");
        if (digitsOnly.startsWith("91") && digitsOnly.length() == 12) {
            digitsOnly = digitsOnly.substring(2);
        }

        if (!digitsOnly.isBlank()) {
            userOpt = userRepo.findByPhoneNo(digitsOnly);
            if (userOpt.isPresent()) {
                return userOpt;
            }
        }

        log.warn("Authenticated principal could not be resolved to any User record");
        return Optional.empty();
    }

    /**
     * Resolves the authenticated User or throws a RuntimeException if not found.
     */
    public User resolveUserOrThrow(Authentication authentication) {
        return resolveUser(authentication)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }
}
