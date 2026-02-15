package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    /**
     * Find chat messages by room with pagination, ordered by sent time descending
     */
    Page<ChatMessage> findByRoomIdOrderBySentAtDesc(Long roomId, Pageable pageable);
    
    /**
     * Find recent messages by room (last 50 messages)
     */
    List<ChatMessage> findTop50ByRoomIdOrderBySentAtDesc(Long roomId);
    
    /**
     * Find messages by room and sender with pagination
     */
    Page<ChatMessage> findByRoomIdAndSenderIdOrderBySentAtDesc(Long roomId, Long senderId, Pageable pageable);
}
