package com.bodhganga.bodhganga.services.testseries;

import com.bodhganga.bodhganga.dto.testseries.TestSeriesRequestDTO;
import com.bodhganga.bodhganga.entity.testseries.TestSeries;
import com.bodhganga.bodhganga.repo.testseries.TestSeriesRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class TestSeriesService {

    private final TestSeriesRepo testSeriesRepo;

    public TestSeriesService(TestSeriesRepo testSeriesRepo) {
        this.testSeriesRepo = testSeriesRepo;
    }

    public Page<TestSeries> getPublishedCatalog(int page, int size) {
        return testSeriesRepo.findByIsPublishedTrueAndIsDeletedFalse(PageRequest.of(page, size));
    }

    public List<TestSeries> getByState(String stateSlug) {
        return testSeriesRepo.findByStateSlugAndIsPublishedTrueAndIsDeletedFalse(stateSlug);
    }

    public List<TestSeries> getByDistrict(String districtSlug) {
        return testSeriesRepo.findByDistrictSlugAndIsPublishedTrueAndIsDeletedFalse(districtSlug);
    }

    public List<TestSeries> getByType(String testType) {
        return testSeriesRepo.findByTestTypeAndIsPublishedTrueAndIsDeletedFalse(testType);
    }

    public TestSeries getById(String id) {
        return testSeriesRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Test series not found"));
    }

    public TestSeries createTestSeries(TestSeriesRequestDTO dto, String createdBy) {
        TestSeries ts = new TestSeries();
        copyFields(dto, ts);
        ts.setCreatedBy(createdBy);
        ts.setCreatedAt(new Date());
        ts.setUpdatedAt(new Date());
        return testSeriesRepo.save(ts);
    }

    public TestSeries updateTestSeries(String id, TestSeriesRequestDTO dto) {
        TestSeries ts = getById(id);
        copyFields(dto, ts);
        ts.setUpdatedAt(new Date());
        return testSeriesRepo.save(ts);
    }

    public TestSeries publishTestSeries(String id, boolean publish) {
        TestSeries ts = getById(id);
        ts.setIsPublished(publish);
        ts.setUpdatedAt(new Date());
        return testSeriesRepo.save(ts);
    }

    private void copyFields(TestSeriesRequestDTO dto, TestSeries ts) {
        if (dto.getTitle() != null) ts.setTitle(dto.getTitle());
        if (dto.getSlug() != null) ts.setSlug(dto.getSlug());
        if (dto.getDescription() != null) ts.setDescription(dto.getDescription());
        if (dto.getStateSlug() != null) ts.setStateSlug(dto.getStateSlug());
        if (dto.getDistrictSlug() != null) ts.setDistrictSlug(dto.getDistrictSlug());
        if (dto.getSubjectId() != null) ts.setSubjectId(dto.getSubjectId());
        if (dto.getTopicId() != null) ts.setTopicId(dto.getTopicId());
        if (dto.getTestType() != null) ts.setTestType(dto.getTestType());
        if (dto.getCategory() != null) ts.setCategory(dto.getCategory());
        if (dto.getIsFree() != null) ts.setIsFree(dto.getIsFree());
        if (dto.getPrice() != null) ts.setPrice(dto.getPrice());
        if (dto.getProductId() != null) ts.setProductId(dto.getProductId());
        if (dto.getDurationMinutes() != null) ts.setDurationMinutes(dto.getDurationMinutes());
        if (dto.getTotalMarks() != null) ts.setTotalMarks(dto.getTotalMarks());
        if (dto.getPassingPercentage() != null) ts.setPassingPercentage(dto.getPassingPercentage());
        if (dto.getPositiveMarksPerQuestion() != null) ts.setPositiveMarksPerQuestion(dto.getPositiveMarksPerQuestion());
        if (dto.getNegativeMarksPerQuestion() != null) ts.setNegativeMarksPerQuestion(dto.getNegativeMarksPerQuestion());
        if (dto.getAllowNegativeMarking() != null) ts.setAllowNegativeMarking(dto.getAllowNegativeMarking());
        if (dto.getRandomizeQuestions() != null) ts.setRandomizeQuestions(dto.getRandomizeQuestions());
        if (dto.getRandomizeOptions() != null) ts.setRandomizeOptions(dto.getRandomizeOptions());
        if (dto.getShowSolutionsImmediately() != null) ts.setShowSolutionsImmediately(dto.getShowSolutionsImmediately());
        if (dto.getIsScheduled() != null) ts.setIsScheduled(dto.getIsScheduled());
        if (dto.getStartDate() != null) ts.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) ts.setEndDate(dto.getEndDate());
        if (dto.getSections() != null) ts.setSections(dto.getSections());
        if (dto.getQuestionIds() != null) ts.setQuestionIds(dto.getQuestionIds());
    }
}
