package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.RoomQueue;
import com.example.SocialStream.entities.User;
import com.example.SocialStream.entities.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByUserAndQueueItem(User user, RoomQueue queueItem);
    
    boolean existsByUserIdAndQueueItemId(Long userId, Long queueItemId);
    
    long countByQueueItemId(Long queueItemId);
    
    void deleteByUserIdAndQueueItemId(Long userId, Long queueItemId);
}
