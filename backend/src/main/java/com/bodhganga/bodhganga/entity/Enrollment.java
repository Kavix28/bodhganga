package com.bodhganga.bodhganga.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "enrollments")
public class Enrollment {

    @Id
    private String id;

    private String userId;
    private String courseId;
    private Date enrolledAt;
    private String status; // ENROLLED, IN_PROGRESS, COMPLETED
    private Integer progress; // 0-100
    private Date completedAt;

    // Constructors
    public Enrollment() {}

    public Enrollment(String id, String userId, String courseId, Date enrolledAt, String status, Integer progress) {
        this.id = id;
        this.userId = userId;
        this.courseId = courseId;
        this.enrolledAt = enrolledAt;
        this.status = status;
        this.progress = progress;
    }

    // Manual Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public Date getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(Date enrolledAt) { this.enrolledAt = enrolledAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }

    public Date getCompletedAt() { return completedAt; }
    public void setCompletedAt(Date completedAt) { this.completedAt = completedAt; }

    // Static Builder Implementation
    public static class EnrollmentBuilder {
        private Enrollment enrollment = new Enrollment();
        public EnrollmentBuilder id(String id) { enrollment.setId(id); return this; }
        public EnrollmentBuilder userId(String userId) { enrollment.setUserId(userId); return this; }
        public EnrollmentBuilder courseId(String courseId) { enrollment.setCourseId(courseId); return this; }
        public EnrollmentBuilder enrolledAt(Date enrolledAt) { enrollment.setEnrolledAt(enrolledAt); return this; }
        public EnrollmentBuilder status(String status) { enrollment.setStatus(status); return this; }
        public EnrollmentBuilder progress(Integer progress) { enrollment.setProgress(progress); return this; }
        public Enrollment build() { return enrollment; }
    }

    public static EnrollmentBuilder builder() {
        return new EnrollmentBuilder();
    }
}
