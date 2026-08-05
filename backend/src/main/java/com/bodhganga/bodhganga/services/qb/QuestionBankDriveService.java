package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.config.QuestionBankProperties;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Dedicated Google Drive client for the Question Bank pipeline.
 *
 * <p><strong>Completely independent</strong> of {@code GoogleDriveSyncService} — uses
 * its own service-account credentials ({@code google-qb-credentials.json}), its own
 * Drive application name, and its own scopes. The two clients never share state.
 *
 * <p>Failure modes are handled gracefully:
 * <ul>
 *   <li>Missing credentials file → logged, service marked unconfigured, pipeline skips.</li>
 *   <li>Drive permission denied → caught per-call, surfaced as a clear error in the audit log.</li>
 *   <li>Source / archive folder missing → validated by {@link QuestionBankProperties} at startup.</li>
 * </ul>
 */
@Service
public class QuestionBankDriveService {

    private static final Logger log = LoggerFactory.getLogger(QuestionBankDriveService.class);

    private static final JsonFactory JSON_FACTORY  = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES       = Collections.singletonList(DriveScopes.DRIVE);
    private static final int          PAGE_SIZE    = 1000;
    private static final String       APP_NAME     = "BodhGanga-QuestionBank";

    private final QuestionBankProperties props;

    /** Initialized in {@link #init()}; {@code null} means the service is unconfigured. */
    private Drive drive;

    public QuestionBankDriveService(QuestionBankProperties props) {
        this.props = props;
    }

    // -------------------------------------------------------------------------
    // Initialization
    // -------------------------------------------------------------------------

    @PostConstruct
    public void init() {
        String credPath = props.getCredentials();

        if (credPath == null || credPath.isBlank()) {
            log.warn("[QB DRIVE] google.drive.qb.credentials is blank — QB Drive client will be DISABLED.");
            return;
        }

        try {
            InputStream credStream = resolveCredentialsStream(credPath);
            if (credStream == null) {
                log.error("[QB DRIVE] Credentials file not found: '{}'. "
                        + "Place google-qb-credentials.json in src/main/resources/ "
                        + "and set google.drive.qb.credentials=classpath:google-qb-credentials.json", credPath);
                return;
            }

            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(credStream)
                    .createScoped(SCOPES);
            HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(credentials);

            NetHttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();
            drive = new Drive.Builder(transport, JSON_FACTORY, requestInitializer)
                    .setApplicationName(APP_NAME)
                    .build();

            log.info("[QB DRIVE] Drive client initialized successfully using credentials: {}", credPath);

        } catch (IOException e) {
            log.error("[QB DRIVE] Failed to load QB credentials from '{}': {}", credPath, e.getMessage(), e);
            log.error("[QB DRIVE] QB Drive client is DISABLED. Fix the credentials and restart.");
        } catch (GeneralSecurityException e) {
            log.error("[QB DRIVE] TLS/Security error initializing QB Drive client: {}", e.getMessage(), e);
        }
    }

    /** Resolves a {@code classpath:} or filesystem path to an {@link InputStream}. */
    private InputStream resolveCredentialsStream(String path) throws IOException {
        if (path.startsWith("classpath:")) {
            String resource = path.substring("classpath:".length());
            InputStream stream = getClass().getClassLoader().getResourceAsStream(resource);
            if (stream == null) {
                log.error("[QB DRIVE] '{}' not found on classpath. Ensure the file exists in "
                        + "src/main/resources/ and is included in the JAR build.", resource);
            }
            return stream;
        }
        // Absolute or relative filesystem path
        java.io.File file = new java.io.File(path);
        if (!file.exists()) {
            log.error("[QB DRIVE] Credentials file does not exist at filesystem path: {}", path);
            return null;
        }
        return new FileInputStream(file);
    }

    // -------------------------------------------------------------------------
    // Status
    // -------------------------------------------------------------------------

    /** Returns {@code true} only when the Drive client was successfully initialized. */
    public boolean isConfigured() {
        return drive != null;
    }

    // -------------------------------------------------------------------------
    // Drive operations
    // -------------------------------------------------------------------------

