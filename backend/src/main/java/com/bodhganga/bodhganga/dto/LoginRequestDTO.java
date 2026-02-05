package com.bodhganga.bodhganga.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class LoginRequestDTO {
    @NotBlank(message = "Email or phone is required")
    private String emailOrPhone;

    @NotBlank(message = "Password is required")
    private String password;
}
