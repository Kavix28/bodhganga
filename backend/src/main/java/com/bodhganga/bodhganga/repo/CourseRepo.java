package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Courses;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepo extends MongoRepository<Courses, String> {

    // Paginated category search
    Page<Courses> findByCourseCategory(String category, Pageable pageable);

    // Non-paginated (for internal use only — small result sets)
    List<Courses> findByCourseCategory(String category);

    List<Courses> findByInstructorName(String instructorName);
}
