package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.entity.Video;
import com.bodhganga.bodhganga.repo.VideoRepo;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoRepo videoRepo;

    public VideoController(VideoRepo videoRepo) {
        this.videoRepo = videoRepo;
    }

    @GetMapping
    public ResponseEntity<List<Video>> getAllVideos() {
        List<Video> videos = videoRepo.findAll(Sort.by(Sort.Direction.DESC, "publishedAt"));
        return ResponseEntity.ok(videos);
    }

    @GetMapping("/latest")
    public ResponseEntity<List<Video>> getLatestVideos() {
        List<Video> videos = videoRepo.findAll(Sort.by(Sort.Direction.DESC, "publishedAt"))
                .stream()
                .limit(6)
                .collect(Collectors.toList());
        return ResponseEntity.ok(videos);
    }
}
