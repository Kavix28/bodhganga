package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.State;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface StateRepo extends MongoRepository<State, String> {
    Optional<State> findByCode(String code);
    List<State> findByType(String type);
    boolean existsByCode(String code);
}
