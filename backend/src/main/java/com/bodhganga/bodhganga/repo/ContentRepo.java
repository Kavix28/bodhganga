package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Content;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ContentRepo extends MongoRepository<Content, String> {
    List<Content> findByStateId(String stateId);

    /** Count content items by type ("pdf" or "video") */
    long countByType(String type);
}
