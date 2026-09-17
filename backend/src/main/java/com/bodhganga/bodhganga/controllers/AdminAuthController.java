package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/auth/otp")
public class AdminAuthController {

    private final AuthService authService;

    public AdminAuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/request")
    public ResponseEntity<ApiResponseDTO> adminOtpRequest(@RequestBody Map<String, String> body) {
        String phoneNo = body != null ? body.get("phoneNo") : null;
        ApiResponseDTO response = authService.adminOtpRequest(phoneNo);
        HttpStatus status = response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return new ResponseEntity<>(response, status);
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponseDTO> adminOtpVerify(@RequestBody Map<String, String> body) {
        String phoneNo = body != null ? body.get("phoneNo") : null;
        String accessToken = body != null ? body.get("accessToken") : null;
        if (accessToken == null && body != null) {
            accessToken = body.get("otp");
        }
        ApiResponseDTO response = authService.adminOtpVerify(phoneNo, accessToken);
        HttpStatus status = response.isSuccess() ? HttpStatus.OK : HttpStatus.UNAUTHORIZED;
        return new ResponseEntity<>(response, status);
    }
}
