package com.bodhganga.bodhganga.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ApiResponseDTO {
    private boolean success;
    private String message;
    private Object data;

    // Constructors
    public ApiResponseDTO() {}

    public ApiResponseDTO(boolean success, String message, Object data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    // Manual Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }

    // Static Builder Implementation
    public static class ApiResponseDTOBuilder {
        private ApiResponseDTO dto = new ApiResponseDTO();
        public ApiResponseDTOBuilder success(boolean success) { dto.setSuccess(success); return this; }
        public ApiResponseDTOBuilder message(String message) { dto.setMessage(message); return this; }
        public ApiResponseDTOBuilder data(Object data) { dto.setData(data); return this; }
        public ApiResponseDTO build() { return dto; }
    }

    public static ApiResponseDTOBuilder builder() {
        return new ApiResponseDTOBuilder();
    }
}