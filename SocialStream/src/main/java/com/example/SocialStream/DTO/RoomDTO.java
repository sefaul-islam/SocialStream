package com.example.SocialStream.DTO;

import com.example.SocialStream.entities.Room;
import com.example.SocialStream.enums.Status;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class RoomDTO {
    private Long id;
    private String roomName;
    private String hostName;
    private Long hostId;
    private String inviteLink;
    private Status status;
    private LocalDateTime createdAt;

    // Original constructor for backward compatibility
    public RoomDTO(Room roomDTO ){
        this.id = roomDTO.getId();
        this.roomName = roomDTO.getName();
        this.hostName = roomDTO.getHostId().getUsername();
        this.hostId = roomDTO.getHostId().getId();
        this.status = roomDTO.getStatus();
        this.createdAt = roomDTO.getCreatedAt();
    }
    
    // Enhanced constructor with conditional invite link
    public RoomDTO(Room roomDTO, boolean includeInviteLink){
        this.id = roomDTO.getId();
        this.roomName = roomDTO.getName();
        this.hostName = roomDTO.getHostId().getUsername();
        this.hostId = roomDTO.getHostId().getId();
        this.inviteLink = includeInviteLink ? roomDTO.getInviteLink() : null;
        this.status = roomDTO.getStatus();
        this.createdAt = roomDTO.getCreatedAt();
    }
}
