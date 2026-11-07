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
        if (channelId == null || channelId.isBlank()) {
            log.warn("YouTube Channel ID is missing. Skipping sync.");
            return;
        }

        if (apiKey != null && !apiKey.isBlank()) {
            try {
                syncViaApi();
                return;
            } catch (Exception e) {
                log.warn("YouTube API v3 sync failed (quota or auth), attempting RSS feed fallback: {}", e.getMessage());
            }
        }

        // Direct zero-quota RSS Atom sync
        syncViaRss(channelId);
    }

    private void syncViaApi() {
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
            if (thumbnailUrl.isBlank()) {
                thumbnailUrl = "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
            }

            String youtubeUrl = "https://www.youtube.com/watch?v=" + videoId;

            saveOrUpdateVideo(videoId, title, thumbnailUrl, youtubeUrl, publishedAt);
            newVideos++;
        }

        log.info("YouTube API sync finished. Processed {} videos.", newVideos);
    }

    private void syncViaRss(String chId) {
        try {
            String rssUrl = chId.startsWith("UC")
                    ? "https://www.youtube.com/feeds/videos.xml?channel_id=" + chId
                    : "https://www.youtube.com/feeds/videos.xml?user=" + chId;

            log.info("Fetching YouTube RSS feed for channel from: {}", rssUrl);
            String xml = restTemplate.getForObject(rssUrl, String.class);
            if (xml == null || xml.isBlank()) return;

            javax.xml.parsers.DocumentBuilderFactory factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            javax.xml.parsers.DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document doc = builder.parse(new org.xml.sax.InputSource(new java.io.StringReader(xml)));

            org.w3c.dom.NodeList entries = doc.getElementsByTagName("entry");
            SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");

            for (int i = 0; i < entries.getLength(); i++) {
                org.w3c.dom.Element entry = (org.w3c.dom.Element) entries.item(i);
                String videoId = getTagValue(entry, "yt:videoId");
                if (videoId == null || videoId.isBlank()) {
                    videoId = getTagValue(entry, "videoId");
                }
                if (videoId == null || videoId.isBlank()) continue;

                String title = getTagValue(entry, "title");
                String publishedStr = getTagValue(entry, "published");
                Date publishedAt = new Date();
                try {
                    if (publishedStr != null) publishedAt = isoFormat.parse(publishedStr);
                } catch (Exception ignored) {}

                String thumbnailUrl = "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
                String youtubeUrl = "https://www.youtube.com/watch?v=" + videoId;

                saveOrUpdateVideo(videoId, title, thumbnailUrl, youtubeUrl, publishedAt);
            }
            log.info("YouTube RSS sync finished. Processed {} entries.", entries.getLength());
        } catch (Exception e) {
            log.warn("YouTube RSS sync failed: {}", e.getMessage());
        }
    }

    private void saveOrUpdateVideo(String videoId, String title, String thumbnailUrl, String youtubeUrl, Date publishedAt) {
        try {
            Optional<Video> existingOpt = videoRepo.findByVideoId(videoId);
            if (existingOpt.isEmpty()) {
                Video video = new Video(videoId, title, thumbnailUrl, youtubeUrl, publishedAt);
                videoRepo.save(video);
            } else {
                Video video = existingOpt.get();
                video.setTitle(title);
                video.setThumbnailUrl(thumbnailUrl);
                video.setYoutubeUrl(youtubeUrl);
                video.setPublishedAt(publishedAt);
                videoRepo.save(video);
            }
        } catch (Exception e) {
            log.error("Failed to save/update video {}: {}", videoId, e.getMessage());
        }
    }

    private String getTagValue(org.w3c.dom.Element parent, String tagName) {
        org.w3c.dom.NodeList list = parent.getElementsByTagName(tagName);
        if (list != null && list.getLength() > 0) {
            org.w3c.dom.Node node = list.item(0);
            if (node != null) {
                return node.getTextContent();
            }
        }
        return null;
    }
}
