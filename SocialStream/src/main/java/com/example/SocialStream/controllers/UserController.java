package com.example.SocialStream.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.SocialStream.DTO.PostResponseDTO;
import com.example.SocialStream.DTO.ProfilePictureUploadDTO;
import com.example.SocialStream.entities.User;
import com.example.SocialStream.services.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{userId}/posts")
    public ResponseEntity<List<PostResponseDTO>> getUserPosts(@PathVariable Long userId) {
        try {
            List<PostResponseDTO> userPosts = userService.getUserPosts(userId);
            return ResponseEntity.ok(userPosts);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Upload user profile picture
     * POST /api/users/profile-picture
     * Body: { "profilePictureUrl": "https://cloudinary.com/..." }
     */
    @PostMapping("/profile-picture")
    public ResponseEntity<?> uploadProfilePicture(
            @RequestBody ProfilePictureUploadDTO dto,
            Authentication authentication
    ) {
        try {
            // Validate input
            if (dto.getProfilePictureUrl() == null || dto.getProfilePictureUrl().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Profile picture URL is required"));
            }

            // Get current user from authentication
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not authenticated"));
            }

            // Get email from authentication principal
            String email = authentication.getName();
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid authentication token"));
            }

            User currentUser = userService.getUserByEmail(email);
            
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not authenticated"));
            }

            // Update profile picture
            User updatedUser = userService.uploadProfilePicture(
                currentUser.getId(), 
                dto.getProfilePictureUrl()
            );

            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile picture updated successfully");
            response.put("profilePictureUrl", updatedUser.getProfilePictureUrl());
            response.put("userId", updatedUser.getId());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to update profile picture: " + e.getMessage()));
        }
    }

    /**
     * Get user profile information
     * GET /api/users/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(Authentication authentication) {
        try {
            // Validate authentication
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not authenticated"));
            }

            // Get current user from authentication
            String email = authentication.getName();
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid authentication token"));
            }

            User currentUser = userService.getUserByEmail(email);
            
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not authenticated"));
            }

            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("userId", currentUser.getId());
            response.put("username", currentUser.getUsername());
            response.put("email", currentUser.getEmail());
            response.put("profilePictureUrl", currentUser.getProfilePictureUrl());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to fetch user profile: " + e.getMessage()));
        }
    }

    /**
     * Legacy endpoint - kept for backward compatibility
     * Use /profile-picture instead
     */
    @PostMapping("/uploadProfilePicture")
    @Deprecated
    public ResponseEntity<String> uploadProfilePictureLegacy(@RequestParam Long userId, @RequestParam String imageUrl) {
        try {
            userService.uploadProfilePicture(userId, imageUrl);
            return ResponseEntity.ok("Profile picture uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to upload profile picture");
        }
    }
}
