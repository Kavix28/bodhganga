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
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.model.CORSRule;
import software.amazon.awssdk.services.s3.model.CORSConfiguration;
import software.amazon.awssdk.services.s3.model.PutBucketCorsRequest;
import software.amazon.awssdk.services.s3.model.GetBucketCorsRequest;
import software.amazon.awssdk.services.s3.model.GetBucketCorsResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class S3Service {

    private static final Logger log = LoggerFactory.getLogger(S3Service.class);

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
     * Returns the S3 key. Useful for streaming from external sources like Google
     * Drive.
     */
    public String uploadPdf(java.io.InputStream inputStream, long size, String originalFilename) {
        return uploadPdf(inputStream, size, originalFilename, "pdfs");
    }

    /**
     * Upload a PDF file from an InputStream to S3 under a custom path
     * {customPath}/{uuid}-{filename}
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
     * Generate a short-lived (temporary) signed URL for secure download with custom
     * expiry minutes
     */
    public String generatePresignedUrl(String objectKey, int expiryMinutes) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .responseContentDisposition("inline")
                .build();

        GetObjectPresignRequest getObjectPresignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expiryMinutes))
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedGetObjectRequest = s3Presigner.presignGetObject(getObjectPresignRequest);
        return presignedGetObjectRequest.url().toString();
    }

    /**
     * Check if an object exists in S3 bucket.
     */
    public boolean doesObjectExist(String objectKey) {
        try {
            s3Client.headObject(software.amazon.awssdk.services.s3.model.HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .build());
            return true;
        } catch (software.amazon.awssdk.services.s3.model.NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.warn("S3 headObject check failed for key {}: {}", objectKey, e.getMessage());
            return true;
        }
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
                // For Google Workspace exports, size is unknown (0). We must read the stream
                // into memory.
                byte[] bytes = inputStream.readAllBytes();
                s3Client.putObject(putObjectRequest, software.amazon.awssdk.core.sync.RequestBody.fromBytes(bytes));
            } else {
                s3Client.putObject(putObjectRequest,
                        software.amazon.awssdk.core.sync.RequestBody.fromInputStream(inputStream, size));
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

    /**
     * Get current CORS rules for S3 bucket.
     */
    public List<CORSRule> getBucketCors() {
        try {
            GetBucketCorsResponse response = s3Client.getBucketCors(
                    GetBucketCorsRequest.builder().bucket(bucketName).build());
            return response.corsRules();
        } catch (S3Exception e) {
            if (e.statusCode() == 404 || (e.awsErrorDetails() != null
                    && "NoSuchCORSConfiguration".equalsIgnoreCase(e.awsErrorDetails().errorCode()))) {
                log.info("No CORS configuration currently set on S3 bucket: {}", bucketName);
                return List.of();
            }
            log.error("AWS S3 error while retrieving CORS configuration for {}: {} (Status Code: {}, Error Code: {})",
                    bucketName, e.getMessage(), e.statusCode(),
                    e.awsErrorDetails() != null ? e.awsErrorDetails().errorCode() : "N/A", e);
            throw e;
        } catch (Exception e) {
            log.error("Failed to retrieve S3 bucket CORS configuration for {}: {}", bucketName, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Configure CORS on S3 bucket for production frontend origins.
     */
    public void configureBucketCors(List<String> allowedOrigins) {
        try {
            log.info("Configuring S3 bucket CORS for origins: {} on bucket: {}", allowedOrigins, bucketName);
            CORSRule rule = CORSRule.builder()
                    .allowedOrigins(allowedOrigins)
                    .allowedMethods("GET", "HEAD")
                    .allowedHeaders("*")
                    .exposeHeaders("Content-Length", "Content-Type", "Accept-Ranges", "ETag")
                    .maxAgeSeconds(3000)
                    .build();

            CORSConfiguration configuration = CORSConfiguration.builder()
                    .corsRules(rule)
                    .build();

            PutBucketCorsRequest putCorsRequest = PutBucketCorsRequest.builder()
                    .bucket(bucketName)
                    .corsConfiguration(configuration)
                    .build();

            s3Client.putBucketCors(putCorsRequest);
            log.info("Successfully updated S3 bucket CORS configuration on {}", bucketName);
        } catch (Exception e) {
            log.error("Failed to configure S3 bucket CORS on {}: {}", bucketName, e.getMessage(), e);
        }
    }

    /**
     * Copy an S3 object from sourceKey to destinationKey within the same bucket.
     */
    public void copyObject(String sourceKey, String destinationKey) {
        if (sourceKey == null || destinationKey == null || sourceKey.equals(destinationKey)) {
            return;
        }
        log.info("[S3] Copying object from '{}' to '{}' in bucket '{}'", sourceKey, destinationKey, bucketName);
        software.amazon.awssdk.services.s3.model.CopyObjectRequest copyReq = software.amazon.awssdk.services.s3.model.CopyObjectRequest
                .builder()
                .sourceBucket(bucketName)
                .sourceKey(sourceKey)
                .destinationBucket(bucketName)
                .destinationKey(destinationKey)
                .build();
        s3Client.copyObject(copyReq);
        log.info("[S3] Successfully copied object to '{}'", destinationKey);
    }

    /**
     * Delete an S3 object from the bucket.
     */
    public void deleteObject(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return;
        }
        log.info("[S3] Deleting object '{}' from bucket '{}'", objectKey, bucketName);
        software.amazon.awssdk.services.s3.model.DeleteObjectRequest deleteReq = software.amazon.awssdk.services.s3.model.DeleteObjectRequest
                .builder()
                .bucket(bucketName)
                .key(objectKey)
                .build();
        s3Client.deleteObject(deleteReq);
        log.info("[S3] Successfully deleted object '{}'", objectKey);
    }
}
