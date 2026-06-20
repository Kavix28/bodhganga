package com.bodhganga.bodhganga.services;

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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class GoogleDriveSyncService {

    private static final Logger log = LoggerFactory.getLogger(GoogleDriveSyncService.class);

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE);

    // Max results per page — 1000 is the API hard limit
    private static final int PAGE_SIZE = 1000;

    @Value("${google.drive.credentials.path:#{null}}")
    private String credentialsFilePath;

    private Drive driveService;

    @PostConstruct
    public void init() {
        if (credentialsFilePath == null || credentialsFilePath.isEmpty() || credentialsFilePath.equals("null")) {
            log.warn("Google Drive credentials path is not set. Google Drive integration will be disabled.");
            return;
        }

        try {
            final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();

            InputStream credentialsStream;
            if (credentialsFilePath.startsWith("classpath:")) {
                String resourcePath = credentialsFilePath.substring("classpath:".length());
                credentialsStream = getClass().getClassLoader().getResourceAsStream(resourcePath);
                if (credentialsStream == null) {
                    throw new IOException(resourcePath + " not found in classpath");
                }
            } else {
                credentialsStream = new FileInputStream(credentialsFilePath);
            }

            GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream)
                    .createScoped(SCOPES);
            HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(credentials);

            driveService = new Drive.Builder(HTTP_TRANSPORT, JSON_FACTORY, requestInitializer)
                    .setApplicationName("BodhGanga Academy")
                    .build();
            log.info("Google Drive API Service initialized successfully.");
        } catch (IOException | GeneralSecurityException e) {
            log.error("Failed to initialize Google Drive API Service", e);
        }
    }

    public boolean isConfigured() {
        return driveService != null;
    }

    /**
     * Lists ALL files and subfolders directly inside the given Drive folder.
     *
     * <p>Fixes applied vs original:
     * <ol>
     *   <li>{@code supportsAllDrives(true)} — required to access Shared / Team Drive items.</li>
     *   <li>{@code includeItemsFromAllDrives(true)} — required companion flag; without it,
     *       Shared Drive contents are silently excluded even when the folder is accessible.</li>
     *   <li>Full pagination via {@code nextPageToken} — the original code fetched only the first
     *       page (≤100 items by default) and discarded the rest; now all pages are consumed.</li>
     *   <li>Page size raised to 1000 (API maximum) to reduce round-trips.</li>
     *   <li>Detailed per-file logging for production observability.</li>
     * </ol>
     *
     * @param folderId the Google Drive folder ID whose direct children should be listed
     * @return all files and sub-folders found, never {@code null}
     */
    public List<File> listFilesInFolder(String folderId) throws IOException {
        if (!isConfigured()) {
            log.warn("[DRIVE] listFilesInFolder called but Drive service is not configured. Returning empty list.");
            return Collections.emptyList();
        }

        List<File> allFiles = new ArrayList<>();
        String query = "'" + folderId + "' in parents and trashed=false";

        log.info("[DRIVE] listFilesInFolder — FolderID={} Query=\"{}\"", folderId, query);

        String pageToken = null;
        int pageNumber = 0;

        do {
            pageNumber++;

            Drive.Files.List request = driveService.files().list()
                    .setQ(query)
                    .setSpaces("drive")
                    .setFields("nextPageToken, files(id, name, mimeType, size, parents)")
                    .setPageSize(PAGE_SIZE)
                    // ─── FIX 1: Support Shared Drives / Team Drives ──────────────
                    // Without supportsAllDrives=true the API returns HTTP 200 with an
                    // empty files[] for any folder that lives inside a Shared Drive,
                    // because the service account's "My Drive" context is assumed.
                    .setSupportsAllDrives(true)
                    // ─── FIX 2: Include items from all drives ─────────────────────
                    // Companion flag — must be true alongside supportsAllDrives.
                    // Omitting it causes the API to silently filter out Shared Drive
                    // items from the result set even when the folder ID is correct.
                    .setIncludeItemsFromAllDrives(true);

            if (pageToken != null) {
                request.setPageToken(pageToken);
            }

            FileList result = request.execute();

            List<File> pageFiles = result.getFiles();
            if (pageFiles != null && !pageFiles.isEmpty()) {
                allFiles.addAll(pageFiles);
                log.info("[DRIVE] Page {} — {} item(s) returned from FolderID={}",
                        pageNumber, pageFiles.size(), folderId);

                // Per-file detail log — critical for production diagnostics
                for (File f : pageFiles) {
                    log.info("[DRIVE] Found item — Name=\"{}\" MimeType=\"{}\" ID=\"{}\" Size={}",
                            f.getName(),
                            f.getMimeType(),
                            f.getId(),
                            f.getSize() != null ? f.getSize() + " bytes" : "N/A (folder)");
                }
            } else {
                log.warn("[DRIVE] Page {} — 0 items returned from FolderID={} (folder may be empty, "
                        + "or service account lacks access, or Shared Drive flags were needed)",
                        pageNumber, folderId);
            }

            // ─── FIX 3: Pagination ────────────────────────────────────────────
            // The original code never consumed nextPageToken. Folders with >100
            // items (default page size) silently lost all items beyond page 1.
            pageToken = result.getNextPageToken();

        } while (pageToken != null);

        log.info("[DRIVE] listFilesInFolder complete — FolderID={} TotalItems={} Pages={}",
                folderId, allFiles.size(), pageNumber);

        return allFiles;
    }

    /**
     * Downloads a file from Google Drive as an InputStream.
     * Automatically exports Google Workspace documents (Docs, Sheets, Slides) to PDF.
     *
     * <p>Requires {@code supportsAllDrives(true)} for regular files.
     */
    public InputStream downloadFile(String fileId, String mimeType) throws IOException {
        if (!isConfigured()) return null;
        log.info("[DRIVE] Downloading file — ID={}, MimeType={}", fileId, mimeType);

        if (mimeType != null && mimeType.startsWith("application/vnd.google-apps.")) {
            if (mimeType.equals("application/vnd.google-apps.document") ||
                mimeType.equals("application/vnd.google-apps.spreadsheet") ||
                mimeType.equals("application/vnd.google-apps.presentation")) {
                log.info("[DRIVE] Exporting Google Workspace document {} to PDF", fileId);
                return driveService.files().export(fileId, "application/pdf").executeMediaAsInputStream();
            } else {
                throw new IOException("Unsupported Google Workspace document type for download: " + mimeType);
            }
        }

        return driveService.files().get(fileId)
                // ─── FIX 4: Support Shared Drives for download ────────────────
                .setSupportsAllDrives(true)
                .executeMediaAsInputStream();
    }

    /**
     * Backward-compatible delegate for downloadFile.
     */
    public InputStream downloadFile(String fileId) throws IOException {
        return downloadFile(fileId, null);
    }

    /**
     * Moves a file to an 'Archived/Processed' folder so it is not processed again.
     *
     * <p>Requires {@code supportsAllDrives(true)} at both the {@code get} (to read current parents)
     * and the {@code update} (to perform the parent swap) steps.
     */
    public void moveFileToArchive(String fileId, String currentFolderId, String archiveFolderId) throws IOException {
        if (!isConfigured()) return;

        log.info("[DRIVE] moveFileToArchive — FileID={} CurrentParent={} ArchiveFolder={}",
                fileId, currentFolderId, archiveFolderId);

        // ─── FIX 5: Support Shared Drives for metadata fetch ──────────────
        File file = driveService.files().get(fileId)
                .setFields("parents")
                .setSupportsAllDrives(true)
                .execute();

        StringBuilder previousParents = new StringBuilder();
        if (file.getParents() != null) {
            for (String parent : file.getParents()) {
                previousParents.append(parent).append(",");
            }
        } else {
            // Fallback: use the known current folder ID
            log.warn("[DRIVE] File {} returned null parents — using currentFolderId as removeParent", fileId);
            previousParents.append(currentFolderId);
        }

        // ─── FIX 6: Support Shared Drives for file move ───────────────────
        driveService.files().update(fileId, null)
                .setAddParents(archiveFolderId)
                .setRemoveParents(previousParents.toString())
                .setFields("id, parents")
                .setSupportsAllDrives(true)
                .execute();

        log.info("[DRIVE] moveFileToArchive SUCCESS — FileID={} moved to ArchiveFolder={}", fileId, archiveFolderId);
    }

    /**
     * Find a folder under parentId or create it if not exists.
     */
    public String findOrCreateFolder(String parentId, String folderName) throws IOException {
        String query = "'" + parentId + "' in parents and name='" + folderName.replace("'", "\\'") + "' and mimeType='application/vnd.google-apps.folder' and trashed=false";
        FileList result = driveService.files().list()
                .setQ(query)
                .setSpaces("drive")
                .setFields("files(id)")
                .setSupportsAllDrives(true)
                .setIncludeItemsFromAllDrives(true)
                .execute();

        List<File> files = result.getFiles();
        if (files != null && !files.isEmpty()) {
            return files.get(0).getId();
        }

        // Create folder
        File folderMetadata = new File();
        folderMetadata.setName(folderName);
        folderMetadata.setMimeType("application/vnd.google-apps.folder");
        folderMetadata.setParents(Collections.singletonList(parentId));

        File folder = driveService.files().create(folderMetadata)
                .setFields("id")
                .setSupportsAllDrives(true)
                .execute();
        return folder.getId();
    }

    /**
     * Move a folder or file by updating parents.
     */
    public void moveFolderOrFile(String itemId, String sourceParentId, String targetParentId) throws IOException {
        driveService.files().update(itemId, null)
                .setAddParents(targetParentId)
                .setRemoveParents(sourceParentId)
                .setSupportsAllDrives(true)
                .execute();
    }

    /**
     * Recursively merge sourceFolder contents into targetFolder and delete sourceFolder.
     */
    public void mergeFolders(String sourceFolderId, String targetFolderId) throws IOException {
        List<File> items = listFilesInFolder(sourceFolderId);
        for (File item : items) {
            String mimeType = item.getMimeType();
            if ("application/vnd.google-apps.folder".equals(mimeType)) {
                String subTargetFolderId = findOrCreateFolder(targetFolderId, item.getName());
                mergeFolders(item.getId(), subTargetFolderId);
            } else {
                moveFolderOrFile(item.getId(), sourceFolderId, targetFolderId);
            }
        }
        driveService.files().delete(sourceFolderId).setSupportsAllDrives(true).execute();
    }

    /**
     * Move or merge a district folder into the archived state folder.
     */
    public String archiveDistrictFolder(String sourceDistrictFolderId, String sourceDistrictFolderName, String sourceStateFolderName, String sourceStateFolderId, String archiveRootFolderId) throws IOException {
        log.info("[DRIVE] Archiving district folder: {} (State: {})", sourceDistrictFolderName, sourceStateFolderName);
        String archivedStateFolderId = findOrCreateFolder(archiveRootFolderId, sourceStateFolderName);

        String query = "'" + archivedStateFolderId + "' in parents and name='" + sourceDistrictFolderName.replace("'", "\\'") + "' and mimeType='application/vnd.google-apps.folder' and trashed=false";
        FileList result = driveService.files().list()
                .setQ(query)
                .setSpaces("drive")
                .setFields("files(id)")
                .setSupportsAllDrives(true)
                .setIncludeItemsFromAllDrives(true)
                .execute();

        List<File> existing = result.getFiles();
        if (existing == null || existing.isEmpty()) {
            moveFolderOrFile(sourceDistrictFolderId, sourceStateFolderId, archivedStateFolderId);
            log.info("[DRIVE] Successfully moved entire district folder {} to archived state folder", sourceDistrictFolderName);
            return sourceDistrictFolderId; // The source ID is now the archived ID
        } else {
            String archivedDistrictFolderId = existing.get(0).getId();
            mergeFolders(sourceDistrictFolderId, archivedDistrictFolderId);
            log.info("[DRIVE] Successfully merged district folder {} into archived district folder", sourceDistrictFolderName);
            return archivedDistrictFolderId;
        }
    }

    /**
     * Upload a JSON manifest file to a specific Drive folder.
     */
    public String uploadManifest(String parentId, String fileName, String jsonContent) throws IOException {
        File fileMetadata = new File();
        fileMetadata.setName(fileName);
        fileMetadata.setParents(Collections.singletonList(parentId));
        fileMetadata.setMimeType("application/json");

        com.google.api.client.http.InputStreamContent mediaContent =
                new com.google.api.client.http.InputStreamContent("application/json",
                        new java.io.ByteArrayInputStream(jsonContent.getBytes(java.nio.charset.StandardCharsets.UTF_8)));

        File file = driveService.files().create(fileMetadata, mediaContent)
                .setFields("id")
                .setSupportsAllDrives(true)
                .execute();
        return file.getId();
    }
}

