package com.bodhganga.bodhganga.services.qb;

import com.google.api.services.drive.model.File;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class QuestionPdfPairingService {

    private static final Logger log = LoggerFactory.getLogger(QuestionPdfPairingService.class);

    private static final Set<String> QUESTION_TERMS = Set.of(
            "question", "questions", "mcq", "mcqs", "qbank", "questionbank", "test", "paper", "quiz", "problem",
            "problems");

    private static final Set<String> SOLUTION_TERMS = Set.of(
            "solution", "solutions", "explanation", "explanations", "answer", "answers", "key", "ans", "sol");

    public static class DiscoveredFileItem {
        private final File file;
        private final List<String> path;
        private final String state;
        private final String stateSlug;
        private final String district;
        private final String districtSlug;
        private final String normalizedName;
        private final boolean isQuestionPdf;
        private final boolean isSolutionPdf;

        public DiscoveredFileItem(File file, List<String> path) {
            this.file = file;
            this.path = path != null ? new ArrayList<>(path) : Collections.emptyList();
            this.state = !this.path.isEmpty() ? this.path.get(0) : "General";
            this.stateSlug = generateSlug(this.state);

            String distOrExam = this.path.size() > 1 ? this.path.get(1) : "State Exams";
            this.district = distOrExam;
            this.districtSlug = generateSlug(distOrExam);

            String fileName = file.getName() != null ? file.getName() : "";
            this.normalizedName = normalizeFileName(fileName);

            this.isSolutionPdf = isSolutionFile(this.normalizedName);
            // If it's explicitly classified as solution, it's not question PDF. Otherwise,
            // treat as question PDF candidate.
            this.isQuestionPdf = !this.isSolutionPdf;
        }

        public File getFile() {
            return file;
        }

        public List<String> getPath() {
            return path;
        }

        public String getState() {
            return state;
        }

        public String getStateSlug() {
            return stateSlug;
        }

        public String getDistrict() {
            return district;
        }

        public String getDistrictSlug() {
            return districtSlug;
        }

        public String getNormalizedName() {
            return normalizedName;
        }

        public boolean isQuestionPdf() {
            return isQuestionPdf;
        }

        public boolean isSolutionPdf() {
            return isSolutionPdf;
        }
    }

    public static class PdfPair {
        private final String state;
        private final String stateSlug;
        private final String district;
        private final String districtSlug;
        private final File questionFile;
        private final File solutionFile;
        private final String status; // PAIRED, AMBIGUOUS

        public PdfPair(String state, String stateSlug, String district, String districtSlug,
                File questionFile, File solutionFile, String status) {
            this.state = state;
            this.stateSlug = stateSlug;
            this.district = district;
            this.districtSlug = districtSlug;
            this.questionFile = questionFile;
            this.solutionFile = solutionFile;
            this.status = status;
        }

        public String getState() {
            return state;
        }

        public String getStateSlug() {
            return stateSlug;
        }

        public String getDistrict() {
            return district;
        }

        public String getDistrictSlug() {
            return districtSlug;
        }

        public File getQuestionFile() {
            return questionFile;
        }

        public File getSolutionFile() {
            return solutionFile;
        }

        public String getStatus() {
            return status;
        }
    }

    public static class PairingResult {
        private final List<PdfPair> pairs;
        private final int totalFoldersDiscovered;
        private final int totalFilesDiscovered;
        private final int totalPdfsDiscovered;
        private final int unsupportedFilesCount;
        private final int skippedFilesCount;
        private final int questionPdfCount;
        private final int explanationPdfCount;
        private final int matchedPairsCount;

        public PairingResult(List<PdfPair> pairs, int totalFoldersDiscovered, int totalFilesDiscovered,
                int totalPdfsDiscovered, int unsupportedFilesCount, int skippedFilesCount,
                int questionPdfCount, int explanationPdfCount, int matchedPairsCount) {
            this.pairs = pairs;
            this.totalFoldersDiscovered = totalFoldersDiscovered;
            this.totalFilesDiscovered = totalFilesDiscovered;
            this.totalPdfsDiscovered = totalPdfsDiscovered;
            this.unsupportedFilesCount = unsupportedFilesCount;
            this.skippedFilesCount = skippedFilesCount;
            this.questionPdfCount = questionPdfCount;
            this.explanationPdfCount = explanationPdfCount;
            this.matchedPairsCount = matchedPairsCount;
        }

        public List<PdfPair> getPairs() {
            return pairs;
        }

        public int getTotalFoldersDiscovered() {
            return totalFoldersDiscovered;
        }

        public int getTotalFilesDiscovered() {
            return totalFilesDiscovered;
        }

        public int getTotalPdfsDiscovered() {
            return totalPdfsDiscovered;
        }

        public int getUnsupportedFilesCount() {
            return unsupportedFilesCount;
        }

        public int getSkippedFilesCount() {
            return skippedFilesCount;
        }

        public int getQuestionPdfCount() {
            return questionPdfCount;
        }

        public int getExplanationPdfCount() {
            return explanationPdfCount;
        }

        public int getMatchedPairsCount() {
            return matchedPairsCount;
        }
    }

    public PairingResult pairDiscoveredFiles(String sourceFolderId,
            List<Map.Entry<File, List<String>>> allDiscoveredItems) {
        int totalFolders = 0;
        int totalFiles = 0;
        int totalPdfs = 0;
        int unsupportedFiles = 0;
        int skippedFiles = 0;

        List<DiscoveredFileItem> pdfItems = new ArrayList<>();

        for (Map.Entry<File, List<String>> entry : allDiscoveredItems) {
            File item = entry.getKey();
            List<String> path = entry.getValue();

            if ("application/vnd.google-apps.folder".equals(item.getMimeType())) {
                totalFolders++;
                continue;
            }

            totalFiles++;
            String fileName = item.getName() != null ? item.getName() : "";

            if (!fileName.toLowerCase().endsWith(".pdf")) {
                unsupportedFiles++;
                skippedFiles++;
                log.info("[QB DRIVE] SKIP file='{}' reason='Non-PDF file type ({})'", fileName, item.getMimeType());
                continue;
            }

            if (item.getSize() != null && item.getSize() == 0) {
                skippedFiles++;
                log.info("[QB DRIVE] SKIP file='{}' reason='Zero-byte empty file'", fileName);
                continue;
            }

            totalPdfs++;
            pdfItems.add(new DiscoveredFileItem(item, path));
        }

        int questionPdfCount = 0;
        int explanationPdfCount = 0;
        for (DiscoveredFileItem item : pdfItems) {
            if (item.isSolutionPdf()) {
                explanationPdfCount++;
            } else {
                questionPdfCount++;
            }
        }

        // Group by stateSlug + districtSlug
        Map<String, List<DiscoveredFileItem>> grouped = pdfItems.stream()
                .collect(Collectors.groupingBy(i -> i.getStateSlug() + "::" + i.getDistrictSlug()));

        List<PdfPair> pairs = new ArrayList<>();

        for (Map.Entry<String, List<DiscoveredFileItem>> group : grouped.entrySet()) {
            List<DiscoveredFileItem> groupItems = group.getValue();
            if (groupItems.isEmpty())
                continue;

            DiscoveredFileItem first = groupItems.get(0);
            String state = first.getState();
            String stateSlug = first.getStateSlug();
            String district = first.getDistrict();
            String districtSlug = first.getDistrictSlug();

            List<DiscoveredFileItem> qFiles = groupItems.stream().filter(i -> !i.isSolutionPdf())
                    .collect(Collectors.toList());
            List<DiscoveredFileItem> sFiles = groupItems.stream().filter(DiscoveredFileItem::isSolutionPdf)
                    .collect(Collectors.toList());

            if (qFiles.size() == 1 && sFiles.size() == 1) {
                pairs.add(new PdfPair(state, stateSlug, district, districtSlug, qFiles.get(0).getFile(),
                        sFiles.get(0).getFile(), "PAIRED"));
            } else if (qFiles.size() == 1 && sFiles.isEmpty()) {
                // Single PDF containing both questions and solutions (e.g. unified PDF)
                pairs.add(new PdfPair(state, stateSlug, district, districtSlug, qFiles.get(0).getFile(),
                        qFiles.get(0).getFile(), "PAIRED"));
            } else if (qFiles.isEmpty() && sFiles.size() == 1) {
                log.warn("[QB DRIVE] AMBIGUOUS pairing for location {}/{}: 0 question PDFs found, 1 solution PDF found",
                        state, district);
                pairs.add(new PdfPair(state, stateSlug, district, districtSlug, null, sFiles.get(0).getFile(),
                        "AMBIGUOUS"));
            } else {
                // Attempt stem matching
                Map<String, DiscoveredFileItem> qByStem = new HashMap<>();
                for (DiscoveredFileItem q : qFiles) {
                    qByStem.put(extractStem(q.getNormalizedName()), q);
                }

                Map<String, DiscoveredFileItem> sByStem = new HashMap<>();
                for (DiscoveredFileItem s : sFiles) {
                    sByStem.put(extractStem(s.getNormalizedName()), s);
                }

                Set<String> allStems = new HashSet<>();
                allStems.addAll(qByStem.keySet());
                allStems.addAll(sByStem.keySet());

                for (String stem : allStems) {
                    DiscoveredFileItem qMatch = qByStem.get(stem);
                    DiscoveredFileItem sMatch = sByStem.get(stem);

                    if (qMatch != null && sMatch != null) {
                        pairs.add(new PdfPair(state, stateSlug, district, districtSlug, qMatch.getFile(),
                                sMatch.getFile(), "PAIRED"));
                    } else if (qMatch != null) {
                        pairs.add(new PdfPair(state, stateSlug, district, districtSlug, qMatch.getFile(),
                                qMatch.getFile(), "PAIRED"));
                    } else {
                        log.warn("[QB DRIVE] AMBIGUOUS pairing for stem {} in {}/{}: missing question PDF", stem, state,
                                district);
                        pairs.add(new PdfPair(state, stateSlug, district, districtSlug, null, sMatch.getFile(),
                                "AMBIGUOUS"));
                    }
                }
            }
        }

        int matchedPairsCount = (int) pairs.stream().filter(p -> "PAIRED".equalsIgnoreCase(p.getStatus())).count();

        log.info("[QB DRIVE] Source folder: {}", sourceFolderId);
        log.info("[QB DRIVE] Folders discovered: {}", totalFolders);
        log.info("[QB DRIVE] Files discovered: {}", totalFiles);
        log.info("[QB DRIVE] PDFs discovered: {}", totalPdfs);
        log.info("[QB DRIVE] Question PDFs: {}", questionPdfCount);
        log.info("[QB DRIVE] Explanation PDFs: {}", explanationPdfCount);
        log.info("[QB DRIVE] Matched pairs: {}", matchedPairsCount);

        return new PairingResult(pairs, totalFolders, totalFiles, totalPdfs, unsupportedFiles, skippedFiles,
                questionPdfCount, explanationPdfCount, matchedPairsCount);
    }

    public static boolean isSolutionFile(String normalizedName) {
        if (normalizedName == null)
            return false;
        String name = normalizedName.toLowerCase();
        for (String term : SOLUTION_TERMS) {
            if (name.contains(term))
                return true;
        }
        return false;
    }

    public static boolean isQuestionFile(String normalizedName) {
        if (normalizedName == null)
            return false;
        String name = normalizedName.toLowerCase();
        for (String term : QUESTION_TERMS) {
            if (name.contains(term))
                return true;
        }
        return false;
    }

    public static String normalizeFileName(String name) {
        if (name == null)
            return "";
        String clean = name;
        if (clean.toLowerCase().endsWith(".pdf")) {
            clean = clean.substring(0, clean.length() - 4);
        }
        return clean.toLowerCase().replaceAll("[^a-z0-9]+", " ").trim();
    }

    public static String extractStem(String normalizedName) {
        if (normalizedName == null)
            return "";
        String stem = normalizedName;
        for (String term : QUESTION_TERMS) {
            stem = stem.replaceAll("\\b" + Pattern.quote(term) + "\\b", "");
        }
        for (String term : SOLUTION_TERMS) {
            stem = stem.replaceAll("\\b" + Pattern.quote(term) + "\\b", "");
        }
        return generateSlug(stem.trim());
    }

    public static String generateSlug(String input) {
        if (input == null)
            return "";
        return input.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
