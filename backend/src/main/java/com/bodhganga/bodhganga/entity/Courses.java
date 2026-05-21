package com.bodhganga.bodhganga.entity;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Document(collection = "courses")
public class Courses {
    @Id
    private String id; // publicly exposed uuid

    @Indexed(unique = true)
    private String courseTitle;

    public String description;

    private String instructorName;

    @Indexed
    private String courseCategory;

    private double courseDuration;

    private double coursePrice;

    private String thumbnailUrl;
    private String language;
    private Integer totalLectures;
    private Double rating;
    private Integer enrolledStudents;
    private Date createdAt;
    private Date updatedAt;

    // Constructors
    public Courses() {}

    public Courses(String id, String courseTitle, String description, String instructorName, String courseCategory, double courseDuration, double coursePrice) {
        this.id = id;
        this.courseTitle = courseTitle;
        this.description = description;
        this.instructorName = instructorName;
        this.courseCategory = courseCategory;
        this.courseDuration = courseDuration;
        this.coursePrice = coursePrice;
    }

    // Manual Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }

    public String getCourseCategory() { return courseCategory; }
    public void setCourseCategory(String courseCategory) { this.courseCategory = courseCategory; }

    public double getCourseDuration() { return courseDuration; }
    public void setCourseDuration(double courseDuration) { this.courseDuration = courseDuration; }

    public double getCoursePrice() { return coursePrice; }
    public void setCoursePrice(double coursePrice) { this.coursePrice = coursePrice; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Integer getTotalLectures() { return totalLectures; }
    public void setTotalLectures(Integer totalLectures) { this.totalLectures = totalLectures; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Integer getEnrolledStudents() { return enrolledStudents; }
    public void setEnrolledStudents(Integer enrolledStudents) { this.enrolledStudents = enrolledStudents; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

    // Static Builder Implementation
    public static class CoursesBuilder {
        private Courses courses = new Courses();
        public CoursesBuilder id(String id) { courses.setId(id); return this; }
        public CoursesBuilder courseTitle(String courseTitle) { courses.setCourseTitle(courseTitle); return this; }
        public CoursesBuilder description(String description) { courses.setDescription(description); return this; }
        public Courses build() { return courses; }
    }

    public static CoursesBuilder builder() {
        return new CoursesBuilder();
    }
}
