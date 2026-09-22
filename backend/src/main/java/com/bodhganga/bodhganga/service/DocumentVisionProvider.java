package com.bodhganga.bodhganga.service;

import java.util.List;
import java.util.Map;

/**
 * Clean provider abstraction for visual document extraction (PDF page images to
 * structured data).
 */
public interface DocumentVisionProvider {

    record VisionResult<T>(
            T data,
            boolean success,
            String failureReason,
            int statusCode) {
        public static <T> VisionResult<T> ofSuccess(T data) {
            return new VisionResult<>(data, true, null, 200);
        }

        public static <T> VisionResult<T> ofFailure(String reason, int statusCode) {
            return new VisionResult<>(null, false, reason, statusCode);
        }
    }

    boolean hasApiKey();

    VisionResult<List<QuestionParserService.ParsedQuestion>> extractQuestionsFromPage(
            byte[] imageBytes, String mimeType, int pageNumber);

    VisionResult<Map<Integer, AnswerParserService.ParsedAnswer>> extractSolutionsFromPage(
            byte[] imageBytes, String mimeType, int pageNumber);
}
