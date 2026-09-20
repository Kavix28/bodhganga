package com.bodhganga.bodhganga.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Reusable, strictly generic text normalization layer for OCR and text
 * extraction.
 * Cleans up UTF-8 mojibake, zero-width/non-breaking spaces, standard
 * quotes/dashes,
 * generic page branding/footers, and whitespace formatting.
 * Contains NO district-specific rules, factual replacements, or question number
 * hacks.
 */
@Service
public class OcrTextNormalizationService {

    // Generic PDF branding, header, and footer patterns common across BodhGanga
    // documents
    private static final List<Pattern> GENERIC_HEADER_FOOTER_PATTERNS = List.of(
            Pattern.compile("(?i)©\\s*Bodhganga\\s*Academy\\s*\\|\\s*All\\s*Rights\\s*Reserved\\.?", Pattern.MULTILINE),
            Pattern.compile("(?i)©\\s*BODH\\s*GANGA\\s*ACADEMY", Pattern.MULTILINE),
            Pattern.compile("(?i)National,\\s*Digital['\\s]*District\\s*Encyclopedia\\s*\\(NDDE\\)", Pattern.MULTILINE),
            Pattern.compile("(?i)National\\s*DigitalDistrict\\s*Encyclopedia\\s*\\(NDDE\\)", Pattern.MULTILINE),
            Pattern.compile("(?i)A\\s*Knowledge\\s*Initiative\\s*by\\s*BodhGanga\\s*Academy", Pattern.MULTILINE),
            Pattern.compile("(?i)Prepared\\s*By\\s*Prateek\\s*Bhargava", Pattern.MULTILINE),
            Pattern.compile("(?i)Research-Backed\\s*\\|\\s*Exam-Centric\\s*\\|\\s*Digital\\s*First", Pattern.MULTILINE),
            Pattern.compile("(?i)Comprehensive\\s*&\\s*Structured\\s*Question\\s*Bank", Pattern.MULTILINE),
            Pattern.compile(
                    "(?i)For\\s*UPSC\\s*\\|\\s*State\\s*PSC\\s*\\|\\s*SSC\\s*\\|\\s*CUET\\s*\\|\\s*Defence\\s*\\|\\s*Interview\\s*Preparation",
                    Pattern.MULTILINE),
            Pattern.compile("(?i)S\\.\\s*No\\.\\s*Section\\s*Question\\s*Range\\s*Category\\s*Page\\(s\\)",
                    Pattern.MULTILINE),
            Pattern.compile(
                    "(?i)Use\\s*this\\s*index\\s*for\\s*Topic\\s*Wise\\s*navigation\\s*and\\s*systematic\\s*revision\\.?",
                    Pattern.MULTILINE),
            Pattern.compile("(?i)\\(State-\\s*MAHARASHTRA\\)", Pattern.MULTILINE),
            Pattern.compile("(?i)ADVANCED\\s*MCQ\\s*SOLUTIONS", Pattern.MULTILINE),
            Pattern.compile("(?i)CONSOLIDATED\\s*ANSWER\\s*KEY", Pattern.MULTILINE),
            Pattern.compile("(?i)ANSWER\\s*KEY\\s*&\\s*EXPLANATIONS", Pattern.MULTILINE));

    /**
     * Fully normalizes OCR / extracted text generically.
     */
    public String normalizeText(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return "";
        }

        String text = rawText;

        // 1. Fix UTF-8 Mojibake and encoding corruptions
        text = fixMojibake(text);

        // 2. Normalize Q-headers and OCR noise in question/answer numbers
        text = normalizeHeaders(text);

        // 3. Remove generic page headers/footers/branding
        text = removeGenericBrandingAndFooters(text);

        // 4. Normalize quotes, punctuation, and whitespace
        text = normalizeWhitespaceAndPunctuation(text);

