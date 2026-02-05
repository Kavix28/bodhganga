package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Courses;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepo extends MongoRepository<Courses, String> {
    List<Courses> findByCourseCategory(String category);

    List<Courses> findByInstructorName(String instructorName);
}
