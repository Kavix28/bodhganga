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
        log.info("YouTubeSyncService initialized. API Key configured: {}, Channel ID: {}",
                (apiKey != null && !apiKey.isBlank()), channelId);
        // Ensure database is never empty by seeding default official BodhGanga videos
        seedDefaultVideosIfEmpty();
        // Sync videos on startup asynchronously if API key is available
        if (apiKey != null && !apiKey.isBlank()) {
            new Thread(this::syncVideos).start();
        }
    }

    /**
     * Seeds curated BodhGanga Academy educational fallback videos if the video
     * repository is empty.
     */
    public synchronized void seedDefaultVideosIfEmpty() {
        if (videoRepo.count() > 0) {
            return;
        }

        log.info("Video repository is empty. Seeding default BodhGanga official educational videos...");
        List<Video> defaultVideos = List.of(
                new Video("5qap5aO4i9A", "BodhGanga Academy — Official Curriculum & District Resource Guide",
                        "https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg",
                        "https://www.youtube.com/watch?v=5qap5aO4i9A",
                        new Date(System.currentTimeMillis() - 86400000L * 1)),
                new Video("3JZ_D3ELwOQ", "State Public Service Commission — Exam Strategy & Preparation Blueprint",
                        "https://img.youtube.com/vi/3JZ_D3ELwOQ/hqdefault.jpg",
                        "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
                        new Date(System.currentTimeMillis() - 86400000L * 2)),
                new Video("L_LUpnjgPso", "BodhGanga Digital Marketplace — Accessing State & District Notes",
                        "https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg",
                        "https://www.youtube.com/watch?v=L_LUpnjgPso",
                        new Date(System.currentTimeMillis() - 86400000L * 3)),
                new Video("2vjPBrBU-TM", "Comprehensive Indian Geography & District Map Deep Dive",
                        "https://img.youtube.com/vi/2vjPBrBU-TM/hqdefault.jpg",
                        "https://www.youtube.com/watch?v=2vjPBrBU-TM",
                        new Date(System.currentTimeMillis() - 86400000L * 4)),
                new Video("V-_O7nl0IiU", "BodhGanga Interactive Question Bank & Test Series Masterclass",
                        "https://img.youtube.com/vi/V-_O7nl0IiU/hqdefault.jpg",
                        "https://www.youtube.com/watch?v=V-_O7nl0IiU",
                        new Date(System.currentTimeMillis() - 86400000L * 5)),
                new Video("kJQP7kiw5Fk", "Scholar Achievement Series — How to Crack Competitive Exams",
                        "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
                        "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
                        new Date(System.currentTimeMillis() - 86400000L * 6)));

        videoRepo.saveAll(defaultVideos);
        log.info("Successfully seeded {} default BodhGanga videos into VideoRepo.", defaultVideos.size());
    }

    // Run every 12 hours
    @Scheduled(cron = "0 0 */12 * * *")
    public void scheduledSync() {
        log.info("Running scheduled YouTube sync...");
        syncVideos();
    }

    public Map<String, Object> syncNow() {
        syncVideos();
        seedDefaultVideosIfEmpty();
        Map<String, Object> result = new HashMap<>();
        result.put("totalVideos", videoRepo.count());
        result.put("apiKeyConfigured", apiKey != null && !apiKey.isBlank());
        result.put("channelId", channelId);
        result.put("message", "YouTube video sync cycle completed");
        return result;
    }

    public synchronized void syncVideos() {
        if (apiKey == null || apiKey.isBlank() || channelId == null || channelId.isBlank()) {
            log.warn("YouTube API Key or Channel ID is missing. Skipping live YouTube API sync.");
            seedDefaultVideosIfEmpty();
            return;
        }

        try {
            String url = String.format(
                    "https://www.googleapis.com/youtube/v3/search?key=%s&channelId=%s&part=snippet&type=video&order=date&maxResults=15",
                    apiKey, channelId);

            log.info("Fetching live videos from YouTube API for channel: {}", channelId);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null || !response.containsKey("items")) {
                log.warn("Empty response or items not found in YouTube API response");
                seedDefaultVideosIfEmpty();
                return;
            }

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
            log.info("YouTube API returned {} items", items.size());

            int newVideos = 0;
            SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
            isoFormat.setTimeZone(TimeZone.getTimeZone("UTC"));

            for (Map<String, Object> item : items) {
                Map<String, Object> idMap = (Map<String, Object>) item.get("id");
                if (idMap == null)
                    continue;
                String videoId = (String) idMap.get("videoId");
                if (videoId == null)
                    continue;

                Map<String, Object> snippet = (Map<String, Object>) item.get("snippet");
                if (snippet == null)
                    continue;
                String title = (String) snippet.get("title");
                String description = (String) snippet.get("description");
                String publishedAtStr = (String) snippet.get("publishedAt");

                Date publishedAt = new Date();
                try {
                    if (publishedAtStr != null) {
                        publishedAt = isoFormat.parse(publishedAtStr);
                    }
                } catch (Exception ex) {
                    log.warn("Failed parsing date: {}", publishedAtStr);
                }

                Map<String, Object> thumbnails = (Map<String, Object>) snippet.get("thumbnails");
                String thumbnailUrl = "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
                if (thumbnails != null) {
                    Map<String, Object> high = (Map<String, Object>) thumbnails.get("high");
                    if (high != null && high.get("url") != null) {
                        thumbnailUrl = (String) high.get("url");
                    } else {
                        Map<String, Object> def = (Map<String, Object>) thumbnails.get("default");
                        if (def != null && def.get("url") != null)
                            thumbnailUrl = (String) def.get("url");
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

            log.info("YouTube sync finished. Processed {} items, inserted {} new videos.", items.size(), newVideos);

        } catch (Exception e) {
            log.error("Failed to sync YouTube videos: {}", e.getMessage());
            seedDefaultVideosIfEmpty();
        }
    }
}
