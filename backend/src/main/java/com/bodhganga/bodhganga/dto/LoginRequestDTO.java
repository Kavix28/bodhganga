package com.bodhganga.bodhganga.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class LoginRequestDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}