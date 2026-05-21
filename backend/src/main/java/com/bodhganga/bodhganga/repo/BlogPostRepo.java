package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.BlogPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;

public interface BlogPostRepo extends MongoRepository<BlogPost, String> {

    Optional<BlogPost> findBySlug(String slug);

    Page<BlogPost> findByStatus(String status, Pageable pageable);

    @Query("{ $or: [ { title: { $regex: ?0, $options: 'i' } }, { content: { $regex: ?0, $options: 'i' } }, { category: { $regex: ?0, $options: 'i' } } ] }")
    Page<BlogPost> searchByQuery(String query, Pageable pageable);
}
