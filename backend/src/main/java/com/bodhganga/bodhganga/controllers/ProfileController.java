package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.dto.UserResponseDTO;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepo userRepo;

    /**
     * GET /api/profile
     * View current user's profile
     */
    @GetMapping
    public ResponseEntity<ApiResponseDTO> getProfile(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserResponseDTO userResponse = mapToUserResponse(user);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Profile retrieved successfully")
                .data(userResponse)
                .build());
    }

    /**
     * PUT /api/profile/settings/update
     * Update user profile settings
     */
    @PutMapping("/settings/update")
    public ResponseEntity<ApiResponseDTO> updateProfile(
            @RequestBody Map<String, Object> updates,
            Authentication authentication) {

        String userEmail = authentication.getName();
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update allowed fields
        if (updates.containsKey("name")) {
            user.setName((String) updates.get("name"));
        }
        if (updates.containsKey("city")) {
            user.setCity((String) updates.get("city"));
        }
        if (updates.containsKey("state")) {
            user.setState((String) updates.get("state"));
        }
        if (updates.containsKey("country")) {
            user.setCountry((String) updates.get("country"));
        }
        if (updates.containsKey("qualification")) {
            user.setQualification((String) updates.get("qualification"));
        }
        if (updates.containsKey("profilePicture")) {
            user.setProfilePicture((String) updates.get("profilePicture"));
        }

        User updatedUser = userRepo.save(user);
        UserResponseDTO userResponse = mapToUserResponse(updatedUser);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Profile updated successfully")
                .data(userResponse)
                .build());
    }

    /**
     * GET /api/profile/settings
     * Get profile settings page data
     */
    @GetMapping("/settings")
    public ResponseEntity<ApiResponseDTO> getSettings(Authentication authentication) {
        return getProfile(authentication);
    }

    /**
     * Helper method to convert User to UserResponseDTO
     */
    private UserResponseDTO mapToUserResponse(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phoneNo(user.getPhoneNo())
                .city(user.getCity())
                .state(user.getState())
                .country(user.getCountry())
                .role(user.getRole())
                .profilePicture(user.getProfilePicture())
                .qualification(user.getQualification())
                .build();
    }
}
