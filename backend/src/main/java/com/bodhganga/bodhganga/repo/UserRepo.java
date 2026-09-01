package com.bodhganga.bodhganga.repo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.bodhganga.bodhganga.entity.User;

import java.util.Date;
import java.util.Optional;

@Repository
public interface UserRepo extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByPhoneNo(String phoneNo);

    Boolean existsByEmail(String email);

    Boolean existsByPhoneNo(String phoneNo);

    long deleteByIsVerified(boolean isVerified);

    long deleteByEmailVerifiedFalseAndPhoneVerifiedFalse();

    /** Count users registered after the given date (for weekly/monthly growth) */
    long countByCreatedAtAfter(Date date);

    /** Fetch recent user registrations */
    java.util.List<User> findTop20ByOrderByCreatedAtDesc();

    /**
     * Unified lookup by Mongo ID, email (case-insensitive), or normalized phone
     * number
     */
    default Optional<User> findByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }
        String trimmed = identifier.trim();
        Optional<User> user = findById(trimmed);
        if (user.isPresent())
            return user;

        user = findByEmailIgnoreCase(trimmed);
        if (user.isPresent())
            return user;

        String digits = trimmed.replaceAll("[^0-9]", "");
        if (digits.startsWith("91") && digits.length() == 12) {
            digits = digits.substring(2);
        } else if (digits.startsWith("0") && digits.length() == 11) {
            digits = digits.substring(1);
        }
        if (!digits.isBlank()) {
            user = findByPhoneNo(digits);
            if (user.isPresent())
                return user;
        }
        return Optional.empty();
    }
}
