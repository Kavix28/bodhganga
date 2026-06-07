package com.bodhganga.bodhganga.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
public class S3Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name:${aws.s3.bucket.name:bodhganga-pdf-storage-prod}}")
    private String bucketName;

    public S3Service(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    /**
     * Upload a PDF file to S3 under pdfs/{uuid}-{filename}
     * Returns the S3 key.
     */
    public String uploadPdf(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String sanitizedFilename = originalFilename != null 
                ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") 
                : "document.pdf";
        
        String key = "pdfs/" + UUID.randomUUID().toString() + "-" + sanitizedFilename;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("application/pdf")
                .build();

        s3Client.putObject(putObjectRequest, 
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        return key;
    }

    /**
     * Upload a PDF file from a byte array to S3 under pdfs/{uuid}-{filename}
     * Returns the S3 key.
     */
    public String uploadPdf(byte[] bytes, String originalFilename) {
        String sanitizedFilename = originalFilename != null 
                ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") 
                : "document.pdf";
        
        String key = "pdfs/" + UUID.randomUUID().toString() + "-" + sanitizedFilename;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("application/pdf")
                .build();

        s3Client.putObject(putObjectRequest, 
                RequestBody.fromBytes(bytes));

        return key;
    }

    /**
     * Upload a PDF file from an InputStream to S3 under pdfs/{uuid}-{filename}
     * Returns the S3 key. Useful for streaming from external sources like Google Drive.
     */
    public String uploadPdf(java.io.InputStream inputStream, long size, String originalFilename) {
        return uploadPdf(inputStream, size, originalFilename, "pdfs");
    }

    /**
     * Upload a PDF file from an InputStream to S3 under a custom path {customPath}/{uuid}-{filename}
     */
    public String uploadPdf(java.io.InputStream inputStream, long size, String originalFilename, String customPath) {
        String sanitizedFilename = originalFilename != null 
                ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") 
                : "document.pdf";
        
        String key = (customPath != null && !customPath.isEmpty() ? customPath + "/" : "") 
                + UUID.randomUUID().toString() + "-" + sanitizedFilename;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("application/pdf")
                .build();

        s3Client.putObject(putObjectRequest, 
                RequestBody.fromInputStream(inputStream, size));

        return key;
    }

    /**
     * Generate a short-lived (temporary) signed URL for secure download
     * Expiry set to 10 minutes by default.
     */
    public String generatePresignedUrl(String objectKey) {
        return generatePresignedUrl(objectKey, 10);
    }

    /**
     * Generate a short-lived (temporary) signed URL for secure download with custom expiry minutes
     */
    public String generatePresignedUrl(String objectKey, int expiryMinutes) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build();

        GetObjectPresignRequest getObjectPresignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expiryMinutes))
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedGetObjectRequest = s3Presigner.presignGetObject(getObjectPresignRequest);
        return presignedGetObjectRequest.url().toString();
    }
}