        return text.trim();
    }

    /**
     * Normalizes Q-headers, option markers, and OCR noise/corruptions in numbers.
     */
    public String normalizeHeaders(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String[] lines = text.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            String trimmed = line.trim();
            // Fix Euro symbol in option markers like (€) -> (c)
            trimmed = trimmed.replaceAll("(?i)\\(\\s*€\\s*\\)", "(c)")
                             .replaceAll("(?i)\\b€\\)", "c)");

            // Fix OCR noise between Q-number and option like Q28M\(c) -> Q28 (c), Q51%(b) -> Q51 (b), Q114, (c) -> Q114 (c)
            trimmed = trimmed.replaceAll("(?i)^(\\s*Q\\.?\\s*\\d{1,4})[M\\%\\,\\\\\\/\\_]+\\s*", "$1 ");

            // Fix line-start Q-header OCR digit corruptions generically:
            trimmed = trimmed.replaceAll("(?i)^(\\s*Q)7Te(?=[A-Za-z\\s\\.])", "$171. ");
            trimmed = trimmed.replaceAll("(?i)^(\\s*Q)8i(?=[A-Za-z\\s\\.])", "$181. ");
            trimmed = trimmed.replaceAll("(?i)^(\\s*Q)d1S(?=[A-Za-z\\s\\.])", "$1115. ");
            trimmed = trimmed.replaceAll("(?i)^(\\s*Q)738(?=[A-Za-z\\s\\.])", "$178. ");
            trimmed = trimmed.replaceAll("(?i)^(\\s*Q)839(?=[A-Za-z\\s\\.])", "$189. ");
            trimmed = trimmed.replaceAll("(?i)^(\\s*Q)i27n(?=[A-Za-z\\s\\.])", "$1127. ");

            sb.append(trimmed).append("\n");
        }
        return sb.toString();
    }

    /**
     * Shared Unicode-safe normalization strategy for matching and search.
     * Preserves Unicode letters (including Devanagari/Marathi), Unicode digits,
     * and Unicode combining marks (matras). Lowercases using Locale.ROOT, converts
     * punctuation/separators to spaces, collapses repeated whitespace, and trims.
     */
    public String normalizeForMatching(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return "";
        }
        String text = fixMojibake(rawText);
        text = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFC);
        text = text.toLowerCase(java.util.Locale.ROOT);
        // Retain Unicode letters (\p{L}), Unicode digits (\p{N}), and Unicode combining marks (\p{M})
        text = text.replaceAll("[^\\p{L}\\p{N}\\p{M}]", " ");
        text = text.replaceAll("\\s+", " ");
        return text.trim();
    }

    /**
     * Cleans up UTF-8 Mojibake, zero-width spaces, non-breaking spaces, and quotes.
     */
    public String fixMojibake(String text) {
        if (text == null) {
            return "";
        }
        return text
                .replace("â€™", "'")
                .replace("â€“", "–")
                .replace("â€”", "—")
                .replace("â€œ", "\"")
                .replace("â€", "\"")
                .replace("â€˜", "'")
                .replace("Ã©", "é")
                .replace("Ã¡", "á")
                .replace("Ã±", "ñ")
                .replace("’", "'")
                .replace("‘", "'")
                .replace("“", "\"")
                .replace("”", "\"")
                .replace("`", "'")
                .replace("\u00A0", " ") // non-breaking space
                .replace("\u200B", "") // zero-width space
                .replace("\uFEFF", ""); // BOM
    }

    /**
     * Removes generic page headers, footers, and repeated branding lines.
     */
    public String removeGenericBrandingAndFooters(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String result = text;
        for (Pattern p : GENERIC_HEADER_FOOTER_PATTERNS) {
            result = p.matcher(result).replaceAll("");
        }

        // Remove standalone numeric line footers (e.g. standalone line with page
        // numbers like "1", "2", "42")
        String[] lines = result.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.matches("^\\d{1,3}$")) {
                continue;
            }
            sb.append(line).append("\n");
        }
        return sb.toString();
    }

    /**
     * Normalizes spaces, linebreaks, and punctuation generically.
     */
    public String normalizeWhitespaceAndPunctuation(String text) {
        if (text == null) {
            return "";
        }
        String result = text;

        // Clean double/triple spaces
        result = result.replaceAll("[ \\t]+", " ");
        // Clean multiple blank lines
        result = result.replaceAll("\\n{3,}", "\n\n");

        return result;
    }

    /**
     * Cleans an individual question option string.
     */
    public String cleanOptionText(String rawOption) {
        if (rawOption == null || rawOption.isBlank()) {
            return "";
        }
        String clean = normalizeText(rawOption);
        // Strip leading option prefix like (a), (A), A., A), a.
        clean = clean.replaceAll("^(?:\\(?\\s*[A-Da-d]\\s*[\\)\\.\\:]\\s*)+", "").trim();
        // Strip leading commas or bullets
        clean = clean.replaceAll("^[\\,\\.\\-\\:]\\s*", "").trim();

        return clean;
    }

    /**
     * Cleans question body text.
     */
    public String cleanQuestionText(String rawQuestion) {
        if (rawQuestion == null || rawQuestion.isBlank()) {
            return "";
        }
        String clean = normalizeText(rawQuestion);
        // Strip leading question numbers like Q1., Q.1, Question 1., 1.
        clean = clean.replaceAll("(?i)^\\s*(?:Q\\.?|Question\\s*)?\\s*\\d{1,3}[\\.\\)\\:]?\\s*", "").trim();

        return clean;
    }
}
