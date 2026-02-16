package com.example.SocialStream.services;

import com.example.SocialStream.DTO.CommentRequestDTO;
import com.example.SocialStream.DTO.CommentResponseDTO;
import com.example.SocialStream.DTO.PostRequestDTO;
import com.example.SocialStream.DTO.PostResponseDTO;
import com.example.SocialStream.entities.Comments;
import com.example.SocialStream.entities.Media;
import com.example.SocialStream.entities.Post;
import com.example.SocialStream.entities.PostLike;
import com.example.SocialStream.entities.User;
import com.example.SocialStream.exceptions.UserNotFoundException;
import com.example.SocialStream.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NewsFeedService {
    private final MediaRepository mediaRepository;
    private final AudioRepository audioRepository;
    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final PostRepository postrepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;

    public PostResponseDTO createPostAudio(PostRequestDTO requestDTO,  Long audioId, Long userId) {

        Post post = new Post();
        post.setDescription(requestDTO.getDescription());
        post.setUploadedAt(LocalDateTime.now());
        post.setUser(userRepository.findById(userId).orElseThrow(()->new UserNotFoundException("User not found with id: "+userId)));
        Media audio  = audioRepository.findById(audioId).orElseThrow(()->new RuntimeException("Media not found with id: "+audioId));
        post.setMedia(audio);
        postrepository.save(post);

        return new PostResponseDTO(post);
    }

    public PostResponseDTO createPostVideo(PostRequestDTO requestDTO, Long videoId, Long userId) {

        Post post = new Post();
        post.setDescription(requestDTO.getDescription());
        post.setUploadedAt(LocalDateTime.now());
        post.setUser(userRepository.findById(userId).orElseThrow(()->new UserNotFoundException("User not found with id: "+userId)));
        Media video = videoRepository.findById(videoId).orElseThrow(()->new RuntimeException("Video not found with id: "+videoId));
        post.setMedia(video);
        postrepository.save(post);

        return new PostResponseDTO(post);
    }

    /**
     * Get posts created by the user's friends
     * Returns posts from all accepted friendships, ordered by upload date
     * @param userId The ID of the current user
     * @return List of PostResponseDTO containing friend posts
     */
    public List<PostResponseDTO> getFriendsPosts(Long userId) {
        // Verify user exists
        userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        
        // Fetch posts from friends and convert to DTOs
        return postrepository.findFriendsPosts(userId)
            .stream()
            .map(PostResponseDTO::new)
            .collect(Collectors.toList());
    }

    /**
     * Toggle like on a post (like if not liked, unlike if already liked)
     * @param postId The ID of the post
     * @param userId The ID of the user liking/unliking
     * @return Updated PostResponseDTO with liked status
     */
    @Transactional
    public PostResponseDTO toggleLikePost(Long postId, Long userId) {
        Post post = postrepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        
        // Check if user already liked this post
        boolean alreadyLiked = postLikeRepository.existsByPostIdAndUserId(postId, userId);
        
        if (alreadyLiked) {
            // Unlike: Remove the like
            postLikeRepository.deleteByPostIdAndUserId(postId, userId);
            post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
        } else {
            // Like: Add new like
            PostLike postLike = new PostLike();
            postLike.setPost(post);
            postLike.setUser(user);
            postLike.setCreatedAt(LocalDateTime.now());
            postLikeRepository.save(postLike);
            post.setLikesCount(post.getLikesCount() + 1);
        }
        
        postrepository.save(post);
        return new PostResponseDTO(post);
    }

    /**
     * Add a like to a post (if not already liked)
     * @param postId The ID of the post
     * @param userId The ID of the user liking
     * @return Updated PostResponseDTO
     */
    @Transactional
    public PostResponseDTO addLike(Long postId, Long userId) {
        Post post = postrepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        
        // Check if user already liked this post
        if (postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            throw new RuntimeException("User has already liked this post");
        }
        
        // Create new like
        PostLike postLike = new PostLike();
        postLike.setPost(post);
        postLike.setUser(user);
        postLike.setCreatedAt(LocalDateTime.now());
        postLikeRepository.save(postLike);
        
        // Update like count
        post.setLikesCount(post.getLikesCount() + 1);
        postrepository.save(post);
        
        return new PostResponseDTO(post);
    }

    /**
     * Remove a like from a post
     * @param postId The ID of the post
     * @param userId The ID of the user unliking
     * @return Updated PostResponseDTO
     */
    @Transactional
    public PostResponseDTO removeLike(Long postId, Long userId) {
        Post post = postrepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
        
        userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        
        // Check if user has liked this post
        if (!postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            throw new RuntimeException("User has not liked this post");
        }
        
        // Remove the like
        postLikeRepository.deleteByPostIdAndUserId(postId, userId);
        
        // Update like count
        post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
        postrepository.save(post);
        
        return new PostResponseDTO(post);
    }

    /**
     * Check if user has liked a post
     * @param postId The ID of the post
     * @param userId The ID of the user
     * @return true if user has liked the post
     */
    public boolean hasUserLikedPost(Long postId, Long userId) {
        return postLikeRepository.existsByPostIdAndUserId(postId, userId);
    }

    /**
     * Add a comment to a post
     * @param postId The ID of the post
     * @param userId The ID of the user commenting
     * @param commentRequest The comment content
     * @return The created CommentResponseDTO
     */
    @Transactional
    public CommentResponseDTO addComment(Long postId, Long userId, CommentRequestDTO commentRequest) {
        Post post = postrepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        
        Comments comment = new Comments();
        comment.setContent(commentRequest.getContent());
        comment.setPost(post);
        comment.setUser(user);
        comment.setCreatedAt(LocalDateTime.now());
        
        commentRepository.save(comment);
        
        return new CommentResponseDTO(comment);
    }

}