    /**
     * Lists all direct children (files + folders) of the given Drive folder.
     * Handles pagination to return every item even in large folders (> 1000 items).
     *
     * @param folderId the Drive folder ID to list
     * @return all children; never {@code null}
     * @throws IOException              if the Drive API call fails
     * @throws IllegalStateException    if the QB Drive client is not configured
     */
    public List<File> listFilesInFolder(String folderId) throws IOException {
        requireConfigured("listFilesInFolder");

        List<File> allFiles  = new ArrayList<>();
        String     pageToken = null;
        int        page      = 0;

        String query = "'" + folderId + "' in parents and trashed=false";
        log.debug("[QB DRIVE] listFilesInFolder — folderID={}", folderId);

        do {
            page++;
            Drive.Files.List req = drive.files().list()
                    .setQ(query)
                    .setSpaces("drive")
                    .setFields("nextPageToken, files(id, name, mimeType, size, parents)")
                    .setPageSize(PAGE_SIZE)
                    .setSupportsAllDrives(true)
                    .setIncludeItemsFromAllDrives(true);

            if (pageToken != null) req.setPageToken(pageToken);

            FileList result    = req.execute();
            List<File> fetched = result.getFiles();

            if (fetched != null && !fetched.isEmpty()) {
                allFiles.addAll(fetched);
                log.debug("[QB DRIVE] Page {} — {} item(s) from folderID={}", page, fetched.size(), folderId);
                for (File f : fetched) {
                    log.debug("[QB DRIVE]   name='{}' mimeType='{}' id='{}'",
                            f.getName(), f.getMimeType(), f.getId());
                }
            } else {
                log.warn("[QB DRIVE] Page {} — 0 items returned from folderID={}. "
                        + "Folder may be empty or the service account lacks access.", page, folderId);
            }

            pageToken = result.getNextPageToken();
        } while (pageToken != null);

        log.info("[QB DRIVE] listFilesInFolder complete — folderID={} totalItems={} pages={}",
                folderId, allFiles.size(), page);
        return allFiles;
    }

    /**
     * Downloads a file from Drive as an {@link InputStream}.
     * Google Workspace documents (Docs, Sheets, Slides) are exported to PDF automatically.
     *
     * @param fileId   Drive file ID
     * @param mimeType MIME type of the file; may be {@code null}
     * @return an open {@link InputStream} for the file content — caller must close it
     * @throws IOException           if the download fails
     * @throws IllegalStateException if the QB Drive client is not configured
     */
    public InputStream downloadFile(String fileId, String mimeType) throws IOException {
        requireConfigured("downloadFile");
        log.info("[QB DRIVE] Downloading file — id={} mimeType={}", fileId, mimeType);

        if (mimeType != null && mimeType.startsWith("application/vnd.google-apps.")) {
            if (mimeType.equals("application/vnd.google-apps.document")
                    || mimeType.equals("application/vnd.google-apps.spreadsheet")
                    || mimeType.equals("application/vnd.google-apps.presentation")) {
                log.info("[QB DRIVE] Exporting Google Workspace document {} as PDF", fileId);
                return drive.files().export(fileId, "application/pdf").executeMediaAsInputStream();
            }
            throw new IOException("Unsupported Google Workspace type for QB download: " + mimeType);
        }

        return drive.files().get(fileId)
                .setSupportsAllDrives(true)
                .executeMediaAsInputStream();
    }

    /**
     * Moves a file to the archive folder.
     * Uses the Drive API to read the file's current parents, then swaps them for the archive folder.
     *
     * @param fileId          the file to move
     * @param archiveFolderId the destination archive folder ID
     * @throws IOException           if the Drive API call fails
     * @throws IllegalStateException if the QB Drive client is not configured
     */
    public void moveToArchive(String fileId, String archiveFolderId) throws IOException {
        requireConfigured("moveToArchive");

        if (archiveFolderId == null || archiveFolderId.isBlank()) {
            log.warn("[QB DRIVE] moveToArchive called with blank archiveFolderId — skipping move for file {}", fileId);
            return;
        }

        log.info("[QB DRIVE] moveToArchive — fileID={} → archiveFolder={}", fileId, archiveFolderId);

        File meta = drive.files().get(fileId)
                .setFields("parents")
                .setSupportsAllDrives(true)
                .execute();

        StringBuilder previousParents = new StringBuilder();
        if (meta.getParents() != null) {
            for (String p : meta.getParents()) previousParents.append(p).append(",");
        } else {
            log.warn("[QB DRIVE] File {} returned null parents — cannot remove from original folder cleanly.", fileId);
        }

        drive.files().update(fileId, null)
                .setAddParents(archiveFolderId)
                .setRemoveParents(previousParents.toString())
                .setFields("id, parents")
                .setSupportsAllDrives(true)
                .execute();

        log.info("[QB DRIVE] moveToArchive SUCCESS — fileID={} is now in archiveFolder={}", fileId, archiveFolderId);
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private void requireConfigured(String operation) {
        if (!isConfigured()) {
            String msg = "[QB DRIVE] Drive client is not configured. Cannot execute '" + operation + "'. "
                    + "Check google.drive.qb.credentials and the startup logs for initialization errors.";
            log.error(msg);
            throw new IllegalStateException(msg);
        }
    }
}
