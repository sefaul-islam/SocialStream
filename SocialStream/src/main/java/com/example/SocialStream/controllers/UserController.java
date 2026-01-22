package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.PostResponseDTO;
import com.example.SocialStream.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
