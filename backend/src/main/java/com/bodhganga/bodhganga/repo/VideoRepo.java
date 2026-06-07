package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Video;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface VideoRepo extends MongoRepository<Video, String> {
    Optional<Video> findByVideoId(String videoId);
}
