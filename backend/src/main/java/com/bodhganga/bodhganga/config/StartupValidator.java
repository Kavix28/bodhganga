package com.bodhganga.bodhganga.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Arrays;

/**
 * Pre-flight production configuration validator.
 *
 * <p>Runs at startup and throws {@link IllegalStateException} if any required
 * secret is missing or is still set to a placeholder. Validation is only
 * enforced when the active Spring profile is {@code prod} (or when no profile
 * is set, which defaults to production).
 *
 * <p><strong>Secrets must NEVER be committed to git.</strong> All values must
 * be supplied at runtime via environment variables or mounted secret files.
 */
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

    @Value("${google.drive.qb.credentials:}")
    private String qbCredentials;

    @Value("${google.drive.qb.pipeline.enabled:false}")
    private boolean qbPipelineEnabled;

    @Value("${google.drive.qb.source-folder-id:}")
    private String qbSourceFolderId;

    @Value("${google.drive.qb.archive-folder-id:}")
    private String qbArchiveFolderId;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    public StartupValidator(Environment env) {
        this.env = env;
    }

    @PostConstruct
    public void validate() {
        boolean isProd = Arrays.asList(env.getActiveProfiles()).contains("prod")
                || env.getActiveProfiles().length == 0;

        log.info("[STARTUP] Active profiles: {}. Production validation: {}",
                Arrays.toString(env.getActiveProfiles()), isProd);

        if (!isProd) {
            log.info("[STARTUP] Development mode — strict production validation skipped.");
            return;
        }

        log.info("[STARTUP] Running production pre-flight checks...");

        // ── 1. JWT Secret ─────────────────────────────────────────────────────
        String envJwtSecret = System.getenv("JWT_SECRET");
        if (isBlankOrPlaceholder(envJwtSecret, "REQUIRED_MINIMUM_64_CHARACTERS_REPLACE_THIS_VALUE",
                "test-only-secret-key-minimum-64-characters-long-replace-in-production-env",
                "dev-only-fallback-secret-key-minimum-64-characters-long-replace-in-production")) {
            fail("JWT_SECRET environment variable is missing or uses a placeholder. " +
                    "Generate with: openssl rand -base64 64");
        }
        if (envJwtSecret != null && envJwtSecret.length() < 32) {
            fail("JWT_SECRET is too short (minimum 32 characters). " +
                    "Generate with: openssl rand -base64 64");
        }

        // ── 2. Razorpay ───────────────────────────────────────────────────────
        if (isBlank(System.getenv("RAZORPAY_KEY_ID")) && isBlank(razorpayKeyId)) {
            fail("RAZORPAY_KEY_ID is missing.");
        }
        if (isBlank(System.getenv("RAZORPAY_KEY_SECRET")) && isBlank(razorpayKeySecret)) {
            fail("RAZORPAY_KEY_SECRET is missing.");
        }

        // ── 3. MSG91 / OTP ───────────────────────────────────────────────────
        if (otpEnabled && isBlank(System.getenv("MSG91_AUTH_KEY"))) {
            fail("OTP is enabled but MSG91_AUTH_KEY is missing.");
        }

        // ── 4. Question Bank Pipeline ─────────────────────────────────────────
        if (qbPipelineEnabled) {
            log.info("[STARTUP] QB pipeline is enabled — validating QB configuration...");

            // 4a. Credentials file
            String resolvedQbCred = firstNonBlank(System.getenv("QB_CREDENTIALS_PATH"), qbCredentials);
            if (isBlank(resolvedQbCred)) {
                fail("QB_CREDENTIALS_PATH / google.drive.qb.credentials is missing. " +
                        "Mount the service account JSON and set QB_CREDENTIALS_PATH.");
            }
            if (resolvedQbCred != null && !resolvedQbCred.startsWith("classpath:")) {
                File credFile = new File(resolvedQbCred);
                if (!credFile.exists()) {
                    fail("QB credentials file not found at: " + resolvedQbCred +
                            ". Ensure the file is mounted at the configured path.");
                }
                if (credFile.length() < 100) {
                    fail("QB credentials file at " + resolvedQbCred +
                            " is too small — it appears to be a placeholder template, not a real key.");
                }
            }

            // 4b. Folder IDs
            String srcFolderId = firstNonBlank(System.getenv("QB_SOURCE_FOLDER_ID"), qbSourceFolderId);
            if (isBlankOrPlaceholder(srcFolderId, "REPLACE_WITH_SOURCE_FOLDER_ID")) {
                fail("QB_SOURCE_FOLDER_ID is missing or still uses the placeholder value. " +
                        "Set QB_SOURCE_FOLDER_ID to your Google Drive source folder ID.");
            }

            String archFolderId = firstNonBlank(System.getenv("QB_ARCHIVE_FOLDER_ID"), qbArchiveFolderId);
            if (isBlankOrPlaceholder(archFolderId, "REPLACE_WITH_ARCHIVE_FOLDER_ID")) {
                fail("QB_ARCHIVE_FOLDER_ID is missing or still uses the placeholder value. " +
                        "Set QB_ARCHIVE_FOLDER_ID to your Google Drive archive folder ID.");
            }

            // 4c. Gemini API key
            String geminiKey = firstNonBlank(System.getenv("GEMINI_API_KEY"), geminiApiKey);
            if (isBlank(geminiKey)) {
                fail("GEMINI_API_KEY is missing but the QB pipeline is enabled. " +
                        "Set GEMINI_API_KEY to your Gemini API key.");
            }
        } else {
            log.info("[STARTUP] QB pipeline is disabled — skipping QB-specific validation.");
        }

        log.info("[STARTUP] ✅ All production pre-flight checks passed.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void fail(String reason) {
        String message = "[STARTUP] ❌ CRITICAL: " + reason;
        log.error(message);
        throw new IllegalStateException("Production startup failed: " + reason);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static boolean isBlankOrPlaceholder(String s, String... placeholders) {
        if (isBlank(s)) return true;
        for (String p : placeholders) {
            if (s.equalsIgnoreCase(p)) return true;
        }
        return false;
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (!isBlank(v)) return v;
        }
        return null;
    }
}
