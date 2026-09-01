package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.entity.Video;
import com.bodhganga.bodhganga.repo.VideoRepo;
import com.bodhganga.bodhganga.services.YouTubeSyncService;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoRepo videoRepo;
    private final YouTubeSyncService youTubeSyncService;

    public VideoController(VideoRepo videoRepo, YouTubeSyncService youTubeSyncService) {
        this.videoRepo = videoRepo;
        this.youTubeSyncService = youTubeSyncService;
    }

    @GetMapping
    public ResponseEntity<List<Video>> getAllVideos() {
        youTubeSyncService.seedDefaultVideosIfEmpty();
        List<Video> videos = videoRepo.findAll(Sort.by(Sort.Direction.DESC, "publishedAt"));
        return ResponseEntity.ok(videos);
    }

    @GetMapping("/latest")
    public ResponseEntity<List<Video>> getLatestVideos() {
        youTubeSyncService.seedDefaultVideosIfEmpty();
        List<Video> videos = videoRepo.findAll(Sort.by(Sort.Direction.DESC, "publishedAt"))
                .stream()
                .limit(6)
                .collect(Collectors.toList());
        return ResponseEntity.ok(videos);
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> triggerSync() {
        Map<String, Object> result = youTubeSyncService.syncNow();
        return ResponseEntity.ok(result);
    }
}
