package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.VideoView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VideoViewRepository extends JpaRepository<VideoView, Long> {
    
    /**
     * Find all views by a specific user
     */
    List<VideoView> findByUserId(Long userId);
    
    /**
     * Find all views for a specific video
     */
    List<VideoView> findByVideoId(Long videoId);
    
    /**
     * Count views for a specific video
     */
    long countByVideoId(Long videoId);
    
    /**
     * Find recent views by user (for recommendations)
     */
    List<VideoView> findByUserIdOrderByViewedAtDesc(Long userId);
    
    /**
     * Get user's watch history within a date range
     */
    List<VideoView> findByUserIdAndViewedAtBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get all views for training the recommendation model
     */
    @Query("SELECT vv FROM VideoView vv WHERE vv.viewedAt >= :sinceDate")
    List<VideoView> findAllSince(@Param("sinceDate") LocalDateTime sinceDate);
}
