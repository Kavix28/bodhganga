package com.bodhganga.bodhganga.services;

import com.google.api.services.drive.model.File;
import com.bodhganga.bodhganga.entity.Product;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class CloudSourceTraversalService {
    private static final Logger log = LoggerFactory.getLogger(CloudSourceTraversalService.class);

    private final GoogleDriveSyncService googleDriveSyncService;

    public CloudSourceTraversalService(GoogleDriveSyncService googleDriveSyncService) {
        this.googleDriveSyncService = googleDriveSyncService;
    }

    public static class CloudFileMetadata {
        private String sourceFileId;
        private String fileName;
        private String fileType;
        private String stateName;
        private String districtName;
        private String mimeType;
        private Long fileSize;
        private String parentFolderId;

        // Getters and Setters
        public String getSourceFileId() { return sourceFileId; }
        public void setSourceFileId(String sourceFileId) { this.sourceFileId = sourceFileId; }
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        public String getFileType() { return fileType; }
        public void setFileType(String fileType) { this.fileType = fileType; }
        public String getStateName() { return stateName; }
        public void setStateName(String stateName) { this.stateName = stateName; }
        public String getDistrictName() { return districtName; }
        public void setDistrictName(String districtName) { this.districtName = districtName; }
        public String getMimeType() { return mimeType; }
        public void setMimeType(String mimeType) { this.mimeType = mimeType; }
        public Long getFileSize() { return fileSize; }
        public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
        public String getParentFolderId() { return parentFolderId; }
        public void setParentFolderId(String parentFolderId) { this.parentFolderId = parentFolderId; }
    }

    public List<CloudFileMetadata> discoverFiles(String rootFolderId) {
        List<CloudFileMetadata> fileMetadataList = new ArrayList<>();
        if (!googleDriveSyncService.isConfigured() || rootFolderId == null) {
            log.warn("Google Drive Sync Service is not configured or rootFolderId is null.");
            return fileMetadataList;
        }
        
        try {
            traverseAndCollect(rootFolderId, "BodhGanga", new ArrayList<>(), fileMetadataList);
        } catch (Exception e) {
            log.error("Failed to traverse cloud source folders: ", e);
        }
        return fileMetadataList;
    }

    private void traverseAndCollect(String folderId, String folderName, List<String> folderPath, List<CloudFileMetadata> fileMetadataList) {
        try {
            List<File> items = googleDriveSyncService.listFilesInFolder(folderId);
            if (items == null) return;

            for (File item : items) {
                String mimeType = item.getMimeType();
                if ("application/vnd.google-apps.folder".equals(mimeType)) {
                    List<String> nextPath = new ArrayList<>(folderPath);
                    nextPath.add(item.getName());
                    traverseAndCollect(item.getId(), item.getName(), nextPath, fileMetadataList);
                } else {
                    String fileName = item.getName();
                    if (isSupportedFile(fileName)) {
                        CloudFileMetadata metadata = new CloudFileMetadata();
                        metadata.setSourceFileId(item.getId());
                        metadata.setFileName(fileName);
                        metadata.setFileType(Product.getFileExtension(fileName));
                        metadata.setMimeType(mimeType);
                        metadata.setFileSize(item.getSize());
                        metadata.setParentFolderId(folderId);

                        // Extract state and district from folder path
                        FolderInfo folderInfo = extractStateAndDistrict(folderPath, folderName);
                        metadata.setStateName(folderInfo.state);
                        metadata.setDistrictName(folderInfo.district);

                        fileMetadataList.add(metadata);
                    }
                }
            }
        } catch (IOException e) {
            log.error("Error listing files in folder {} (ID: {}): {}", folderName, folderId, e.getMessage());
        }
    }

    public static boolean isSupportedFile(String fileName) {
        if (fileName == null) return false;
        String ext = Product.getFileExtension(fileName).toLowerCase();
        return List.of("pdf", "docx", "xlsx", "pptx", "png", "jpg", "webp", "mp3", "m4a", "wav").contains(ext);
    }

    private FolderInfo extractStateAndDistrict(List<String> folderPath, String currentFolderName) {
        List<String> pathList = new ArrayList<>(folderPath);
        
        List<String> knownStates = List.of(
            "andhra-pradesh", "arunachal-pradesh", "assam", "bihar", "chhattisgarh", "goa", "gujarat", 
            "haryana", "himachal-pradesh", "jharkhand", "karnataka", "kerala", "madhya-pradesh", 
            "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland", 
            "odisha", "punjab", "rajasthan", "sikkim", "tamil-nadu", "telangana", "tripura", 
            "uttar-pradesh", "uttarakhand", "west-bengal", "delhi", "jammu-and-kashmir", 
            "ladakh", "puducherry", "chandigarh", "lakshadweep", "andaman-and-nicobar-islands"
        );

        String state = null;
        int stateIndex = -1;

        // Traverse folders to find the state
        for (int i = 0; i < pathList.size(); i++) {
            String folder = pathList.get(i);
            String slug = Product.generateSlug(folder);
            if (knownStates.contains(slug)) {
                state = folder;
                stateIndex = i;
                break;
            }
        }

        // Fallback to first element if no exact state match
        if (state == null && !pathList.isEmpty()) {
            state = pathList.get(0);
            stateIndex = 0;
        } else if (state == null) {
            state = "general";
            stateIndex = -1;
        }

        String district = "general";
        
        // Find the first unique element after state in nesting path
        for (int i = stateIndex + 1; i < pathList.size(); i++) {
            String current = pathList.get(i);
            if (!current.equalsIgnoreCase(state)) {
                district = current;
                break;
            }
        }
        
        return new FolderInfo(state, district);
    }

    private static class FolderInfo {
        public final String state;
        public final String district;
        public FolderInfo(String state, String district) {
            this.state = state;
            this.district = district;
        }
    }
}
