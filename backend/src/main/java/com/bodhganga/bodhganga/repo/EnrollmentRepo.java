package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Enrollment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepo extends MongoRepository<Enrollment, String> {
    List<Enrollment> findByUserId(String userId);

    List<Enrollment> findByCourseId(String courseId);

    Optional<Enrollment> findByUserIdAndCourseId(String userId, String courseId);

    Boolean existsByUserIdAndCourseId(String userId, String courseId);
}
