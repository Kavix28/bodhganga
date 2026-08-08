package com.bodhganga.bodhganga.util;

import java.util.*;

public class DistrictParser {

    public static class ParsedLocation {
        private final String state;
        private final String stateSlug;
        private final String district;
        private final String districtSlug;
        private final String category;
        private final String categorySlug;

        public ParsedLocation(String state, String stateSlug, String district, String districtSlug, String category, String categorySlug) {
            this.state = state;
            this.stateSlug = stateSlug;
            this.district = district;
            this.districtSlug = districtSlug;
            this.category = category;
            this.categorySlug = categorySlug;
        }

        public String getState() { return state; }
        public String getStateSlug() { return stateSlug; }
        public String getDistrict() { return district; }
        public String getDistrictSlug() { return districtSlug; }
        public String getCategory() { return category; }
        public String getCategorySlug() { return categorySlug; }
    }

    private static final Set<String> NON_DISTRICT_SLUGS = Set.of(
        "general", "state-images", "stateimages", "images", "pdf", "pdfs", "free", "paid",
        "free-resources", "paid-resources", "documents", "notes", "question-bank"
    );

    private static final Map<String, String> KNOWN_DISTRICTS_MAP = new HashMap<>();
    private static final Map<String, String> KNOWN_STATES_MAP = new HashMap<>();

    static {
        // Known States & UTs mapping
        Map<String, String> states = Map.ofEntries(
            Map.entry("andhra-pradesh", "Andhra Pradesh"),
            Map.entry("arunachal-pradesh", "Arunachal Pradesh"),
            Map.entry("assam", "Assam"),
            Map.entry("bihar", "Bihar"),
            Map.entry("chhattisgarh", "Chhattisgarh"),
            Map.entry("goa", "Goa"),
            Map.entry("gujarat", "Gujarat"),
            Map.entry("haryana", "Haryana"),
            Map.entry("himachal-pradesh", "Himachal Pradesh"),
            Map.entry("jharkhand", "Jharkhand"),
            Map.entry("karnataka", "Karnataka"),
            Map.entry("kerala", "Kerala"),
            Map.entry("madhya-pradesh", "Madhya Pradesh"),
            Map.entry("maharashtra", "Maharashtra"),
            Map.entry("manipur", "Manipur"),
            Map.entry("meghalaya", "Meghalaya"),
            Map.entry("mizoram", "Mizoram"),
            Map.entry("nagaland", "Nagaland"),
            Map.entry("odisha", "Odisha"),
            Map.entry("punjab", "Punjab"),
            Map.entry("rajasthan", "Rajasthan"),
            Map.entry("sikkim", "Sikkim"),
            Map.entry("tamil-nadu", "Tamil Nadu"),
            Map.entry("telangana", "Telangana"),
            Map.entry("tripura", "Tripura"),
            Map.entry("uttar-pradesh", "Uttar Pradesh"),
            Map.entry("uttarakhand", "Uttarakhand"),
            Map.entry("west-bengal", "West Bengal"),
            Map.entry("delhi", "Delhi"),
            Map.entry("jammu-and-kashmir", "Jammu & Kashmir"),
            Map.entry("jammu-kashmir", "Jammu & Kashmir"),
            Map.entry("ladakh", "Ladakh"),
            Map.entry("puducherry", "Puducherry"),
            Map.entry("chandigarh", "Chandigarh"),
            Map.entry("lakshadweep", "Lakshadweep"),
            Map.entry("andaman-and-nicobar-islands", "Andaman & Nicobar Islands"),
            Map.entry("andaman-nicobar", "Andaman & Nicobar Islands"),
            Map.entry("dnh-dd", "Dadra & Nagar Haveli and Daman & Diu")
        );
        KNOWN_STATES_MAP.putAll(states);

        // Standard District List Mapping
        List<String> rawDistrictNames = List.of(
            // Haryana
            "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar",
            "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula",
            "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar",
            // Himachal Pradesh
            "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi",
            "Shimla", "Sirmaur", "Solan", "Una",
            // Jharkhand
            "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih",
            "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga",
            "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum",
            // Madhya Pradesh & Maharashtra & Others
            "Akola", "Alirajpur", "Bhopal", "Chittoor", "Patna", "Indore", "Gwalior", "Jabalpur", "Ujjain",
            "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur", "Amravati", "Nanded", "Kolhapur",
            "Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Lucknow", "Kanpur", "Varanasi",
            "Agra", "Prayagraj", "Meerut", "Gorakhpur", "Noida", "Ghaziabad"
        );

        for (String name : rawDistrictNames) {
            String slug = generateSlug(name);
            KNOWN_DISTRICTS_MAP.put(slug, name);
        }
    }

    public static String getKnownStateName(String slug) {
        return KNOWN_STATES_MAP.get(slug);
    }

    public static boolean isKnownState(String slug) {
        return slug != null && KNOWN_STATES_MAP.containsKey(slug);
    }

    public static String generateSlug(String text) {
        if (text == null || text.isBlank()) return "general";
        return text.toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }

