package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.Room;
import com.example.SocialStream.entities.RoomQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomQueueRepository extends JpaRepository<RoomQueue, Long> {
    List<RoomQueue> findByRoomOrderByTotalVotesDescAddedAtAsc(Room room);
    
    List<RoomQueue> findByRoomIdOrderByTotalVotesDescAddedAtAsc(Long roomId);
    
    Optional<RoomQueue> findByRoomIdAndVideoId(Long roomId, Long videoId);
    
    boolean existsByRoomIdAndVideoId(Long roomId, Long videoId);
}
