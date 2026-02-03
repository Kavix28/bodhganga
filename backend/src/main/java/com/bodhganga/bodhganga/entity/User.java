package com.bodhganga.bodhganga.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {

    @Id
    private String id;

    // Basic Profile Information
    @NonNull
    private String Name;

    @NonNull
    private String gender;

    @NonNull
    private Date dateOfBirth;

    // Contact Information
    @Indexed(unique = true)
    @NonNull
    private String email;

    @Indexed(unique = true)
    @NonNull
    private String phoneNo;

    // Authentication
    @NonNull
    private String hashedPassword;

    @Builder.Default
    private String role = "USER"; // USER, ADMIN

    @Builder.Default
    private Boolean isVerified = false;

    @Builder.Default
    private Boolean isActive = true;

    // Location
    @NonNull
    private String city;

    @NonNull
    private String state;

    @NonNull
    private String country;

    // Optional Profile Fields (can be updated later)
    private String profilePicture;
    private String qualification;

    // Timestamps
    @Builder.Default
    private Date createdAt = new Date();

    private Date lastLogin;
}
