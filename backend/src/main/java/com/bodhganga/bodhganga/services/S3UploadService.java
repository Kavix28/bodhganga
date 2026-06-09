package com.bodhganga.bodhganga.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.InputStream;
import java.io.IOException;

@Service
public class S3UploadService {
    private static final Logger log = LoggerFactory.getLogger(S3UploadService.class);

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name:${aws.s3.bucket.name:bodhganga-pdf-storage-prod}}")
    private String bucketName;

    @Value("${aws.region:eu-north-1}")
    private String awsRegion;

    public S3UploadService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    /**
     * Upload a file to S3 under {s3KeyPrefix}/{fileName} with retries on transient errors.
     */
    public String uploadToS3(InputStream inputStream, String fileName, String contentType, String s3KeyPrefix) {
        String s3Key = (s3KeyPrefix != null && !s3KeyPrefix.isEmpty()) ? s3KeyPrefix + "/" + fileName : fileName;
        
        int attempts = 0;
        Exception lastException = null;

        byte[] bytes;
        try {
            // Read input stream into memory for reliable re-reading on retries
            bytes = inputStream.readAllBytes();
        } catch (IOException e) {
            log.error("Failed to read input stream for file {}", fileName, e);
            throw new RuntimeException("Failed to read input stream for file " + fileName, e);
        }

        while (attempts < 3) {
            attempts++;
            log.info("Uploading file {} to S3 key {}, attempt {}/3", fileName, s3Key, attempts);
            
            try {
                PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(s3Key)
                        .contentType(contentType)
                        .build();

                s3Client.putObject(putObjectRequest, RequestBody.fromBytes(bytes));
                log.info("Successfully uploaded file {} to S3 with key {}", fileName, s3Key);
                return s3Key;
            } catch (Exception e) {
                lastException = e;
                log.warn("S3 upload attempt {} failed for file {}: {}", attempts, fileName, e.getMessage());
                if (attempts < 3) {
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Upload retry interrupted", ie);
                    }
                }
            }
        }
        log.error("Failed to upload file {} to S3 after 3 attempts.", fileName, lastException);
        throw new RuntimeException("S3 upload failed after 3 attempts", lastException);
    }

    /**
     * Helper to resolve the correct MIME type based on the file name extension.
     */
    public String resolveContentType(String fileName) {
        if (fileName == null) return "application/octet-stream";
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
                case "zip": return "application/zip";
                case "txt": return "text/plain";
            }
        }
        return "application/octet-stream";
    }

    /**
     * Get S3 URL for a given key.
     */
    public String getS3Url(String s3Key) {
        return "https://" + bucketName + ".s3." + awsRegion + ".amazonaws.com/" + s3Key;
    }
}
