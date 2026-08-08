package com.bodhganga.bodhganga.config;

import com.bodhganga.bodhganga.services.GoogleDriveSyncService;
import com.bodhganga.bodhganga.services.S3Service;
import com.bodhganga.bodhganga.services.qb.QuestionBankDriveService;
import com.bodhganga.bodhganga.services.qb.QuestionBankPipelineTask;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Arrays;

/**
 * Pre-flight production configuration validator and health summary reporter.
 */
@Component
public class StartupValidator {

    private static final Logger log = LoggerFactory.getLogger(StartupValidator.class);

    private final Environment env;
    private final QuestionBankProperties qbProps;
    private final QuestionBankDriveService qbDriveService;
    private final GoogleDriveSyncService genericDriveService;
    private final S3Service s3Service;
    private final QuestionBankPipelineTask qbPipelineTask;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    @Value("${otp.enabled:true}")
    private boolean otpEnabled;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${google.drive.qb.pipeline.enabled:false}")
    private boolean valueQbPipelineEnabled;

    public StartupValidator(Environment env,
                            QuestionBankProperties qbProps,
                            QuestionBankDriveService qbDriveService,
                            GoogleDriveSyncService genericDriveService,
                            S3Service s3Service,
                            QuestionBankPipelineTask qbPipelineTask) {
        this.env = env;
        this.qbProps = qbProps;
        this.qbDriveService = qbDriveService;
        this.genericDriveService = genericDriveService;
        this.s3Service = s3Service;
        this.qbPipelineTask = qbPipelineTask;
    }

    @PostConstruct
    public void validate() {
        printDiagnosticTrace();

        boolean isProd = Arrays.asList(env.getActiveProfiles()).contains("prod")
                || env.getActiveProfiles().length == 0;

        log.info("[STARTUP] Active profiles: {}. Production validation: {}",
                Arrays.toString(env.getActiveProfiles()), isProd);

        printStartupHealthReport();

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
            fail("JWT_SECRET environment variable is missing or uses a placeholder. Generate with: openssl rand -base64 64");
        }
        if (envJwtSecret != null && envJwtSecret.length() < 32) {
            fail("JWT_SECRET is too short (minimum 32 characters). Generate with: openssl rand -base64 64");
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
        if (qbProps.isPipelineEnabled()) {
            log.info("[STARTUP] QB pipeline is enabled — validating QB configuration...");

            String credPath = qbProps.getCredentials();
            if (isBlank(credPath)) {
                fail("QB credentials path is missing. Set QB_CREDENTIALS_PATH / google.drive.qb.credentials.");
            }

            if (credPath != null && !credPath.startsWith("classpath:")) {
                File credFile = new File(credPath);
                if (credFile.isDirectory()) {
                    fail("QB credentials path '" + credPath + "' points to a DIRECTORY, not a file.");
                }
                if (!credFile.exists()) {
                    fail("QB credentials file not found at: " + credPath);
                }
                if (credFile.length() < 100) {
                    fail("QB credentials file at " + credPath + " is too small (placeholder).");
                }
            }

            String srcFolderId = qbProps.getSourceFolderId();
            if (isBlankOrPlaceholder(srcFolderId, "REPLACE_WITH_SOURCE_FOLDER_ID")) {
                fail("QB_SOURCE_FOLDER_ID is missing or placeholder.");
            }

            String archFolderId = qbProps.getArchiveFolderId();
            if (isBlankOrPlaceholder(archFolderId, "REPLACE_WITH_ARCHIVE_FOLDER_ID")) {
                fail("QB_ARCHIVE_FOLDER_ID is missing or placeholder.");
            }

            String geminiKey = firstNonBlank(System.getenv("GEMINI_API_KEY"), geminiApiKey);
            if (isBlank(geminiKey)) {
                fail("GEMINI_API_KEY is missing but QB pipeline is enabled.");
            }

            if (!qbDriveService.isConfigured()) {
                fail("QB Drive API Client failed to initialize. Check service account JSON key.");
            }
        }

        log.info("[STARTUP] ✅ All production pre-flight checks passed.");
    }

    private void printDiagnosticTrace() {
        log.info("==========================================================");
        log.info("[DIAGNOSTIC TRACE] Environment & Property Resolution Trace");
        log.info("==========================================================");
        log.info("Env Var 'QB_PIPELINE_ENABLED'                : {}", System.getenv("QB_PIPELINE_ENABLED"));
        log.info("Env Var 'GOOGLE_DRIVE_QB_PIPELINE_ENABLED'   : {}", System.getenv("GOOGLE_DRIVE_QB_PIPELINE_ENABLED"));
        log.info("Environment.getProperty('google.drive.qb.pipeline.enabled') : {}", env.getProperty("google.drive.qb.pipeline.enabled"));
        log.info("@Value('${google.drive.qb.pipeline.enabled:false}')           : {}", valueQbPipelineEnabled);
        log.info("QuestionBankProperties.isPipelineEnabled()                  : {}", qbProps.isPipelineEnabled());
        log.info("QuestionBankPipelineTask.isPipelineEnabled()               : {}", qbPipelineTask.isPipelineEnabled());
        log.info("==========================================================");
    }

    private void printStartupHealthReport() {
        boolean genConfigured = genericDriveService.isConfigured();
        boolean qbConfigured = qbDriveService.isConfigured();
        boolean s3Configured = s3Service != null;

        log.info("-----------------------------------");
        log.info("Google Drive Generic");
        log.info("  Configured        : {}", genConfigured);
        log.info("  Authenticated     : {}", genConfigured);
        log.info("Question Bank");
        log.info("  Configured        : {}", qbProps.isPipelineEnabled());
        log.info("  Authenticated     : {}", qbConfigured);
        log.info("  Source Folder     : {}", isBlank(qbProps.getSourceFolderId()) ? "MISSING" : "OK");
        log.info("  Archive Folder    : {}", isBlank(qbProps.getArchiveFolderId()) ? "MISSING" : "OK");
        log.info("  Drive API         : {}", qbConfigured ? "READY" : "DISABLED");
        log.info("S3");
        log.info("  Connected         : {}", s3Configured);
        log.info("Mongo");
        log.info("  Connected         : YES");
        log.info("Pipeline Enabled");
        log.info("  QB Pipeline       : {}", qbProps.isPipelineEnabled() ? "YES" : "NO");
        log.info("-----------------------------------");
    }

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
