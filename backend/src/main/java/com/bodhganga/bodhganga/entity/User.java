package com.bodhganga.bodhganga.entity;

import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

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
    @JsonIgnore
    private String hashedPassword;
    private String role = "USER"; // USER, ADMIN
    private boolean isVerified = true;
    private boolean emailVerified = true;
    private boolean phoneVerified = true;
    private Boolean isActive = true;
    private Boolean forcePasswordReset = false;

    // Location
    private String city;
    private String state;
    private String country;

    // Optional Profile Fields
    private String profilePicture;
    private String qualification;

    private Date createdAt = new Date();
    private Date lastLogin;

    // Constructors
    public User() {}

    public User(String id, String name, String email, String hashedPassword, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.hashedPassword = hashedPassword;
        this.role = role;
    }

    // Manual Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Date getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(Date dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNo() { return phoneNo; }
    public void setPhoneNo(String phoneNo) { this.phoneNo = phoneNo; }

    public String getHashedPassword() { return hashedPassword; }
    public void setHashedPassword(String hashedPassword) { this.hashedPassword = hashedPassword; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isVerified() { return isVerified; }
    public void setVerified(boolean verified) { isVerified = verified; }

    public boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public boolean getPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public Boolean isActive() { return isActive; }
    public void setActive(Boolean active) { isActive = active; }

    public Boolean getForcePasswordReset() { return forcePasswordReset; }
    public void setForcePasswordReset(Boolean forcePasswordReset) { this.forcePasswordReset = forcePasswordReset; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getLastLogin() { return lastLogin; }
    public void setLastLogin(Date lastLogin) { this.lastLogin = lastLogin; }

    // Static Builder Implementation (Minimal for compatibility)
    public static class UserBuilder {
        private User user = new User();
        public UserBuilder id(String id) { user.setId(id); return this; }
        public UserBuilder name(String name) { user.setName(name); return this; }
        public UserBuilder email(String email) { user.setEmail(email); return this; }
        public UserBuilder phoneNo(String phoneNo) { user.setPhoneNo(phoneNo); return this; }
        public UserBuilder hashedPassword(String hashedPassword) { user.setHashedPassword(hashedPassword); return this; }
        public UserBuilder gender(String gender) { user.setGender(gender); return this; }
        public UserBuilder dateOfBirth(Date dateOfBirth) { user.setDateOfBirth(dateOfBirth); return this; }
        public UserBuilder city(String city) { user.setCity(city); return this; }
        public UserBuilder state(String state) { user.setState(state); return this; }
        public UserBuilder country(String country) { user.setCountry(country); return this; }
        public UserBuilder role(String role) { user.setRole(role); return this; }
        public UserBuilder isVerified(boolean isVerified) { user.setVerified(isVerified); return this; }
        public UserBuilder emailVerified(boolean emailVerified) { user.setEmailVerified(emailVerified); return this; }
        public UserBuilder phoneVerified(boolean phoneVerified) { user.setPhoneVerified(phoneVerified); return this; }
        public UserBuilder isActive(Boolean isActive) { user.setActive(isActive); return this; }
        public UserBuilder forcePasswordReset(Boolean forcePasswordReset) { user.setForcePasswordReset(forcePasswordReset); return this; }
        public UserBuilder createdAt(Date createdAt) { user.setCreatedAt(createdAt); return this; }
        public User build() { return user; }
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }
}
