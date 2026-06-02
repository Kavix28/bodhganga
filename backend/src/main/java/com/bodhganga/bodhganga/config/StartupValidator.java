package com.bodhganga.bodhganga.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class StartupValidator {

    private static final Logger log = LoggerFactory.getLogger(StartupValidator.class);

    private final Environment env;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    @Value("${otp.enabled:true}")
    private boolean otpEnabled;

    public StartupValidator(Environment env) {
        this.env = env;
    }

    @PostConstruct
    public void validate() {
        // Validate configuration only if the active profile includes "prod" or if no active profile is set (defaults to prod)
        boolean isProd = Arrays.asList(env.getActiveProfiles()).contains("prod") || 
                         env.getActiveProfiles().length == 0;

        log.info("Checking production validation status. Active profiles: {}. Production mode validation check: {}", 
                 Arrays.toString(env.getActiveProfiles()), isProd);

        if (isProd) {
            log.info("Starting pre-production startup validation check...");

            // 1. Validate JWT_SECRET
            String envJwtSecret = System.getenv("JWT_SECRET");
            
            // Check if missing entirely
            if (envJwtSecret == null || envJwtSecret.isBlank()) {
                log.error("CRITICAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing or blank!");
                throw new IllegalStateException("Production startup failed: JWT_SECRET environment variable must be set.");
            }

            // Check if placeholder strong secret is used
            if ("REPLACE_WITH_STRONG_SECRET_MIN_64_CHARS".equals(envJwtSecret)) {
                log.error("CRITICAL CONFIGURATION ERROR: JWT_SECRET cannot be the template placeholder REPLACE_WITH_STRONG_SECRET_MIN_64_CHARS!");
                throw new IllegalStateException("Production startup failed: JWT_SECRET cannot use the placeholder template value.");
            }

            // Check if dev fallback is being used
            String devFallback = "dev-only-fallback-secret-key-minimum-64-characters-long-replace-in-production";
            if (devFallback.equals(envJwtSecret) || devFallback.equals(jwtSecret)) {
                log.error("CRITICAL CONFIGURATION ERROR: The development fallback JWT secret is still in use!");
                throw new IllegalStateException("Production startup failed: JWT secret cannot use the dev-only fallback value.");
            }

            // 2. Validate Razorpay credentials
            String envRazorpayKeyId = System.getenv("RAZORPAY_KEY_ID");
            if (envRazorpayKeyId == null || envRazorpayKeyId.isBlank()) {
                if (razorpayKeyId == null || razorpayKeyId.isBlank()) {
                    log.error("CRITICAL CONFIGURATION ERROR: RAZORPAY_KEY_ID is missing or blank!");
                    throw new IllegalStateException("Production startup failed: RAZORPAY_KEY_ID must be configured.");
                }
            }

            String envRazorpayKeySecret = System.getenv("RAZORPAY_KEY_SECRET");
            if (envRazorpayKeySecret == null || envRazorpayKeySecret.isBlank()) {
                if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
                    log.error("CRITICAL CONFIGURATION ERROR: RAZORPAY_KEY_SECRET is missing or blank!");
                    throw new IllegalStateException("Production startup failed: RAZORPAY_KEY_SECRET must be configured.");
                }
            }

            // 3. Validate MSG91
            String envMsg91AuthKey = System.getenv("MSG91_AUTH_KEY");
            if (otpEnabled) {
                if (envMsg91AuthKey == null || envMsg91AuthKey.isBlank()) {
                    log.error("CRITICAL CONFIGURATION ERROR: OTP feature is enabled, but MSG91_AUTH_KEY environment variable is missing or blank!");
                    throw new IllegalStateException("Production startup failed: MSG91_AUTH_KEY must be set since OTP feature is enabled.");
                }
            } else {
                if (envMsg91AuthKey == null || envMsg91AuthKey.isBlank()) {
                    log.warn("WARNING: MSG91_AUTH_KEY is missing or blank, but OTP feature is disabled. Proceeding with startup.");
                }
            }

            log.info("Production configuration validation checks passed successfully.");
        } else {
            log.info("Development mode active: strict production environment validation skipped.");
        }
    }
}
