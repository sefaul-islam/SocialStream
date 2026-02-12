package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface FriendRepository extends JpaRepository<Friendship,Long> {
    @Query("SELECT F FROM Friendship F WHERE F.receiver.id = :receiverId AND F.status = 'PENDING'")
    java.util.List<Friendship> findPendingRequestsByReceiverId(Long receiverId);

    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
           "((f.requester.id = :userId AND f.receiver.id = :friendId) OR " +
           " (f.requester.id = :friendId AND f.receiver.id = :userId)) " +
           "AND f.status = 'ACCEPTED'")
    boolean areFriends(Long userId, Long friendId);

}