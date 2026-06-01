package com.bodhganga.bodhganga.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "products")
public class Product {
    @Id
    private String id;
    
    private String title;
    private String description;
    private String stateSlug; // To associate with a specific state
    private String type; // "PDF", "AUDIO", "VIDEO"
    
    private Double price;
    private String previewUrl; // Thumbnail or sample audio
    private String storageKey; // AWS S3 Object Key for secure download
    
    private boolean isPublished;
    private Date createdAt;

    // Fields for PDF import from Google Drive
    private String category;
    private String courseId;
    private String fileName;
    private Long fileSize;
    private String s3Key;
    private String driveUrl;
    private Boolean importedFromDrive;
    
    public Product() {
        this.createdAt = new Date();
        this.isPublished = false;
        this.importedFromDrive = false;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStateSlug() { return stateSlug; }
    public void setStateSlug(String stateSlug) { this.stateSlug = stateSlug; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public String getPreviewUrl() { return previewUrl; }
    public void setPreviewUrl(String previewUrl) { this.previewUrl = previewUrl; }
    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }
    public boolean isPublished() { return isPublished; }
    public void setPublished(boolean published) { isPublished = published; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }
    public String getDriveUrl() { return driveUrl; }
    public void setDriveUrl(String driveUrl) { this.driveUrl = driveUrl; }
    public Boolean getImportedFromDrive() { return importedFromDrive; }
    public void setImportedFromDrive(Boolean importedFromDrive) { this.importedFromDrive = importedFromDrive; }
}
