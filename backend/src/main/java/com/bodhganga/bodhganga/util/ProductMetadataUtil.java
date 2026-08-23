package com.bodhganga.bodhganga.util;

import com.bodhganga.bodhganga.entity.Product;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ProductMetadataUtil {

    public enum AccessType {
        FREE,
        PAID,
        UNKNOWN
    }

    public enum ItemType {
        RESOURCE,
        STATE_IMAGE,
        NON_RESOURCE
    }

    private static final Set<String> TYPE_FOLDER_SLUGS = Set.of(
            "pdf", "pdfs", "docx", "doc", "xlsx", "xls", "pptx", "ppt",
            "png", "jpg", "jpeg", "webp", "mp3", "m4a", "wav", "audio", "video", "zip", "txt");

    public static boolean isFreeFolder(String folderName) {
        if (folderName == null)
            return false;
        String lower = folderName.trim().toLowerCase();
        return lower.equals("free") || lower.equals("free resources") || lower.equals("free-resources")
                || lower.equals("free materials") || lower.equals("free notes");
    }

    public static boolean isPaidFolder(String folderName) {
        if (folderName == null)
            return false;
        String lower = folderName.trim().toLowerCase();
        return lower.equals("paid") || lower.equals("paid resources") || lower.equals("paid-resources")
                || lower.equals("paid materials") || lower.equals("paid notes");
    }

    public static boolean isStateImagesFolder(String folderName) {
        if (folderName == null)
            return false;
        String lower = folderName.trim().toLowerCase();
        return lower.equals("state images") || lower.equals("state-images")
                || lower.equals("state_images") || lower.equals("state image")
                || lower.equals("images");
    }

    public static String normalizeName(String name) {
        if (name == null)
            return "";
        String cleaned = name
                .replaceAll("(?i)^(State\\s*\\d+\\s*-\\s*|State\\s*-\\s*|State\\s+\\d+\\s+|\\d+\\s*-\\s*|\\d+\\s+)", "")
                .trim();
        cleaned = cleaned.replaceAll("(?i)\\s+District$", "").trim();
        cleaned = cleaned.replaceAll("\\s+", " ").trim();
        return cleaned;
    }

    public static HierarchicalMetadata parseStateImage(List<String> folderPath, String fileName) {
        if (fileName == null || fileName.isBlank())
            return null;

        String ext = Product.getFileExtension(fileName).toLowerCase();
        List<String> imageExts = List.of("png", "jpg", "jpeg", "webp", "gif", "svg");
        if (!imageExts.contains(ext)) {
            return null;
        }

        boolean isStateImgFolder = false;
        if (folderPath != null) {
            for (String folder : folderPath) {
                if (isStateImagesFolder(folder)) {
                    isStateImgFolder = true;
                    break;
                }
            }
        }

        if (folderPath == null || folderPath.isEmpty() || isStateImgFolder) {
            String nameWithoutExt = Product.stripExtension(fileName);
            String cleanedName = nameWithoutExt.replaceAll("(?i)[\\s_\\-]*(image|img|thumbnail|photo|pic|picture)$", "")
                    .trim();
            cleanedName = cleanedName
                    .replaceAll("(?i)^(state\\s*\\d+\\s*-\\s*|state\\s*-\\s*|state\\s+\\d+\\s+|\\d+\\s*-\\s*|\\d+\\s+)",
                            "")
                    .trim();

            String slug = Product.generateSlug(cleanedName);

            if (DistrictParser.isKnownState(slug)) {
                String state = DistrictParser.getKnownStateName(slug);
                return new HierarchicalMetadata(
                        ItemType.STATE_IMAGE,
                        state, slug,
                        "Images", "images",
                        "state-image", "state-image", null,
                        "general", "general", AccessType.UNKNOWN, false, false);
            } else if (isStateImgFolder) {
                return new HierarchicalMetadata(
                        ItemType.STATE_IMAGE,
                        "General", "general",
                        "Images", "images",
                        "state-image", "state-image", null,
                        "general", "general", AccessType.UNKNOWN, false, false);
            }
        }

        return null;
    }

    /**
     * Generic & Backward-Compatible Folder Metadata Extractor
     * FAIL-CLOSED: If no explicit Free/Paid tier folder is found in the path,
     * accessType is set to UNKNOWN and hasTierFolder to false.
     */
    public static HierarchicalMetadata extractMetadata(List<String> folderPath, String fileName) {
        HierarchicalMetadata stateImageMeta = parseStateImage(folderPath, fileName);
        if (stateImageMeta != null) {
            return stateImageMeta;
        }

        if (folderPath != null) {
            for (String folder : folderPath) {
                if (isStateImagesFolder(folder)) {
                    return new HierarchicalMetadata(
                            ItemType.STATE_IMAGE,
                            "General", "general",
                            "Images", "images",
                            "state-image", "state-image", null,
                            "general", "general",
                            AccessType.UNKNOWN, false, false);
                }
            }
        }

        if (folderPath == null || folderPath.isEmpty()) {
            return new HierarchicalMetadata(
                    ItemType.RESOURCE,
                    "General", "general",
                    "General Notes", "general-notes",
                    null, null, null,
                    "general", "general",
                    AccessType.UNKNOWN, false, false);
        }

        List<String> cleanedPath = new ArrayList<>();
        boolean isFree = false;
        boolean hasTierFolder = false;
        AccessType accessType = AccessType.UNKNOWN;

        for (String folder : folderPath) {
            if (isFreeFolder(folder)) {
                isFree = true;
                hasTierFolder = true;
                accessType = AccessType.FREE;
                continue;
            }
            if (isPaidFolder(folder)) {
                isFree = false;
                hasTierFolder = true;
                accessType = AccessType.PAID;
                continue;
            }
            String norm = normalizeName(folder);
            if (!norm.isEmpty()) {
                String lastSlug = cleanedPath.isEmpty() ? ""
                        : Product.generateSlug(cleanedPath.get(cleanedPath.size() - 1));
                String currentSlug = Product.generateSlug(norm);
                if (!currentSlug.equals(lastSlug)) {
                    cleanedPath.add(norm);
                }
            }
        }

        if (cleanedPath.isEmpty()) {
            return new HierarchicalMetadata(
                    ItemType.RESOURCE,
                    "General", "general",
                    "General Notes", "general-notes",
                    null, null, null,
                    "general", "general",
                    accessType, hasTierFolder, isFree);
        }

        String state = "General";
        String stateSlug = "general";
        String district = "general";
        String districtSlug = "general";
        String navbarCategory = "General Notes";
        String subcategory = null;
        String subcategorySlug = null;
        String subfolderPath = null;

        // 1. Detect State
        int stateIdx = -1;
        for (int i = 0; i < cleanedPath.size(); i++) {
            Map.Entry<String, String> st = DistrictParser.parseState(cleanedPath.get(i));
            if (!st.getValue().equals("general") && DistrictParser.isKnownState(st.getValue())) {
                state = st.getKey();
                stateSlug = st.getValue();
                stateIdx = i;
                break;
            }
        }

        // 2. Detect District and Categories
        List<String> nonStateSegments = new ArrayList<>();
        for (int i = 0; i < cleanedPath.size(); i++) {
            if (i == stateIdx)
                continue;
            nonStateSegments.add(cleanedPath.get(i));
        }

        for (String seg : nonStateSegments) {
            String segSlug = Product.generateSlug(seg);
            if (TYPE_FOLDER_SLUGS.contains(segSlug))
                continue;

            Map.Entry<String, String> dist = DistrictParser.parseDistrict(seg);
            if (!dist.getValue().equals("general")) {
                district = dist.getKey();
                districtSlug = dist.getValue();
                break;
            }
        }

        // Determine Category / NavbarCategory
        if (!nonStateSegments.isEmpty()) {
            String firstNonState = nonStateSegments.get(0);
            String firstSlug = Product.generateSlug(firstNonState);

            if (firstSlug.equals("monuments") || firstSlug.equals("monument")) {
                navbarCategory = "Monuments";
            } else if (!TYPE_FOLDER_SLUGS.contains(firstSlug)) {
                navbarCategory = firstNonState;
            }

            if (nonStateSegments.size() > 1) {
                List<String> subList = nonStateSegments.subList(1, nonStateSegments.size());
                subcategory = subList.get(0);
                subcategorySlug = Product.generateSlug(subcategory);
                subfolderPath = String.join("/", subList);
            }
        }

        // Category mapping overrides
        if ("monuments".equalsIgnoreCase(navbarCategory) || "monument".equalsIgnoreCase(navbarCategory)) {
            navbarCategory = "Monuments";
        }
        String navbarSlug = Product.generateSlug(navbarCategory);
        if ("monuments".equals(navbarSlug)) {
            navbarSlug = "heritage-sites-monuments";
        }

        return new HierarchicalMetadata(
                ItemType.RESOURCE,
                state, stateSlug,
                navbarCategory, navbarSlug,
                subcategory, subcategorySlug, subfolderPath,
                district, districtSlug,
                accessType, hasTierFolder, isFree);
    }

    public static class HierarchicalMetadata {
        public final ItemType itemType;
        public final String state;
        public final String stateSlug;
        public final String navbarCategory;
        public final String navbarSlug;
        public final String subcategory;
        public final String subcategorySlug;
        public final String subfolderPath;
        public final String district;
        public final String districtSlug;
        public final AccessType accessType;
        public final boolean hasTierFolder;
        public final boolean isFree;

        public HierarchicalMetadata(ItemType itemType, String state, String stateSlug,
                String navbarCategory, String navbarSlug,
                String subcategory, String subcategorySlug, String subfolderPath,
                String district, String districtSlug,
                AccessType accessType, boolean hasTierFolder, boolean isFree) {
            this.itemType = itemType != null ? itemType : ItemType.RESOURCE;
            this.state = state;
            this.stateSlug = stateSlug;
            this.navbarCategory = navbarCategory;
            this.navbarSlug = navbarSlug;
            this.subcategory = subcategory;
            this.subcategorySlug = subcategorySlug;
            this.subfolderPath = subfolderPath;
            this.district = district;
            this.districtSlug = districtSlug;
            this.accessType = accessType;
            this.hasTierFolder = hasTierFolder;
            this.isFree = isFree;
        }

        public HierarchicalMetadata(String state, String stateSlug,
                String navbarCategory, String navbarSlug,
                String subcategory, String subcategorySlug, String subfolderPath,
                String district, String districtSlug,
                AccessType accessType, boolean hasTierFolder, boolean isFree) {
            this(ItemType.RESOURCE, state, stateSlug, navbarCategory, navbarSlug,
                    subcategory, subcategorySlug, subfolderPath, district, districtSlug,
                    accessType, hasTierFolder, isFree);
        }

        public String buildS3Key(String fileName) {
            if ("images".equals(navbarSlug) && "state-image".equals(subcategorySlug)) {
                return String.format("states/%s/%s", stateSlug, fileName);
            } else if ("general".equals(stateSlug)
                    && ("free-resources".equals(navbarSlug) || "physics".equals(navbarSlug))) {
                return String.format("free-resources/%s/%s", navbarSlug, fileName);
            } else if (district != null && !district.equals("general")) {
                return String.format("%s/%s/%s/%s",
                        stateSlug, districtSlug, (isFree ? "free" : "paid"), fileName);
            } else if (subfolderPath != null && !subfolderPath.isEmpty()) {
                String[] segments = subfolderPath.split("/");
                StringBuilder sb = new StringBuilder(stateSlug).append("/").append(navbarSlug);
                for (String seg : segments) {
                    sb.append("/").append(Product.generateSlug(seg));
                }
                sb.append("/").append(fileName);
                return sb.toString();
            } else {
                return String.format("%s/%s/%s", stateSlug, navbarSlug, fileName);
            }
        }
    }
}
