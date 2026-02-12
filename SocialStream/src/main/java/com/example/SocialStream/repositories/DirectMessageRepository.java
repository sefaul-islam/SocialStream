package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.DirectMessage;
import com.example.SocialStream.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    @Query("SELECT m FROM DirectMessage m WHERE " +
            "(m.sender = :user1 AND m.recipient = :user2) OR " +
            "(m.sender = :user2 AND m.recipient = :user1) " +
            "ORDER BY m.sendTime DESC")
    Page<DirectMessage> findConversation(
            @Param("user1") User user1,
            @Param("user2") User user2,
            Pageable pageable
    );

    @Query("SELECT m FROM DirectMessage m WHERE " +
            "(m.sender.id = :userId OR m.recipient.id = :userId) " +
            "AND m.id IN (" +
            "  SELECT MAX(m2.id) FROM DirectMessage m2 " +
            "  WHERE (m2.sender.id = :userId OR m2.recipient.id = :userId) " +
            "  GROUP BY CASE " +
            "    WHEN m2.sender.id = :userId THEN m2.recipient.id " +
            "    ELSE m2.sender.id " +
            "  END" +
            ") " +
            "ORDER BY m.sendTime DESC")
    java.util.List<DirectMessage> findLatestMessagesByUserId(@Param("userId") Long userId);
}
