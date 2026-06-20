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
import java.util.List;
import java.util.stream.Collectors;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;


@Service
public class S3Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name:${aws.s3.bucket.name:bodhganga-pdf-storage-prod}}")
    private String bucketName;

    @Value("${aws.region:eu-north-1}")
    private String awsRegion;

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

    /**
     * Upload a file with an explicit S3 key.
     */
    public String uploadFileWithKey(java.io.InputStream inputStream, long size, String s3Key, String contentType) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(contentType)
                .build();

        try {
            if (size <= 0) {
                // For Google Workspace exports, size is unknown (0). We must read the stream into memory.
                byte[] bytes = inputStream.readAllBytes();
                s3Client.putObject(putObjectRequest, software.amazon.awssdk.core.sync.RequestBody.fromBytes(bytes));
            } else {
                s3Client.putObject(putObjectRequest, software.amazon.awssdk.core.sync.RequestBody.fromInputStream(inputStream, size));
            }
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to read input stream for S3 upload", e);
        }

        return s3Key;
    }

    /**
     * Get S3 URL for a given key.
     */
    public String getS3Url(String s3Key) {
        return "https://" + bucketName + ".s3." + awsRegion + ".amazonaws.com/" + s3Key;
    }

    public String getBucketName() {
        return bucketName;
    }

    /**
     * List ALL object keys in the S3 bucket using full pagination.
     * AWS returns max 1,000 objects per page — this loops through all pages.
     */
    public List<String> listObjects() {
        List<String> allKeys = new java.util.ArrayList<>();
        String continuationToken = null;
        int pageCount = 0;

        do {
            ListObjectsV2Request.Builder builder = ListObjectsV2Request.builder().bucket(bucketName).maxKeys(1000);
            if (continuationToken != null) {
                builder.continuationToken(continuationToken);
            }
            ListObjectsV2Response response = s3Client.listObjectsV2(builder.build());
            pageCount++;

            response.contents().stream().map(S3Object::key).forEach(allKeys::add);

            continuationToken = response.isTruncated() ? response.nextContinuationToken() : null;

        } while (continuationToken != null);

        return allKeys;
    }

    /**
     * Check if a specific object key exists in S3 (avoids loading full list).
     */
    public boolean objectExists(String s3Key) {
        try {
            s3Client.headObject(software.amazon.awssdk.services.s3.model.HeadObjectRequest.builder()
                    .bucket(bucketName).key(s3Key).build());
            return true;
        } catch (software.amazon.awssdk.services.s3.model.NoSuchKeyException e) {
            return false;
        }
    }
}
