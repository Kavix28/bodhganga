package com.bodhganga.bodhganga.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

/**
 * Reusable Factory for Google Drive API instances across all pipelines.
 */
@Configuration
public class DriveConfig {

    private static final Logger log = LoggerFactory.getLogger(DriveConfig.class);
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE);

    public static Drive createDriveClient(String credentialsPath, String appName) throws IOException, GeneralSecurityException {
        if (credentialsPath == null || credentialsPath.isBlank()) {
            throw new IllegalArgumentException("Credentials path is blank.");
        }

        InputStream credStream;
        if (credentialsPath.startsWith("classpath:")) {
            String resourcePath = credentialsPath.substring("classpath:".length());
            credStream = DriveConfig.class.getClassLoader().getResourceAsStream(resourcePath);
            if (credStream == null) {
                throw new IOException("Resource '" + resourcePath + "' not found in classpath.");
            }
        } else {
            File f = new File(credentialsPath);
            if (f.isDirectory()) {
                throw new IOException("Credentials path '" + credentialsPath + "' points to a DIRECTORY, not a file.");
            }
            if (!f.exists()) {
                throw new IOException("Credentials file does not exist at '" + credentialsPath + "'.");
            }
            credStream = new FileInputStream(f);
        }

        GoogleCredentials credentials = GoogleCredentials.fromStream(credStream).createScoped(SCOPES);
        HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(credentials);
        NetHttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();

        return new Drive.Builder(transport, JSON_FACTORY, requestInitializer)
                .setApplicationName(appName)
                .build();
    }
}
