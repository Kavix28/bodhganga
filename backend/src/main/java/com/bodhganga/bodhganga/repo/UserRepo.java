package com.bodhganga.bodhganga.repo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.bodhganga.bodhganga.entity.User;

import java.util.Optional;

@Repository
public interface UserRepo extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneNo(String phoneNo);

    Boolean existsByEmail(String email);

    Boolean existsByPhoneNo(String phoneNo);

    long deleteByIsVerified(Boolean isVerified);

    long deleteByEmailVerifiedFalseAndPhoneVerifiedFalse();
}
