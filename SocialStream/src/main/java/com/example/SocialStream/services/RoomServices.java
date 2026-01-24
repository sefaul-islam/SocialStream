package com.example.SocialStream.services;

import com.example.SocialStream.DTO.CreateRoomDTO;
import com.example.SocialStream.DTO.JoinRoomDTO;
import com.example.SocialStream.DTO.RoomDTO;
import com.example.SocialStream.entities.Room;
import com.example.SocialStream.entities.RoomMember;
import com.example.SocialStream.entities.User;
import com.example.SocialStream.exceptions.UserNotFoundException;
import com.example.SocialStream.repositories.RoomMemberRepository;
import com.example.SocialStream.repositories.RoomRepository;
import com.example.SocialStream.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomServices {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final PlaybackSyncService playbackSyncService;

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
}
