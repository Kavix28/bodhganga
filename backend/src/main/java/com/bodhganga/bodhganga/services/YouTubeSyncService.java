package com.bodhganga.bodhganga.services;

import com.bodhganga.bodhganga.entity.Video;
import com.bodhganga.bodhganga.repo.VideoRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class YouTubeSyncService {

    private static final Logger log = LoggerFactory.getLogger(YouTubeSyncService.class);

    @Value("${youtube.api.key:}")
    private String apiKey;

    @Value("${youtube.channel.id:}")
    private String channelId;

    private final VideoRepo videoRepo;
    private final RestTemplate restTemplate;

    public YouTubeSyncService(VideoRepo videoRepo) {
        this.videoRepo = videoRepo;
        this.restTemplate = new RestTemplate();
    }

    @PostConstruct
    public void init() {
        log.info("YouTubeSyncService initialized. API Key present: {}, Channel ID: {}", 
                 (apiKey != null && !apiKey.isBlank()), channelId);
        // Sync videos on startup asynchronously to not block main thread
        new Thread(this::syncVideos).start();
    }

    // Run every 12 hours
    @Scheduled(cron = "0 0 */12 * * *")
    public void scheduledSync() {
        log.info("Running scheduled YouTube sync...");
        syncVideos();
    }

    public synchronized void syncVideos() {
        if (apiKey == null || apiKey.isBlank() || channelId == null || channelId.isBlank()) {
            log.warn("YouTube API Key or Channel ID is missing. Skipping sync.");
            return;
        }

        try {
            String url = String.format(
                "https://www.googleapis.com/youtube/v3/search?key=%s&channelId=%s&part=snippet&type=video&order=date&maxResults=15",
                apiKey, channelId
            );

            log.info("Fetching videos from YouTube API for channel: {}", channelId);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null || !response.containsKey("items")) {
                log.warn("Empty response or items not found in YouTube API response");
                return;
            }

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
            log.info("YouTube API returned {} items", items.size());

            int newVideos = 0;
            SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
            isoFormat.setTimeZone(TimeZone.getTimeZone("UTC"));

            for (Map<String, Object> item : items) {
                Map<String, Object> idMap = (Map<String, Object>) item.get("id");
                String videoId = (String) idMap.get("videoId");
                if (videoId == null) continue;

                Map<String, Object> snippet = (Map<String, Object>) item.get("snippet");
                String title = (String) snippet.get("title");
                String description = (String) snippet.get("description");
                String publishedAtStr = (String) snippet.get("publishedAt");

                Date publishedAt = new Date();
                try {
                    publishedAt = isoFormat.parse(publishedAtStr);
                } catch (Exception ex) {
                    log.warn("Failed parsing date: {}", publishedAtStr);
                }

                Map<String, Object> thumbnails = (Map<String, Object>) snippet.get("thumbnails");
                String thumbnailUrl = "";
                if (thumbnails != null) {
                    Map<String, Object> high = (Map<String, Object>) thumbnails.get("high");
                    if (high != null) {
                        thumbnailUrl = (String) high.get("url");
                    } else {
                        Map<String, Object> def = (Map<String, Object>) thumbnails.get("default");
                        if (def != null) thumbnailUrl = (String) def.get("url");
                    }
                }

                String youtubeUrl = "https://www.youtube.com/watch?v=" + videoId;

                Optional<Video> existingOpt = videoRepo.findByVideoId(videoId);
                if (existingOpt.isEmpty()) {
                    Video video = new Video(videoId, title, thumbnailUrl, youtubeUrl, publishedAt);
                    videoRepo.save(video);
                    newVideos++;
                } else {
                    Video video = existingOpt.get();
                    video.setTitle(title);
                    video.setThumbnailUrl(thumbnailUrl);
                    video.setYoutubeUrl(youtubeUrl);
                    video.setPublishedAt(publishedAt);
                    videoRepo.save(video);
                }
            }

            log.info("YouTube sync finished. Inserted {} new videos.", newVideos);

        } catch (Exception e) {
            log.error("Failed to sync YouTube videos: {}", e.getMessage());
        }
    }
}
