package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.AudioResponseDTO;
import com.example.SocialStream.DTO.CommentRequestDTO;
import com.example.SocialStream.DTO.CommentResponseDTO;
import com.example.SocialStream.DTO.PostRequestDTO;
import com.example.SocialStream.DTO.PostResponseDTO;
import com.example.SocialStream.DTO.VideoResponseDTO;
import com.example.SocialStream.auth.CustomUserDetails;
import com.example.SocialStream.entities.Audio;
import com.example.SocialStream.entities.Video;
import com.example.SocialStream.repositories.AudioRepository;
import com.example.SocialStream.repositories.VideoRepository;
import com.example.SocialStream.services.NewsFeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/newsfeed")
public class NewsFeedController {

    private final NewsFeedService newsFeedService;
    private final AudioRepository audioRepository;
    private final VideoRepository videoRepository;

    @PostMapping("/createposts")
    public ResponseEntity<PostResponseDTO> createPost(@RequestBody PostRequestDTO requestDTO, @RequestParam Long mediaId,
                                                      @RequestParam Long userId) {

        return ResponseEntity.status(HttpStatus.CREATED).body(newsFeedService.createPostAudio(requestDTO,mediaId,userId));
    }

    @PostMapping("/createvideoposts")
    public ResponseEntity<PostResponseDTO> createVideoPost(@RequestBody PostRequestDTO requestDTO, @RequestParam Long mediaId,
                                                          @RequestParam Long userId) {

        return ResponseEntity.status(HttpStatus.CREATED).body(newsFeedService.createPostVideo(requestDTO,mediaId,userId));
    }

    @GetMapping("getaudiourl")
    public ResponseEntity<AudioResponseDTO> getAudioUrl(@RequestParam String title){
        Audio audio = audioRepository.findByTitle(title).orElseThrow(()->new RuntimeException("Audio not found with title: "+title));
        AudioResponseDTO audioResponseDTO = new AudioResponseDTO(audio);
        return ResponseEntity.status(HttpStatus.OK).body(audioResponseDTO);
    }

    @GetMapping("getvideourl")
    public ResponseEntity<VideoResponseDTO> geVideoUrl(@RequestParam String title){
        Video video = videoRepository.findByTitle(title).orElseThrow(()->new RuntimeException("Audio not found with title: "+title));
        VideoResponseDTO videoResponseDTO = new VideoResponseDTO(video);
        return ResponseEntity.status(HttpStatus.OK).body(videoResponseDTO);
    }

    /**
     * Get posts from user's friends
     * Fetches all posts created by users with accepted friendship status
     * @param userDetails Authenticated user details from JWT token
     * @return List of posts from friends, ordered by upload date descending
     */
    @GetMapping("/friends-posts")
    public ResponseEntity<List<PostResponseDTO>> getFriendsPosts(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userId = userDetails.getUserId();
            List<PostResponseDTO> friendsPosts = newsFeedService.getFriendsPosts(userId);
            return ResponseEntity.ok(friendsPosts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Toggle like on a post (like if not liked, unlike if already liked)
     * @param postId The ID of the post to like/unlike
     * @param userDetails Authenticated user details from JWT token
     * @return Updated post with new like count
     */
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<PostResponseDTO> toggleLikePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userId = userDetails.getUserId();
            PostResponseDTO updatedPost = newsFeedService.toggleLikePost(postId, userId);
            return ResponseEntity.ok(updatedPost);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Add a like to a post (if not already liked)
     * @param postId The ID of the post to like
     * @param userDetails Authenticated user details from JWT token
     * @return Updated post with new like count
     */
    @PostMapping("/posts/{postId}/like/add")
    public ResponseEntity<PostResponseDTO> addLike(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userId = userDetails.getUserId();
            PostResponseDTO updatedPost = newsFeedService.addLike(postId, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(updatedPost);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Remove a like from a post
     * @param postId The ID of the post to unlike
     * @param userDetails Authenticated user details from JWT token
     * @return Updated post with new like count
     */
    @DeleteMapping("/posts/{postId}/like")
    public ResponseEntity<PostResponseDTO> removeLike(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userId = userDetails.getUserId();
            PostResponseDTO updatedPost = newsFeedService.removeLike(postId, userId);
            return ResponseEntity.ok(updatedPost);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Check if user has liked a post
     * @param postId The ID of the post
     * @param userDetails Authenticated user details from JWT token
     * @return Boolean indicating if user has liked the post
     */
    @GetMapping("/posts/{postId}/like/status")
    public ResponseEntity<Boolean> getLikeStatus(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userId = userDetails.getUserId();
            boolean hasLiked = newsFeedService.hasUserLikedPost(postId, userId);
            return ResponseEntity.ok(hasLiked);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Add a comment to a post
     * @param postId The ID of the post to comment on
     * @param commentRequest The comment content
     * @param userDetails Authenticated user details from JWT token
     * @return The created comment
     */
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentResponseDTO> addComment(
            @PathVariable Long postId,
            @RequestBody CommentRequestDTO commentRequest,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userId = userDetails.getUserId();
            CommentResponseDTO comment = newsFeedService.addComment(postId, userId, commentRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
