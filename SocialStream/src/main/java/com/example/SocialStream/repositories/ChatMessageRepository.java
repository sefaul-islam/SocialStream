package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    /**
     * Find chat messages by room with pagination, ordered by sent time descending
     */
    Page<ChatMessage> findByRoomIdOrderBySentAtDesc(Long roomId, Pageable pageable);
    
    /**
     * Find chat messages by room with efficient JOIN FETCH to avoid N+1 problem
     * Fetches room and sender in a single query
     */
    @Query("SELECT cm FROM ChatMessage cm " +
           "JOIN FETCH cm.sender " +
           "JOIN FETCH cm.room " +
           "WHERE cm.room.id = :roomId " +
           "ORDER BY cm.sentAt DESC")
    Page<ChatMessage> findByRoomIdWithSenderAndRoom(@Param("roomId") Long roomId, Pageable pageable);
    
    /**
     * Find recent messages by room (last 50 messages) with JOIN FETCH
     */
    @Query("SELECT cm FROM ChatMessage cm " +
           "JOIN FETCH cm.sender " +
           "JOIN FETCH cm.room " +
           "WHERE cm.room.id = :roomId " +
           "ORDER BY cm.sentAt DESC")
    List<ChatMessage> findTop50ByRoomIdWithSender(@Param("roomId") Long roomId, Pageable pageable);
    
    /**
     * Find messages by room and sender with pagination
     */
    Page<ChatMessage> findByRoomIdAndSenderIdOrderBySentAtDesc(Long roomId, Long senderId, Pageable pageable);
}
