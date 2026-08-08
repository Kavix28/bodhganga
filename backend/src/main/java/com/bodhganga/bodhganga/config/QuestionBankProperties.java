package com.bodhganga.bodhganga.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.File;

/**
 * Unified, strongly-typed configuration for the Question Bank pipeline.
 *
 * <p>All properties read from {@code google.drive.qb.*} namespace.
 * Automatic mapping for environment variables like {@code QB_PIPELINE_ENABLED},
 * {@code QB_CREDENTIALS_PATH}, {@code QB_SOURCE_FOLDER_ID}, {@code QB_ARCHIVE_FOLDER_ID}, etc.
 */
@Configuration
public class QuestionBankProperties {

    @Value("${google.drive.qb.credentials:${QB_CREDENTIALS_PATH:classpath:google-qb-credentials.json}}")
    private String credentials;

    @Value("${google.drive.qb.source-folder-id:${QB_SOURCE_FOLDER_ID:}}")
    private String sourceFolderId;

    @Value("${google.drive.qb.archive-folder-id:${QB_ARCHIVE_FOLDER_ID:}}")
    private String archiveFolderId;

    @Value("${google.drive.qb.pipeline.enabled:${QB_PIPELINE_ENABLED:false}}")
    private boolean pipelineEnabled;

    @Value("${google.drive.qb.sync-interval-ms:${QB_SYNC_INTERVAL_MS:600000}}")
    private long syncIntervalMs;

    public String getCredentials() { return credentials; }
    public void setCredentials(String v) { this.credentials = v; }

    public String getSourceFolderId() { return sourceFolderId; }
    public void setSourceFolderId(String v) { this.sourceFolderId = v; }

    public String getArchiveFolderId() { return archiveFolderId; }
    public void setArchiveFolderId(String v) { this.archiveFolderId = v; }

    public boolean isPipelineEnabled() { return pipelineEnabled; }
    public void setPipelineEnabled(boolean v) { this.pipelineEnabled = v; }

    public long getSyncIntervalMs() { return syncIntervalMs; }
    public void setSyncIntervalMs(long v) { this.syncIntervalMs = v; }
}
