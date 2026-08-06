package com.bodhganga.bodhganga.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * S3 client configuration.
 *
 * <p>Credential resolution order (first non-blank wins):
 * <ol>
 *   <li>Spring properties {@code aws.access.key.id} / {@code aws.secret.access.key}
 *       (set via env vars AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY or application-local.properties)
 *   <li>AWS SDK {@link DefaultCredentialsProvider} chain (env vars, ~/.aws/credentials, IMDS, etc.)
 * </ol>
 *
 * <p>This allows the application to work identically in local dev (explicit keys from .env)
 * and in production on AWS (IAM Instance Profile / ECS Task Role via DefaultCredentialsProvider).
 */
@Configuration
public class S3Config {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(S3Config.class);

    @Value("${aws.region:ap-south-1}")
    private String awsRegion;

    @Value("${aws.access.key.id:}")
    private String accessKeyId;

    @Value("${aws.secret.access.key:}")
    private String secretAccessKey;

    @Value("${aws.s3.bucket-name:${aws.s3.bucket.name:bodhganga-prod}}")
    private String bucketName;

    private AwsCredentialsProvider credentialsProvider() {
        if (accessKeyId != null && !accessKeyId.isBlank()
                && secretAccessKey != null && !secretAccessKey.isBlank()) {
            String maskedKey = accessKeyId.length() > 6
                    ? accessKeyId.substring(0, 4) + "..." + accessKeyId.substring(accessKeyId.length() - 2)
                    : "***";
            log.info("[S3 ARCHITECTURE] Using StaticCredentialsProvider - Region: {}, Bucket: {}, AccessKey: {}", awsRegion, bucketName, maskedKey);
            return StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKeyId, secretAccessKey));
        }
        log.info("[S3 ARCHITECTURE] Using DefaultCredentialsProvider - Region: {}, Bucket: {}", awsRegion, bucketName);
        return DefaultCredentialsProvider.create();
    }

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(credentialsProvider())
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(credentialsProvider())
                .build();
    }
}
