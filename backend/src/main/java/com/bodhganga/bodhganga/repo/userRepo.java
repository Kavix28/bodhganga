package com.bodhganga.bodhganga.repo;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.bodhganga.bodhganga.entity.User;

@Repository
public interface userRepo extends MongoRepository<User, String> {
    User findByEmail(String email);
}
