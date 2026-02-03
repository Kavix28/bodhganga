package com.bodhganga.bodhganga.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}