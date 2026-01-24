package com.example.SocialStream.DTO;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateVideoDTO {
    @NotBlank(message = "Media URL is required")
    private String mediaUrl;

    private String thumbnailUrl;

    @Min(value = 1, message = "Duration must be at least 1 second")
    private int durationInSeconds;

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String director;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @DecimalMin(value = "1.0", message = "Rating must be between 1.0 and 10.0")
    @DecimalMax(value = "10.0", message = "Rating must be between 1.0 and 10.0")
    private BigDecimal rating;

    private String cast; // Comma-separated cast members

    private String year;
}
