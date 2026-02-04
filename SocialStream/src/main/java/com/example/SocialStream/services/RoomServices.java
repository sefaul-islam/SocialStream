package com.example.SocialStream.services;

import com.example.SocialStream.DTO.CreateRoomDTO;
import com.example.SocialStream.DTO.JoinRoomDTO;
import com.example.SocialStream.DTO.RoomDTO;
import com.example.SocialStream.DTO.RoomStateDTO;
import com.example.SocialStream.entities.Room;
import com.example.SocialStream.entities.RoomMember;
import com.example.SocialStream.entities.User;
import com.example.SocialStream.exceptions.UserNotFoundException;
import com.example.SocialStream.repositories.RoomMemberRepository;
import com.example.SocialStream.repositories.RoomRepository;
import com.example.SocialStream.repositories.UserRepository;
import com.example.SocialStream.repositories.RoomQueueRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class RoomServices {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final PlaybackSyncService playbackSyncService;
    private final RedisRoomStateService redisRoomStateService;
    private final RoomQueueRepository roomQueueRepository;
    private RoomQueueService roomQueueService;
    
    public RoomServices(
            RoomRepository roomRepository,
            UserRepository userRepository,
            RoomMemberRepository roomMemberRepository,
            PlaybackSyncService playbackSyncService,
            RedisRoomStateService redisRoomStateService,
            RoomQueueRepository roomQueueRepository,
            @Lazy RoomQueueService roomQueueService) {
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.playbackSyncService = playbackSyncService;
        this.redisRoomStateService = redisRoomStateService;
        this.roomQueueRepository = roomQueueRepository;
        this.roomQueueService = roomQueueService;
    }

    public RoomDTO createRoom(CreateRoomDTO createRoomDTO, Long userId) {
        User  user =  userRepository.findById(userId).
                orElseThrow(()-> new UserNotFoundException("User with id "+ userId+" not found"));
          Room room = new Room();
            room.setName(createRoomDTO.getRoomName());
            room.setHostId(user);
            room.setCreatedAt(LocalDateTime.now());
            room.setInviteLink(generateRoomInviteLink());
            roomRepository.save(room);
            
            // Initialize room state for synchronized playback
            playbackSyncService.initializeRoomState(room.getId());
            
            RoomMember roomMember = new RoomMember();
            roomMember.setRoom(room);
            roomMember.setUser(user);
            roomMember.setJoinedAt(LocalDateTime.now());
            roomMember.setRole(RoomMember.Role.HOST);
            roomMemberRepository.save(roomMember);
            return new RoomDTO(room);
    }

    public List<RoomDTO> getRoom(Pageable pageable, String filterBy) {
        if(filterBy ==null || filterBy.isEmpty()){
            return roomRepository.findAll(pageable)
                    .map(RoomDTO::new)
                    .getContent();
        }else{
            return roomRepository.findByNameContainingIgnoreCase(filterBy,pageable)
                    .map(RoomDTO::new)
                    .getContent();
        }

    }

    public void joinRoom(Long roomId, JoinRoomDTO joinRoomDTO, Long userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room with id " + roomId + " not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User with id " + userId + " not found"));
        
        // Check if user is already a member (host or previously joined)
        if (roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            // User is already a member, no need to validate invite link
            return;
        }
        
        // For new members, validate invite link
        if (joinRoomDTO.getInviteLink() == null || !room.getInviteLink().equals(joinRoomDTO.getInviteLink())) {
            throw new RuntimeException("Invalid invite link");
        }
        
        // Add user as a new member
        RoomMember roomMember = new RoomMember();
        roomMember.setRoom(room);
        roomMember.setUser(user);
        roomMember.setJoinedAt(LocalDateTime.now());
        roomMemberRepository.save(roomMember);
    }


    public String generateRoomInviteLink(){
        return RandomStringUtils.randomAlphanumeric(10);
    }

    /**
     * Get room members
     */
    public List<RoomMember> getRoomMembers(Long roomId) {
        return roomMemberRepository.findByRoomId(roomId);
    }

    /**
     * Check if user is a member of a room
     */
    public boolean isUserMember(Long roomId, Long userId) {
        return roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
    }
    
    /**
     * Get complete room state (playback + queue) for user entering room
     */
    public RoomStateDTO getRoomState(Long roomId, Long userId) {
        // Validate user is a member
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new RuntimeException("User is not a member of this room");
        }
        
        // Validate room exists
        roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        
        // Initialize Redis queue from database if not already initialized
        roomQueueService.initializeRedisQueue(roomId);
        
        // Get playback state from Redis
        var redisState = redisRoomStateService.getRoomState(roomId);
        
        RoomStateDTO state = new RoomStateDTO();
        state.setRoomId(roomId);
        state.setCurrentVideoId(redisRoomStateService.getCurrentVideoId(roomId));
        state.setPlaybackPosition(redisRoomStateService.getPlaybackPosition(roomId));
        state.setIsPlaying(redisRoomStateService.isPlaying(roomId));
        state.setLastSyncTimestamp((String) redisState.get("lastSyncTimestamp"));
        
        // Get queue with real-time votes from Redis
        state.setQueue(roomQueueService.getQueue(roomId, userId));
        
        return state;
    }
    
    /**
     * Close room and persist Redis data to database
     */
    public void closeRoom(Long roomId, Long userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        
        // Only host can close room
        if (!room.getHostId().getId().equals(userId)) {
            throw new RuntimeException("Only host can close the room");
        }
        
        // Persist Redis votes to database before closing
        roomQueueService.persistVotesToDatabase(roomId);
        
        // Clean up Redis state
        redisRoomStateService.deleteRoomState(roomId);
        
        // Optionally delete room from database (or just mark as inactive)
        // roomRepository.delete(room);
    }
}
