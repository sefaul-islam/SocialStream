package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.PostResponseDTO;
import com.example.SocialStream.DTO.UserDTO;
import com.example.SocialStream.auth.CustomUserDetails;
import com.example.SocialStream.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
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

    @PatchMapping("/profile-picture")
    public ResponseEntity<UserDTO> updateProfilePicture(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> requestBody) {
        try {
            Long userId = userDetails.getUserId();
            String profilePictureUrl = requestBody.get("profilePictureUrl");
            
            if (profilePictureUrl == null || profilePictureUrl.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            UserDTO updatedUser = userService.updateProfilePicture(userId, profilePictureUrl);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
