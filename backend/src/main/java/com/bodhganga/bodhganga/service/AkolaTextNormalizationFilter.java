package com.bodhganga.bodhganga.service;

import org.springframework.stereotype.Component;

/**
 * Document-level OCR character repair filter specifically for Akola District
 * PDF scans.
 * Contains targeted character fixes strictly for Tesseract OCR misread
 * character sequences
 * verified directly against source PDF line transcripts.
 *
 * Strictly enforces:
 * - NO question header injection (e.g. Q55 injection removed)
 * - NO text fabrication or semantic alteration
 * - NO factual or regional spelling changes
 */
@Component
public class AkolaTextNormalizationFilter implements TextNormalizationFilter {

    @Override
    public String filter(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }

        return text
                // OCR evidence:
                // raw OCR: UPS€-Level / UPS€
                // intended source text: UPSC-Level / UPSC
                // reason: Tesseract OCR misread letter 'C' as Euro symbol '€' in section header
                .replace("UPS€-Level", "UPSC-Level")
                .replace("UPS€", "UPSC")

                // OCR evidence:
                // raw OCR: Q7 The Korku / Q7TeThe
                // intended source text: Q71. The Korku
                // reason: Question PDF Line 557 OCR misread question number '71' as '7'
                // (missing '1' before 'The Korku')
                .replace("Q7 The Korku", "Q71. The Korku")
                .replace("Q7TeThe", "Q71. The")

                // OCR evidence:
                // raw OCR: Qd1S., / Qd1S. / Qd1S / Qd15. / Qd15
                // intended source text: Q115.
                // reason: Question PDF Line 846 OCR misread question number '115.' as 'd1S.'
                .replace("Qd1S.,", "Q115.")
                .replace("Qd1S.", "Q115.")
                .replace("Qd1S", "Q115.")
                .replace("Qd15.", "Q115.")
                .replace("Qd15", "Q115")

                // OCR evidence:
                // raw OCR: Q839. / Q839
                // intended source text: Q89.
                // reason: Solution PDF Line 407 OCR misread question number '89.' as '839.'
                .replace("Q839.", "Q89.")
                .replace("Q839", "Q89.")

                // OCR evidence:
                // raw OCR: Qi27n(e) / Qi27\(e) / Qi27
                // intended source text: Q127. (c) / Q127
                // reason: Solution PDF Line 533 OCR misread digit '1' as 'i' and option '(c)'
                // as 'n(e)' or '\(e)'
                .replace("Qi27n(e)", "Q127. (c)")
                .replace("Qi27\\(e)", "Q127. (c)")
                .replace("Qi27", "Q127")

                // OCR evidence:
                // raw OCR: Q19(€) / Q19.(e)
                // intended source text: Q19. (c)
                // reason: Solution PDF OCR misread option letter '(c)' as '(€)' or '(e)'
                .replace("Q19(€)", "Q19. (c)")
                .replace("Q19.(e)", "Q19. (c)")

                // OCR evidence:
                // raw OCR: Q28~\(c) / Q28~ / Q28M\(c) / Q28M
                // intended source text: Q28. (c) / Q28.
                // reason: Solution PDF Page 4 line OCR misread dot '.' as tilde '~' or 'M' and
                // '(' as '\('
                .replace("Q28~\\(c)", "Q28. (c)")
                .replace("Q28~", "Q28.")
                .replace("Q28M\\(c)", "Q28. (c)")
                .replace("Q28M", "Q28.")

                // OCR evidence:
                // raw OCR: Q84.\{e) / Q84. (e)
                // intended source text: Q84. (c)
                // reason: Solution PDF Line 381 OCR misread option letter '(c)' as '\{e)' or
                // '(e)'
                .replace("Q84.\\{e)", "Q84. (c)")
                .replace("Q84. (e)", "Q84. (c)")

                // OCR evidence:
                // raw OCR: Q116(b)
                // intended source text: Q116. (b)
                // reason: Solution PDF OCR missing period/whitespace separator
                .replace("Q116(b)", "Q116. (b)")

                // OCR evidence:
                // raw OCR: Q126. (4)
                // intended source text: Q126. (d)
                // reason: Solution PDF Line 531 OCR misread option letter '(d)' as digit '(4)'
                .replace("Q126. (4)", "Q126. (d)")

                // OCR evidence:
                // raw OCR: Qs. (¢)
                // intended source text: Q8. (c)
                // reason: Solution PDF OCR misread question number '8' as 's' and option '(c)'
                // as '(¢)'
                .replace("Qs. (¢)", "Q8. (c)")

                // OCR evidence:
                // raw OCR: Qao.
                // intended source text: Q40.
                // reason: Question PDF OCR misread digit '40' as 'ao'
                .replace("Qao.", "Q40.")

                // OCR evidence:
                // raw OCR: Q738.
                // intended source text: Q78.
                // reason: Solution PDF OCR misread question number '78.' as '738.'
                .replace("Q738.", "Q78.")

                // OCR evidence:
                // raw OCR: Q114,
                // intended source text: Q114.
                // reason: Solution PDF OCR misread period '.' as comma ','
                .replace("Q114,", "Q114.")

                // OCR evidence:
                // raw OCR: Q116»
                // intended source text: Q116.
                // reason: Solution PDF OCR misread period '.' as guillemet '»'
                .replace("Q116»", "Q116.")

                // OCR evidence:
                // raw OCR: Q8i. / Q8i,
                // intended source text: Q81.
                // reason: Question PDF OCR misread digit '1' as letter 'i'
                .replace("Q8i.", "Q81.")
                .replace("Q8i,", "Q81.")

                // OCR evidence:
                // raw OCR: Q51%
                // intended source text: Q51.
                // reason: Question PDF OCR misread period '.' as percent sign '%'
                .replace("Q51%", "Q51.");
    }
}
