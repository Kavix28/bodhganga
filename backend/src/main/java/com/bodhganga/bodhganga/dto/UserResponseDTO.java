package com.bodhganga.bodhganga.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

public class UserResponseDTO {
    private String id;
    private String name;
    private String email;
    private String phoneNo;
    private String city;
    private String state;
    private String country;
    private String role;
    private String profilePicture;
    private String qualification;
    private Boolean forcePasswordReset;

    // Constructors
    public UserResponseDTO() {}

    public UserResponseDTO(String id, String name, String email, String phoneNo, String city, String state, String country, String role, String profilePicture, String qualification) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phoneNo = phoneNo;
        this.city = city;
        this.state = state;
        this.country = country;
        this.role = role;
        this.profilePicture = profilePicture;
        this.qualification = qualification;
    }

    // Manual Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNo() { return phoneNo; }
    public void setPhoneNo(String phoneNo) { this.phoneNo = phoneNo; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public Boolean getForcePasswordReset() { return forcePasswordReset; }
    public void setForcePasswordReset(Boolean forcePasswordReset) { this.forcePasswordReset = forcePasswordReset; }

    // Static Builder Implementation
    public static class UserResponseDTOBuilder {
        private UserResponseDTO dto = new UserResponseDTO();
        public UserResponseDTOBuilder id(String id) { dto.setId(id); return this; }
        public UserResponseDTOBuilder name(String name) { dto.setName(name); return this; }
        public UserResponseDTOBuilder email(String email) { dto.setEmail(email); return this; }
        public UserResponseDTOBuilder phoneNo(String phoneNo) { dto.setPhoneNo(phoneNo); return this; }
        public UserResponseDTOBuilder city(String city) { dto.setCity(city); return this; }
        public UserResponseDTOBuilder state(String state) { dto.setState(state); return this; }
        public UserResponseDTOBuilder country(String country) { dto.setCountry(country); return this; }
        public UserResponseDTOBuilder role(String role) { dto.setRole(role); return this; }
        public UserResponseDTOBuilder profilePicture(String profilePicture) { dto.setProfilePicture(profilePicture); return this; }
        public UserResponseDTOBuilder qualification(String qualification) { dto.setQualification(qualification); return this; }
        public UserResponseDTOBuilder forcePasswordReset(Boolean forcePasswordReset) { dto.setForcePasswordReset(forcePasswordReset); return this; }
        public UserResponseDTO build() { return dto; }
    }

    public static UserResponseDTOBuilder builder() {
        return new UserResponseDTOBuilder();
    }
}