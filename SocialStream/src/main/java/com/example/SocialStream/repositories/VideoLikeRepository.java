package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.VideoLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VideoLikeRepository extends JpaRepository<VideoLike, Long> {
    
    /**
     * Check if a user has already liked/disliked a video
     */
    boolean existsByVideoIdAndUserId(Long videoId, Long userId);
    
    /**
     * Find a specific like/dislike by video and user
     */
    Optional<VideoLike> findByVideoIdAndUserId(Long videoId, Long userId);
    
    /**
     * Count total likes for a video (isLiked = true)
     */
    long countByVideoIdAndIsLiked(Long videoId, Boolean isLiked);
    
    /**
     * Delete a like/dislike by video and user
     */
    void deleteByVideoIdAndUserId(Long videoId, Long userId);
    
    /**
     * Find all likes by a user
     */
    List<VideoLike> findByUserIdAndIsLiked(Long userId, Boolean isLiked);
    
    /**
     * Get all likes/dislikes for training the recommendation model
     */
    @Query("SELECT vl FROM VideoLike vl WHERE vl.createdAt >= :sinceDate")
    List<VideoLike> findAllSince(@Param("sinceDate") LocalDateTime sinceDate);
}
