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
import java.util.Collections;
import java.util.List;

@Service
public class GoogleDriveSyncService {

    private static final Logger log = LoggerFactory.getLogger(GoogleDriveSyncService.class);

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE);

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
     * Lists all files in a specific Google Drive folder.
     */
    public List<File> listFilesInFolder(String folderId) throws IOException {
        if (!isConfigured()) return Collections.emptyList();

        FileList result = driveService.files().list()
                .setQ("'" + folderId + "' in parents and trashed=false")
                .setSpaces("drive")
                .setFields("nextPageToken, files(id, name, mimeType, size, parents)")
                .execute();

        return result.getFiles();
    }

    /**
     * Downloads a file from Google Drive as an InputStream.
     * Automatically exports Google Workspace documents (Docs, Sheets, Slides) to PDF.
     */
    public InputStream downloadFile(String fileId, String mimeType) throws IOException {
        if (!isConfigured()) return null;
        
        if (mimeType != null && mimeType.startsWith("application/vnd.google-apps.")) {
            // Export Google Workspace documents to PDF
            if (mimeType.equals("application/vnd.google-apps.document") || 
                mimeType.equals("application/vnd.google-apps.spreadsheet") ||
                mimeType.equals("application/vnd.google-apps.presentation")) {
                log.info("Exporting Google Workspace document {} to PDF", fileId);
                return driveService.files().export(fileId, "application/pdf").executeMediaAsInputStream();
            } else {
                throw new IOException("Unsupported Google Workspace document type for download: " + mimeType);
            }
        }
        
        // Regular files (PDFs, images, etc)
        return driveService.files().get(fileId).executeMediaAsInputStream();
    }

    /**
     * Moves a file to an 'Archived/Processed' folder so it is not processed again.
     */
    public void moveFileToArchive(String fileId, String currentFolderId, String archiveFolderId) throws IOException {
        if (!isConfigured()) return;
        
        // Retrieve the existing parents to remove
        File file = driveService.files().get(fileId)
                .setFields("parents")
                .execute();
        
        StringBuilder previousParents = new StringBuilder();
        for (String parent : file.getParents()) {
            previousParents.append(parent).append(",");
        }

        // Move the file to the new folder
        driveService.files().update(fileId, null)
                .setAddParents(archiveFolderId)
                .setRemoveParents(previousParents.toString())
                .setFields("id, parents")
                .execute();
    }
}
