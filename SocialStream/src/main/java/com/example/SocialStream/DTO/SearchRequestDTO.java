package com.example.SocialStream.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SearchRequestDTO {
    
    @NotBlank(message = "Search query is required")
    @Size(max = 500, message = "Search query must not exceed 500 characters")
    private String query;
}
