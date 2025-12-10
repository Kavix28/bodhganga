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

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "courses")
public class Courses
{
    @Id
    @NonNull
    private String id; // publicly exposed uuid

    @Indexed(unique = true)
    @NonNull
    private String courseTitle;

    @NonNull
    public String description;

    @NotNull
    private String instructorName;

    @NotNull
    private String courseCategory;

    @NotNull
    private double courseDuration;

    @NotNull
    private double coursePrice;

    private String thumbnailUrl;
    private String language;
    private Integer totalLectures;
    private Double rating;
    private Integer enrolledStudents;
    private Date createdAt;
    private Date updatedAt;

}
