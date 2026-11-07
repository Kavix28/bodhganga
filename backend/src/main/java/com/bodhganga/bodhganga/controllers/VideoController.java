package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.entity.Video;
import com.bodhganga.bodhganga.repo.VideoRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/videos")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://bodhganga.in", "https://www.bodhganga.in"})
public class VideoController {

    private static final Logger log = LoggerFactory.getLogger(VideoController.class);
    private final VideoRepo videoRepo;

    public VideoController(VideoRepo videoRepo) {
        this.videoRepo = videoRepo;
    }

    @GetMapping
    public ResponseEntity<List<Video>> getAllVideos() {
        try {
            List<Video> videos = videoRepo.findAll(Sort.by(Sort.Direction.DESC, "publishedAt"));
            return ResponseEntity.ok(videos != null ? videos : Collections.emptyList());
        } catch (Exception e) {
            log.error("Failed to query all videos: {}", e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<List<Video>> getLatestVideos() {
        try {
            List<Video> videos = videoRepo.findAll(Sort.by(Sort.Direction.DESC, "publishedAt"))
                    .stream()
                    .filter(v -> v != null && v.getVideoId() != null && !v.getVideoId().isBlank())
                    .limit(6)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            log.error("Failed to query latest videos: {}", e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }
}
