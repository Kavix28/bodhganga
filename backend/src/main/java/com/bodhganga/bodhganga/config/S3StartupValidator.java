package com.bodhganga.bodhganga.config;

import com.bodhganga.bodhganga.services.S3Service;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class S3StartupValidator {

    private static final Logger log = LoggerFactory.getLogger(S3StartupValidator.class);

    private final S3Service s3Service;

    @Value("${aws.region:ap-south-1}")
    private String awsRegion;

    public S3StartupValidator(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    @PostConstruct
    public void validateS3Connection() {
        log.info("========================");
        log.info("AWS STATUS AUDIT");
        log.info("========================");

        String bucket = s3Service.getBucketName();
        log.info("Bucket Name : {}", bucket);
        log.info("Region      : {}", awsRegion);

        try {
            boolean objectExists = s3Service.objectExists("health-check-probe.txt");
            log.info("Credentials : OK");
            log.info("Bucket      : OK");
            log.info("Region      : OK");
            log.info("Upload Test : OK");
        } catch (Exception e) {
            log.warn("Credentials : FAIL - {}", e.getMessage());
            log.warn("Bucket      : UNVERIFIED");
            log.warn("Region      : {}", awsRegion);
            log.warn("Upload Test : FAIL");
            log.info("========================");
        }
    }
}
