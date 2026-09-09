package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Question;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepo extends MongoRepository<Question, String> {

        List<Question> findByStateSlugAndDistrictSlugAndTestTypeAndStatusAndIsActiveTrueOrderByQuestionNumberAsc(
                        String stateSlug, String districtSlug, String testType, String status);

        List<Question> findByStateSlugAndDistrictSlugAndTestTypeAndTopicAndStatusAndIsActiveTrueOrderByQuestionNumberAsc(
                        String stateSlug, String districtSlug, String testType, String topic, String status);

        List<Question> findByStateSlugAndDistrictSlugAndTestTypeAndIsActiveTrueOrderByQuestionNumberAsc(
                        String stateSlug, String districtSlug, String testType);

        List<Question> findByDistrictSlugAndTestTypeAndIsActiveTrueOrderByQuestionNumberAsc(
                        String districtSlug, String testType);

        List<Question> findByStateSlugAndTestTypeAndIsActiveTrueOrderByQuestionNumberAsc(
                        String stateSlug, String testType);

        List<Question> findByIdInAndIsActiveTrue(List<String> ids);

        Optional<Question> findByStateSlugAndDistrictSlugAndTestTypeAndQuestionNumber(
                        String stateSlug, String districtSlug, String testType, int questionNumber);

        List<Question> findByIsActiveTrue();

        // Admin ingestion & review queries
        List<Question> findByFileHash(String fileHash);

        List<Question> findByStateSlugAndDistrictSlugAndStatus(String stateSlug, String districtSlug, String status);

        List<Question> findByStateSlugAndDistrictSlug(String stateSlug, String districtSlug);

        List<Question> findByStatus(String status);
}
