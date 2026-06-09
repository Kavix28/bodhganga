package com.bodhganga.bodhganga.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

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
    @Indexed(unique = true, sparse = true)
    private String s3Key;
    private String driveUrl;
    private Boolean importedFromDrive;
    
    // Recursive State/District Ingestion Fields
    private String state;
    private String district;
    private String districtSlug;
    private String mimeType;
    private String contentType;
    private String displayTitle;
    private String originalFileName;
    private String s3Url;
    private String source;

    private boolean isFree;

    // Hardened pipeline fields
    private String fileExtension;
    @Indexed(unique = true, sparse = true)
    private String googleDriveFileId;
    private IngestionStatus ingestionStatus;
    private Date updatedAt;
    private boolean archived;
    
    public Product() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.isPublished = false;
        this.importedFromDrive = false;
        this.isFree = false;
        this.archived = false;
    }

    public boolean isFree() { return isFree; }
    public void setFree(boolean free) { isFree = free; }

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

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getDistrictSlug() { return districtSlug; }
    public void setDistrictSlug(String districtSlug) { this.districtSlug = districtSlug; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public String getDisplayTitle() { return displayTitle; }
    public void setDisplayTitle(String displayTitle) { this.displayTitle = displayTitle; }

    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }

    public String getS3Url() { return s3Url; }
    public void setS3Url(String s3Url) { this.s3Url = s3Url; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getFileExtension() { return fileExtension; }
    public void setFileExtension(String fileExtension) { this.fileExtension = fileExtension; }

    public String getGoogleDriveFileId() { return googleDriveFileId; }
    public void setGoogleDriveFileId(String googleDriveFileId) { this.googleDriveFileId = googleDriveFileId; }

    public IngestionStatus getIngestionStatus() { return ingestionStatus; }
    public void setIngestionStatus(IngestionStatus ingestionStatus) { this.ingestionStatus = ingestionStatus; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public static String getFileExtension(String fileName) {
        if (fileName == null) return "";
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0) {
            return fileName.substring(lastDot + 1).toLowerCase();
        }
        return "";
    }

    public static String generateSlug(String name) {
        if (name == null || name.isBlank()) return "general";
        return name.toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }

    public static String stripExtension(String fileName) {
        if (fileName == null) return "";
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0) {
            String ext = fileName.substring(lastDot + 1).toLowerCase();
            if (java.util.List.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "png", "jpg", "jpeg", "webp", "mp3", "m4a", "wav", "ogg", "aac", "flac", "zip", "txt", "mp4", "avi", "mkv", "mov").contains(ext)) {
                return fileName.substring(0, lastDot);
            }
        }
        return fileName;
    }

    public static String determineContentType(String mimeType, String fileName) {
        if (mimeType != null) {
            String mt = mimeType.toLowerCase();
            if (mt.equals("application/pdf")) return "PDF";
            if (mt.equals("application/msword") || mt.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) return "DOCUMENT";
            if (mt.equals("application/vnd.ms-excel") || mt.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) return "SPREADSHEET";
            if (mt.equals("application/vnd.ms-powerpoint") || mt.equals("application/vnd.openxmlformats-officedocument.presentationml.presentation")) return "PRESENTATION";
            if (mt.equals("image/webp")) return "IMAGE";
            if (mt.equals("application/zip") || mt.equals("application/x-zip-compressed")) return "ZIP";
            if (mt.equals("text/plain")) return "TEXT";
            if (mt.startsWith("image/")) return "IMAGE";
            if (mt.startsWith("audio/")) return "AUDIO";
            if (mt.startsWith("video/")) return "VIDEO";
        }
        if (fileName != null) {
            int lastDot = fileName.lastIndexOf('.');
            if (lastDot > 0) {
                String ext = fileName.substring(lastDot + 1).toLowerCase();
                switch (ext) {
                    case "pdf": return "PDF";
                    case "doc": case "docx": return "DOCUMENT";
                    case "xls": case "xlsx": return "SPREADSHEET";
                    case "ppt": case "pptx": return "PRESENTATION";
                    case "png": case "jpg": case "jpeg": case "webp": return "IMAGE";
                    case "mp3": case "m4a": case "wav": case "ogg": case "aac": case "flac": return "AUDIO";
                    case "zip": return "ZIP";
                    case "txt": return "TEXT";
                    case "mp4": case "avi": case "mkv": case "mov": return "VIDEO";
                }
            }
        }
        return "DOCUMENT";
    }

    public static String determineMimeType(String fileName) {
        if (fileName != null) {
            int lastDot = fileName.lastIndexOf('.');
            if (lastDot > 0) {
                String ext = fileName.substring(lastDot + 1).toLowerCase();
                switch (ext) {
                    case "pdf": return "application/pdf";
                    case "doc": return "application/msword";
                    case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    case "xls": return "application/vnd.ms-excel";
                    case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    case "ppt": return "application/vnd.ms-powerpoint";
                    case "pptx": return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
                    case "png": return "image/png";
                    case "jpg": case "jpeg": return "image/jpeg";
                    case "webp": return "image/webp";
                    case "mp3": return "audio/mpeg";
                    case "m4a": return "audio/x-m4a";
                    case "wav": return "audio/wav";
                    case "ogg": return "audio/ogg";
                    case "aac": return "audio/aac";
                    case "flac": return "audio/flac";
                    case "zip": return "application/zip";
                    case "txt": return "text/plain";
                    case "avi": return "video/x-msvideo";
                    case "mkv": return "video/x-matroska";
                    case "mov": return "video/quicktime";
                    case "mp4": return "video/mp4";
                }
            }
        }
        return "application/octet-stream";
    }
}
