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
    private String name;

    private String gender;

    private Date dateOfBirth;

    // Contact Information
    @Indexed(unique = true)
    private String email;

    @Indexed(unique = true)
    private String phoneNo;

    // Authentication
    private String hashedPassword;

    @Builder.Default
    private String role = "USER"; // USER, ADMIN

    @Builder.Default
    private Boolean isVerified = false;

    @Builder.Default
    private Boolean isActive = true;

    // Location
    private String city;

    private String state;

    private String country;

    // Optional Profile Fields (can be updated later)
    private String profilePicture;
    private String qualification;

    @Builder.Default
    private Date createdAt = new Date();

    private Date lastLogin;

    // Manual getters for Boolean fields (Lombok workaround)
    public Boolean isActive() {
        return this.isActive;
    }

    public Boolean isVerified() {
        return this.isVerified;
    }
}
