package com.bodhganga.bodhganga.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "videos")
public class Video {
    @Id
    private String id;
    
    private String videoId;
    private String title;
    private String thumbnailUrl;
    private String youtubeUrl;
    private Date publishedAt;

    public Video() {}

    public Video(String videoId, String title, String thumbnailUrl, String youtubeUrl, Date publishedAt) {
        this.videoId = videoId;
        this.title = title;
        this.thumbnailUrl = thumbnailUrl;
        this.youtubeUrl = youtubeUrl;
        this.publishedAt = publishedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getVideoId() { return videoId; }
    public void setVideoId(String videoId) { this.videoId = videoId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getYoutubeUrl() { return youtubeUrl; }
    public void setYoutubeUrl(String youtubeUrl) { this.youtubeUrl = youtubeUrl; }

    public Date getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Date publishedAt) { this.publishedAt = publishedAt; }
}
