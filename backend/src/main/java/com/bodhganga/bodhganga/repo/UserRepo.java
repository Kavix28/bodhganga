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
}
