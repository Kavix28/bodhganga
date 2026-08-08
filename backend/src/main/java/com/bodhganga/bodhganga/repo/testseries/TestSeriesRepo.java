package com.bodhganga.bodhganga.repo.testseries;

import com.bodhganga.bodhganga.entity.testseries.TestSeries;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestSeriesRepo extends MongoRepository<TestSeries, String> {

    Optional<TestSeries> findBySlugAndIsDeletedFalse(String slug);

    Page<TestSeries> findByIsPublishedTrueAndIsDeletedFalse(Pageable pageable);

    List<TestSeries> findByStateSlugAndIsPublishedTrueAndIsDeletedFalse(String stateSlug);

    List<TestSeries> findByDistrictSlugAndIsPublishedTrueAndIsDeletedFalse(String districtSlug);

    List<TestSeries> findByTestTypeAndIsPublishedTrueAndIsDeletedFalse(String testType);

    List<TestSeries> findBySubjectIdAndIsPublishedTrueAndIsDeletedFalse(String subjectId);

    Page<TestSeries> findByIsDeletedFalse(Pageable pageable);

    long countByIsPublishedTrueAndIsDeletedFalse();

    long countByIsFreeTrueAndIsPublishedTrueAndIsDeletedFalse();
}
