package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Courses;
import com.bodhganga.bodhganga.entity.Enrollment;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.CourseRepo;
import com.bodhganga.bodhganga.repo.EnrollmentRepo;
import com.bodhganga.bodhganga.repo.UserRepo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "http://localhost:5173")
public class CourseController {

    private final CourseRepo courseRepo;
    private final EnrollmentRepo enrollmentRepo;
    private final UserRepo userRepo;

    public CourseController(CourseRepo courseRepo, EnrollmentRepo enrollmentRepo, UserRepo userRepo) {
        this.courseRepo = courseRepo;
        this.enrollmentRepo = enrollmentRepo;
        this.userRepo = userRepo;
    }

    /**
     * GET /api/courses/list?page=0&size=12&sort=createdAt
     * Get all available courses with pagination (PUBLIC)
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponseDTO> getAllCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sort) {

        size = Math.min(size, 50); // cap at 50 per page
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sort));
        Page<Courses> coursePage = courseRepo.findAll(pageable);

        Map<String, Object> data = new HashMap<>();
        data.put("courses", coursePage.getContent());
        data.put("totalElements", coursePage.getTotalElements());
        data.put("totalPages", coursePage.getTotalPages());
        data.put("currentPage", page);
        data.put("pageSize", size);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Courses retrieved successfully")
                .data(data)
                .build());
    }

    /**
     * GET /api/courses/{id}
     * Get single course details (PUBLIC - no auth required)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> getCourseById(@PathVariable String id) {
        Optional<Courses> course = courseRepo.findById(id);

        if (course.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Course not found")
                    .build());
        }

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Course details retrieved")
                .data(course.get())
                .build());
    }

    /**
     * POST /api/courses/enroll/{courseId}
     * Enroll in a course (PROTECTED - auth required)
     */
    @PostMapping("/enroll/{courseId}")
    public ResponseEntity<ApiResponseDTO> enrollInCourse(
            @PathVariable String courseId,
            Authentication authentication) {

        String userEmail = authentication.getName();
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if course exists
        Optional<Courses> course = courseRepo.findById(courseId);
        if (course.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Course not found")
                    .build());
        }

        // Check if already enrolled
        if (enrollmentRepo.existsByUserIdAndCourseId(user.getId(), courseId)) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Already enrolled in this course")
                    .build());
        }

        // Create enrollment
        Enrollment enrollment = Enrollment.builder()
                .userId(user.getId())
                .courseId(courseId)
                .enrolledAt(new Date())
                .status("ENROLLED")
                .progress(0)
                .build();

        enrollmentRepo.save(enrollment);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Successfully enrolled in course")
                .data(enrollment)
                .build());
    }

    /**
     * GET /api/courses/my-courses
     * Get user's enrolled courses (PROTECTED - auth required)
     */
    @GetMapping("/my-courses")
    public ResponseEntity<ApiResponseDTO> getMyCourses(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all enrollments for the user
        List<Enrollment> enrollments = enrollmentRepo.findByUserId(user.getId());

        // Get course details for each enrollment
        List<Courses> enrolledCourses = enrollments.stream()
                .map(enrollment -> courseRepo.findById(enrollment.getCourseId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Enrolled courses retrieved")
                .data(enrolledCourses)
                .build());
    }

    /**
     * GET /api/courses/category/{category}
     * Get courses by category (PUBLIC)
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponseDTO> getCoursesByCategory(@PathVariable String category) {
        List<Courses> courses = courseRepo.findByCourseCategory(category);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Courses in category: " + category)
                .data(courses)
                .build());
    }
}
