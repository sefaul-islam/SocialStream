package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.Room;
import com.example.SocialStream.entities.RoomState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomStateRepository extends JpaRepository<RoomState, Long> {
    Optional<RoomState> findByRoomId(Long roomId);
    
    Optional<RoomState> findByRoom(Room room);
}