    public static String toTitleCase(String text) {
        if (text == null || text.isBlank()) return "";
        String[] words = text.split("[\\s_-]+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (w.isEmpty()) continue;
            if (sb.length() > 0) sb.append(" ");
            sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1).toLowerCase());
        }
        return sb.toString();
    }

    /**
     * Centralized parser for district names from any input string or folder segment.
     * Supports formats like:
     * - "district-44-kurukshetra" -> "Kurukshetra" (slug: "kurukshetra")
     * - "district-1-ambala"        -> "Ambala" (slug: "ambala")
     * - "district_44_kurukshetra"  -> "Kurukshetra" (slug: "kurukshetra")
     * - "District 44 Kurukshetra"  -> "Kurukshetra" (slug: "kurukshetra")
     * - "District-44 Kurukshetra"  -> "Kurukshetra" (slug: "kurukshetra")
     * - "01 - Ambala District"     -> "Ambala" (slug: "ambala")
     */
    public static Map.Entry<String, String> parseDistrict(String rawInput) {
        if (rawInput == null || rawInput.isBlank()) {
            return Map.entry("general", "general");
        }

        String trimmed = rawInput.trim();
        String slug = generateSlug(trimmed);

        if (NON_DISTRICT_SLUGS.contains(slug)) {
            return Map.entry("general", "general");
        }

        // Direct lookup in known districts
        if (KNOWN_DISTRICTS_MAP.containsKey(slug)) {
            return Map.entry(KNOWN_DISTRICTS_MAP.get(slug), slug);
        }

        // Clean prefix patterns: district-44-, district_44_, District 44, district44, 01 -
        String cleaned = trimmed;
        cleaned = cleaned.replaceAll("(?i)^(state\\s*\\d+\\s*-\\s*|state\\s*-\\s*|state\\s+\\d+\\s+|\\d+\\s*-\\s*|\\d+\\s+)", "").trim();
        cleaned = cleaned.replaceAll("(?i)^(district|dist)[\\s_\\-]*\\d+[\\s_\\-]*", "").trim();
        cleaned = cleaned.replaceAll("(?i)^(district|dist)[\\s_\\-]*", "").trim();
        cleaned = cleaned.replaceAll("(?i)[\\s_\\-]*district$", "").trim();

        String cleanedSlug = generateSlug(cleaned);

        if (NON_DISTRICT_SLUGS.contains(cleanedSlug) || cleanedSlug.isEmpty()) {
            return Map.entry("general", "general");
        }

        if (KNOWN_DISTRICTS_MAP.containsKey(cleanedSlug)) {
            return Map.entry(KNOWN_DISTRICTS_MAP.get(cleanedSlug), cleanedSlug);
        }

        // Substring / token matching against known districts
        for (Map.Entry<String, String> entry : KNOWN_DISTRICTS_MAP.entrySet()) {
            String knownSlug = entry.getKey();
            if (slug.contains(knownSlug) || cleanedSlug.contains(knownSlug)) {
                return Map.entry(entry.getValue(), knownSlug);
            }
        }

        // Fallback: title case cleaned name
        String titleName = toTitleCase(cleaned);
        return Map.entry(titleName, cleanedSlug);
    }

    /**
     * Parses state name and slug cleanly.
     */
    public static Map.Entry<String, String> parseState(String rawInput) {
        if (rawInput == null || rawInput.isBlank()) {
            return Map.entry("general", "general");
        }
        String cleaned = rawInput.replaceAll("(?i)^(state\\s*\\d+\\s*-\\s*|state\\s*-\\s*|state\\s+\\d+\\s+|\\d+\\s*-\\s*|\\d+\\s+)", "").trim();
        String slug = generateSlug(cleaned);

        if (KNOWN_STATES_MAP.containsKey(slug)) {
            return Map.entry(KNOWN_STATES_MAP.get(slug), slug);
        }
        return Map.entry(toTitleCase(cleaned), slug);
    }

    /**
     * Centralized location extraction from folder path segments or storage key string.
     */
    public static ParsedLocation extractLocation(List<String> folderPath, String fallbackStorageKey) {
        String state = "general";
        String stateSlug = "general";
        String district = "general";
        String districtSlug = "general";
        String category = "general";
        String categorySlug = "general";

        List<String> segments = new ArrayList<>();
        if (folderPath != null && !folderPath.isEmpty()) {
            segments.addAll(folderPath);
        } else if (fallbackStorageKey != null && !fallbackStorageKey.isBlank()) {
            segments.addAll(List.of(fallbackStorageKey.split("/")));
        }

        if (segments.isEmpty()) {
            return new ParsedLocation(state, stateSlug, district, districtSlug, category, categorySlug);
        }

        // 1. Identify State
        int stateIdx = -1;
        for (int i = 0; i < segments.size(); i++) {
            Map.Entry<String, String> st = parseState(segments.get(i));
            if (!st.getValue().equals("general") && KNOWN_STATES_MAP.containsKey(st.getValue())) {
                state = st.getKey();
                stateSlug = st.getValue();
                stateIdx = i;
                break;
            }
        }

        if (stateIdx == -1 && !segments.isEmpty()) {
            Map.Entry<String, String> st = parseState(segments.get(0));
            state = st.getKey();
            stateSlug = st.getValue();
            stateIdx = 0;
        }

        // 2. Identify District & Category
        for (int i = 0; i < segments.size(); i++) {
            if (i == stateIdx) continue;
            String seg = segments.get(i);
            String segSlug = generateSlug(seg);

            if (NON_DISTRICT_SLUGS.contains(segSlug)) continue;

            Map.Entry<String, String> dist = parseDistrict(seg);
            if (!dist.getValue().equals("general")) {
                district = dist.getKey();
                districtSlug = dist.getValue();
                category = dist.getKey();
                categorySlug = dist.getValue();
                break;
            }
        }

        return new ParsedLocation(state, stateSlug, district, districtSlug, category, categorySlug);
    }
}
