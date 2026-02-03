package com.bodhganga.bodhganga.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class SignupRequestDTO {
    @NotBlank(message = "Name is Required")
    private String name;

    @NotBlank(message = "Name is Required")
    @Email(message = "Invalid Email Format")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be 10 digits")
    private String phoneNo;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Country is required")
    private String country;

}
