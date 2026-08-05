package com.bodhganga.bodhganga.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Strongly-typed configuration for the independent Question Bank pipeline.
 *
 * <p>All properties are read from the {@code google.drive.qb.*} namespace and are
 * completely isolated from the existing State-material pipeline configuration.
 *
 * <p>Validation happens at startup via {@link #validateOnStartup()} so that a
 * missing folder-ID or absent credentials file fails fast with a clear log message
 * instead of a cryptic NullPointerException later.
 */
@ConfigurationProperties(prefix = "google.drive.qb")
public class QuestionBankProperties {

    private static final Logger log = LoggerFactory.getLogger(QuestionBankProperties.class);

    // -------------------------------------------------------------------------
    // Properties (bound automatically by Spring Boot)
    // -------------------------------------------------------------------------

    /** Classpath-relative or absolute path to the QB-specific service-account JSON. */
    private String credentials = "classpath:google-qb-credentials.json";

    /** Google Drive folder ID that the QB pipeline will scan for PDFs. */
    private String sourceFolderId = "";

    /** Google Drive folder ID where successfully processed PDFs are moved. */
    private String archiveFolderId = "";

    /** Whether the scheduled QB ingestion is active. Defaults to false (safe). */
    private boolean pipelineEnabled = false;

    /** How often (ms) the scheduled sync fires. Default: 10 minutes. */
    private long syncIntervalMs = 600_000L;

    // -------------------------------------------------------------------------
    // Startup validation
    // -------------------------------------------------------------------------

    @PostConstruct
    public void validateOnStartup() {
        log.info("[QB CONFIG] Question Bank configuration loaded:");
        log.info("[QB CONFIG]   pipeline.enabled   = {}", pipelineEnabled);
        log.info("[QB CONFIG]   credentials        = {}", credentials);
        log.info("[QB CONFIG]   source-folder-id   = {}", maskId(sourceFolderId));
        log.info("[QB CONFIG]   archive-folder-id  = {}", maskId(archiveFolderId));
        log.info("[QB CONFIG]   sync-interval-ms   = {}", syncIntervalMs);

        if (pipelineEnabled) {
            boolean valid = true;

            if (credentials == null || credentials.isBlank()) {
                log.error("[QB CONFIG] MISSING: google.drive.qb.credentials is blank. "
                        + "Set it to 'classpath:google-qb-credentials.json' or an absolute path.");
                valid = false;
            }

            if (sourceFolderId == null || sourceFolderId.isBlank()
                    || sourceFolderId.equalsIgnoreCase("REPLACE_WITH_SOURCE_FOLDER_ID")) {
                log.error("[QB CONFIG] MISSING: google.drive.qb.source-folder-id is not set. "
                        + "Replace 'REPLACE_WITH_SOURCE_FOLDER_ID' with the real Drive folder ID.");
                valid = false;
            }

            if (archiveFolderId == null || archiveFolderId.isBlank()
                    || archiveFolderId.equalsIgnoreCase("REPLACE_WITH_ARCHIVE_FOLDER_ID")) {
                log.warn("[QB CONFIG] WARNING: google.drive.qb.archive-folder-id is not set. "
                        + "Processed PDFs will NOT be archived — they may be re-processed on the next sync.");
            }

            if (!valid) {
                throw new IllegalStateException(
                        "[QB CONFIG] Question Bank pipeline is enabled but critical configuration is missing. "
                        + "See ERROR logs above. Set google.drive.qb.pipeline.enabled=false to suppress at startup.");
            }

            log.info("[QB CONFIG] Validation PASSED — QB pipeline is enabled and ready.");
        } else {
            log.info("[QB CONFIG] Pipeline is disabled (google.drive.qb.pipeline.enabled=false). "
                    + "Scheduled sync will be skipped. Set to true when folder IDs are configured.");
        }
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public String getCredentials()      { return credentials; }
    public void setCredentials(String v) { this.credentials = v; }

    public String getSourceFolderId()       { return sourceFolderId; }
    public void setSourceFolderId(String v) { this.sourceFolderId = v; }

    public String getArchiveFolderId()       { return archiveFolderId; }
    public void setArchiveFolderId(String v) { this.archiveFolderId = v; }

    public boolean isPipelineEnabled()        { return pipelineEnabled; }
    public void setPipelineEnabled(boolean v) { this.pipelineEnabled = v; }

    public long getSyncIntervalMs()       { return syncIntervalMs; }
    public void setSyncIntervalMs(long v) { this.syncIntervalMs = v; }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Masks all but the first 4 chars of a folder ID for safe log output. */
    private static String maskId(String id) {
        if (id == null || id.length() <= 4) return "(not set)";
        return id.substring(0, 4) + "****";
    }
}
