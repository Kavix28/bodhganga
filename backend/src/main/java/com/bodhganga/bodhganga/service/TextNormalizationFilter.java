package com.bodhganga.bodhganga.service;

/**
 * Functional interface for document-level or district-level OCR text
 * normalization filters.
 */
@FunctionalInterface
public interface TextNormalizationFilter {
    /**
     * Applies document-specific OCR repair transformations to the input text.
     *
     * @param text raw or generically normalized OCR text
     * @return repaired text suitable for structural parsing
     */
    String filter(String text);
}
