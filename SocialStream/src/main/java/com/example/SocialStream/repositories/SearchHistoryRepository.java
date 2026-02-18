package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.SearchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    
    /**
     * Find all searches by a specific user
     */
    List<SearchHistory> findByUserId(Long userId);
    
    /**
     * Find recent searches by user ordered by timestamp
     */
    List<SearchHistory> findByUserIdOrderBySearchedAtDesc(Long userId);
    
    /**
     * Get user's search history within a date range
     */
    List<SearchHistory> findByUserIdAndSearchedAtBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get all searches for analyzing user interests
     */
    @Query("SELECT sh FROM SearchHistory sh WHERE sh.searchedAt >= :sinceDate")
    List<SearchHistory> findAllSince(@Param("sinceDate") LocalDateTime sinceDate);
    
    /**
     * Get most common search queries (for trending)
     */
    @Query("SELECT sh.query, COUNT(sh) as count FROM SearchHistory sh " +
           "WHERE sh.searchedAt >= :sinceDate " +
           "GROUP BY sh.query " +
           "ORDER BY count DESC")
    List<Object[]> findMostCommonQueries(@Param("sinceDate") LocalDateTime sinceDate);
}
