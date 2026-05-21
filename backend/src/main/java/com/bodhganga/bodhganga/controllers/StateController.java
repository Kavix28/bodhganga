package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.repo.StateRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/states")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class StateController {

    private final StateRepo stateRepo;

    public StateController(StateRepo stateRepo) {
        this.stateRepo = stateRepo;
    }

    /**
     * GET /api/states
     * Get all states and UTs
     */
    @GetMapping
    public ResponseEntity<ApiResponseDTO> getAllStates() {
        List<State> states = stateRepo.findAll();
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("States retrieved successfully")
                .data(states)
                .build());
    }

    /**
     * GET /api/states/type/{type}
     * Get states by type (STATE or UT)
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponseDTO> getByType(@PathVariable String type) {
        List<State> states = stateRepo.findByType(type.toUpperCase());
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("States of type " + type + " retrieved")
                .data(states)
                .build());
    }

    /**
     * GET /api/states/{id}
     * Get state by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> getById(@PathVariable String id) {
        return stateRepo.findById(id)
                .map(state -> ResponseEntity.ok(ApiResponseDTO.builder()
                        .success(true)
                        .message("State retrieved")
                        .data(state)
                        .build()))
                .orElse(ResponseEntity.status(404).body(ApiResponseDTO.builder()
                        .success(false)
                        .message("State not found")
                        .build()));
    }

    /**
     * GET /api/states/code/{code}
     * Get state by state code (e.g. MH, DL)
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponseDTO> getByCode(@PathVariable String code) {
        return stateRepo.findByCode(code.toUpperCase())
                .map(state -> ResponseEntity.ok(ApiResponseDTO.builder()
                        .success(true)
                        .message("State retrieved")
                        .data(state)
                        .build()))
                .orElse(ResponseEntity.status(404).body(ApiResponseDTO.builder()
                        .success(false)
                        .message("State not found with code: " + code)
                        .build()));
    }

    /**
     * POST /api/states
     * Create or update a state (admin only)
     */
    @PostMapping
    public ResponseEntity<ApiResponseDTO> createState(@RequestBody State state) {
        if (state.getCreatedAt() == null) {
            state.setCreatedAt(new Date());
        }
        // Auto-generate ID from name if not set
        if (state.getId() == null || state.getId().isEmpty()) {
            state.setId(state.getName().toLowerCase()
                    .replaceAll("[^a-z0-9\\s]", "")
                    .replaceAll("\\s+", "-"));
        }
        State saved = stateRepo.save(state);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("State created successfully")
                .data(saved)
                .build());
    }

    /**
     * PUT /api/states/{id}
     * Update a state (admin only)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> updateState(@PathVariable String id, @RequestBody State state) {
        if (!stateRepo.existsById(id)) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("State not found")
                    .build());
        }
        state.setId(id);
        state.setUpdatedAt(new Date());
        State updated = stateRepo.save(state);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("State updated successfully")
                .data(updated)
                .build());
    }

    /**
     * DELETE /api/states/{id}
     * Delete a state (admin only)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> deleteState(@PathVariable String id) {
        if (!stateRepo.existsById(id)) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("State not found")
                    .build());
        }
        stateRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("State deleted successfully")
                .build());
    }
}
