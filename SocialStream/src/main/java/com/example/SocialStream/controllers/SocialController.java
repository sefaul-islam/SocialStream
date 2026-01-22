package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.FriendReqResponseDTO;
import com.example.SocialStream.auth.CustomUserDetails;
import com.example.SocialStream.services.SocialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {
    private final SocialService socialService;

    @PostMapping("/send-friend-request")
    public ResponseEntity<String> sendFriendRequest(@AuthenticationPrincipal CustomUserDetails userDetails
            ,@RequestParam Long friendId){
        return ResponseEntity.status(HttpStatus.CREATED).body(socialService.
                sendFriendRequest(userDetails.getUserId(),friendId));
    }

    @GetMapping("/friend-requests")
    public ResponseEntity<List<FriendReqResponseDTO>> getFriendRequests(@AuthenticationPrincipal CustomUserDetails userDetails){
        return ResponseEntity.status(HttpStatus.OK).body(socialService.
                getFriendRequests(userDetails.getUserId()));
    }

    @PostMapping("/accept-friend-request")
    public ResponseEntity<String> acceptFriendRequest(@RequestParam Long friendshipId) {
        socialService.acceptFriendRequest(friendshipId);
        return ResponseEntity.status(HttpStatus.OK).body("Friend request accepted successfully");
    }

    @PostMapping("/reject-friend-request")
    public ResponseEntity<String> rejectFriendRequest(@RequestParam Long friendshipId) {
        socialService.rejectFriendRequest(friendshipId);
        return ResponseEntity.status(HttpStatus.OK).body("Friend request rejected successfully");
    }

    @GetMapping("/friendsuggestions")

    public ResponseEntity<List<FriendReqResponseDTO>> getFriendSuggestions(@AuthenticationPrincipal CustomUserDetails userDetails){
        return ResponseEntity.status(HttpStatus.OK).body(socialService.
                getFriendSuggestions(userDetails.getUserId()));
    }

    @GetMapping("/my-friends")
    public ResponseEntity<List<FriendReqResponseDTO>> getMyFriends(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.OK).body(socialService.
                getMyFriends(userDetails.getUserId()));
    }
}
