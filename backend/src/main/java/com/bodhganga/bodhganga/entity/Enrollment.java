package com.bodhganga.bodhganga.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}
