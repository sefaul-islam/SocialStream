package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember,Long> {
    Optional<RoomMember> findByRoomIdAndUserId(Long roomId, Long userId);
    
    List<RoomMember> findByRoomId(Long roomId);
    
    boolean existsByRoomIdAndUserId(Long roomId, Long userId);
}
