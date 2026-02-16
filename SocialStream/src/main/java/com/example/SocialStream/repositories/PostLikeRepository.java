package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    
    /**
     * Check if a user has already liked a post
     */
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    
    /**
     * Find a specific like by post and user
     */
    Optional<PostLike> findByPostIdAndUserId(Long postId, Long userId);
    
    /**
     * Count total likes for a post
     */
    long countByPostId(Long postId);
    
    /**
     * Delete a like by post and user
     */
    void deleteByPostIdAndUserId(Long postId, Long userId);
}