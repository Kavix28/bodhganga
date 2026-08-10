package com.bodhganga.bodhganga.util;

import com.bodhganga.bodhganga.entity.Product;

import java.util.ArrayList;
import java.util.List;

public class ProductMetadataUtil {

    public static boolean isFreeFolder(String folderName) {
        if (folderName == null) return false;
        String lower = folderName.trim().toLowerCase();
        return lower.equals("free") || lower.equals("free resources") || lower.equals("free-resources");
    }

    public static boolean isPaidFolder(String folderName) {
        if (folderName == null) return false;
        String lower = folderName.trim().toLowerCase();
        return lower.equals("paid") || lower.equals("paid resources") || lower.equals("paid-resources");
    }

    public static String normalizeName(String name) {
        if (name == null) return "";
        String cleaned = name.replaceAll("(?i)^(State\\s*\\d+\\s*-\\s*|State\\s*-\\s*|State\\s+\\d+\\s+|\\d+\\s*-\\s*|\\d+\\s+)", "").trim();
        cleaned = cleaned.replaceAll("(?i)\\s+District$", "").trim();
        cleaned = cleaned.replaceAll("\\s+", " ").trim();
        return cleaned;
    }

    public static HierarchicalMetadata parseStateImage(List<String> folderPath, String fileName) {
        if (fileName == null || fileName.isBlank()) return null;
        if (folderPath != null && !folderPath.isEmpty()) {
            return null;
        }

        String ext = Product.getFileExtension(fileName).toLowerCase();
        List<String> imageExts = List.of("png", "jpg", "jpeg", "webp", "gif", "svg");
        if (!imageExts.contains(ext)) {
            return null;
        }

        String nameWithoutExt = Product.stripExtension(fileName);
        String cleanedName = nameWithoutExt.replaceAll("(?i)[\\s_\\-]*(image|img|thumbnail|photo|pic|picture)$", "").trim();
        cleanedName = cleanedName.replaceAll("(?i)^(state\\s*\\d+\\s*-\\s*|state\\s*-\\s*|state\\s+\\d+\\s+|\\d+\\s*-\\s*|\\d+\\s+)", "").trim();

        String slug = Product.generateSlug(cleanedName);

        if (DistrictParser.isKnownState(slug)) {
            String state = DistrictParser.getKnownStateName(slug);
            return new HierarchicalMetadata(
                state, slug,
                "Images", "images",
                "state-image", "state-image", null,
                "general", "general", true
            );
        }

        return null;
    }

    /**
     * Generic & Backward-Compatible Folder Metadata Extractor
     */
    public static HierarchicalMetadata extractMetadata(List<String> folderPath, String fileName) {
        HierarchicalMetadata stateImageMeta = parseStateImage(folderPath, fileName);
        if (stateImageMeta != null) {
            return stateImageMeta;
        }

        if (folderPath == null || folderPath.isEmpty()) {
            return new HierarchicalMetadata("General", "general", "General Notes", "general-notes", null, null, null, "general", "general", true);
        }

        List<String> cleanedPath = new ArrayList<>();
        boolean isFree = false;
        boolean hasTierFolder = false;

        for (String folder : folderPath) {
            if (isFreeFolder(folder)) { isFree = true; hasTierFolder = true; continue; }
            if (isPaidFolder(folder)) { isFree = false; hasTierFolder = true; continue; }
            String norm = normalizeName(folder);
            if (!norm.isEmpty()) cleanedPath.add(norm);
        }

        if (cleanedPath.isEmpty()) {
            return new HierarchicalMetadata("General", "general", "General Notes", "general-notes", null, null, null, "general", "general", isFree);
        }

        // Folder 0 is State
        String state = cleanedPath.get(0);
        String stateSlug = Product.generateSlug(state);

        String navbarCategory = "General Notes";
        String district = "general";
        String subcategory = null;
        String subcategorySlug = null;
        String subfolderPath = null;

        if (cleanedPath.size() > 1) {
            String segment1 = cleanedPath.get(1);
            navbarCategory = segment1;

            if (cleanedPath.size() > 2) {
                // If folder 2 is a known district folder pattern or district ingestion
                district = cleanedPath.get(2);

                // Build subcategory path for unlimited nesting
                List<String> subList = cleanedPath.subList(2, cleanedPath.size());
                subcategory = subList.get(0);
                subcategorySlug = Product.generateSlug(subcategory);
                subfolderPath = String.join("/", subList);
            }
        }

        String navbarSlug = Product.generateSlug(navbarCategory);
        String districtSlug = Product.generateSlug(district);

        if (!hasTierFolder) {
            isFree = true;
        }

        return new HierarchicalMetadata(
            state, stateSlug,
            navbarCategory, navbarSlug,
            subcategory, subcategorySlug, subfolderPath,
            district, districtSlug, isFree
        );
    }

    public static class HierarchicalMetadata {
        public final String state;
        public final String stateSlug;
        public final String navbarCategory;
        public final String navbarSlug;
        public final String subcategory;
        public final String subcategorySlug;
        public final String subfolderPath;
        public final String district;
        public final String districtSlug;
        public final boolean isFree;

        public HierarchicalMetadata(String state, String stateSlug,
                                    String navbarCategory, String navbarSlug,
                                    String subcategory, String subcategorySlug, String subfolderPath,
                                    String district, String districtSlug,
                                    boolean isFree) {
            this.state = state;
            this.stateSlug = stateSlug;
            this.navbarCategory = navbarCategory;
            this.navbarSlug = navbarSlug;
            this.subcategory = subcategory;
            this.subcategorySlug = subcategorySlug;
            this.subfolderPath = subfolderPath;
            this.district = district;
            this.districtSlug = districtSlug;
            this.isFree = isFree;
        }

        public String buildS3Key(String fileName) {
            if ("images".equals(navbarSlug) && "state-image".equals(subcategorySlug)) {
                return String.format("states/%s/%s", stateSlug, fileName);
            } else if (district != null && !district.equals("general") && (subcategory == null || subcategory.equals(district))) {
                // Backward compatible district S3 path: state-slug/navbar-slug/district-slug/free|paid/filename.pdf
                return String.format("%s/%s/%s/%s/%s",
                    stateSlug, navbarSlug, districtSlug, (isFree ? "free" : "paid"), fileName);
            } else if (subfolderPath != null && !subfolderPath.isEmpty()) {
                // Generic nested subcategory S3 path: state-slug/navbar-slug/subfolder-slugs/filename.pdf
                String[] segments = subfolderPath.split("/");
                StringBuilder sb = new StringBuilder(stateSlug).append("/").append(navbarSlug);
                for (String seg : segments) {
                    sb.append("/").append(Product.generateSlug(seg));
                }
                sb.append("/").append(fileName);
                return sb.toString();
            } else {
                // Generic category S3 path: state-slug/navbar-slug/filename.pdf
                return String.format("%s/%s/%s", stateSlug, navbarSlug, fileName);
            }
        }
    }
}
