package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.config.DriveConfig;
import com.bodhganga.bodhganga.config.QuestionBankProperties;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class QuestionBankDriveService {

    private static final Logger log = LoggerFactory.getLogger(QuestionBankDriveService.class);
    private static final int PAGE_SIZE = 1000;
    private static final String APP_NAME = "BodhGanga-QuestionBank";

    private final QuestionBankProperties props;
    private Drive drive;

    public QuestionBankDriveService(QuestionBankProperties props) {
        this.props = props;
    }

    @PostConstruct
    public void init() {
        String credPath = props.getCredentials();
        if (credPath == null || credPath.isBlank()) {
            log.warn("[QB DRIVE] Credentials path is blank — QB Drive client disabled.");
            return;
        }

        if (!credPath.startsWith("classpath:")) {
            java.io.File credFile = new java.io.File(credPath);
            if (credFile.isDirectory() || !credFile.exists()) {
                log.warn(
                        "[QB DRIVE] Credentials path '{}' does not exist or is a directory — QB Drive client disabled.",
                        credPath);
                return;
            }
        }

        try {
            drive = DriveConfig.createDriveClient(credPath, APP_NAME);
            log.info("[QB DRIVE] Drive client initialized successfully using credentials: {}", credPath);
        } catch (Exception e) {
            log.error("[QB DRIVE] Failed to initialize Drive client: {}", e.getMessage(), e);
        }
    }

    public boolean isConfigured() {
        return drive != null;
    }

    public List<File> listFilesInFolder(String folderId) throws IOException {
        requireConfigured("listFilesInFolder");

        List<File> allFiles = new ArrayList<>();
        String pageToken = null;
        int page = 0;
        String query = "'" + folderId + "' in parents and trashed=false";

        do {
            page++;
            Drive.Files.List req = drive.files().list()
                    .setQ(query)
                    .setSpaces("drive")
                    .setFields("nextPageToken, files(id, name, mimeType, size, parents)")
                    .setPageSize(PAGE_SIZE)
                    .setSupportsAllDrives(true)
                    .setIncludeItemsFromAllDrives(true);

            if (pageToken != null)
                req.setPageToken(pageToken);

            FileList result = req.execute();
            List<File> fetched = result.getFiles();

            if (fetched != null && !fetched.isEmpty()) {
                allFiles.addAll(fetched);
            }
            pageToken = result.getNextPageToken();
        } while (pageToken != null);

        return allFiles;
    }

    public InputStream downloadFile(String fileId, String mimeType) throws IOException {
        requireConfigured("downloadFile");

        if (mimeType != null && mimeType.startsWith("application/vnd.google-apps.")) {
            if (mimeType.equals("application/vnd.google-apps.document")
                    || mimeType.equals("application/vnd.google-apps.spreadsheet")
                    || mimeType.equals("application/vnd.google-apps.presentation")) {
                return drive.files().export(fileId, "application/pdf").executeMediaAsInputStream();
            }
            throw new IOException("Unsupported Google Workspace type for QB download: " + mimeType);
        }

        return drive.files().get(fileId)
                .setSupportsAllDrives(true)
                .executeMediaAsInputStream();
    }

    public void moveToArchive(String fileId, String archiveFolderId) throws IOException {
        requireConfigured("moveToArchive");

        if (archiveFolderId == null || archiveFolderId.isBlank())
            return;

        File meta = drive.files().get(fileId)
                .setFields("parents")
                .setSupportsAllDrives(true)
                .execute();

        StringBuilder previousParents = new StringBuilder();
        if (meta.getParents() != null) {
            for (String p : meta.getParents())
                previousParents.append(p).append(",");
        }

        drive.files().update(fileId, null)
                .setAddParents(archiveFolderId)
                .setRemoveParents(previousParents.toString())
                .setFields("id, parents")
                .setSupportsAllDrives(true)
                .execute();
    }

    private void requireConfigured(String operation) {
        if (!isConfigured()) {
            throw new IllegalStateException(
                    "[QB DRIVE] Drive client not configured. Cannot execute '" + operation + "'.");
        }
    }
}
