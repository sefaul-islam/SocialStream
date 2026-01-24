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
    private Status status;
    private LocalDateTime createdAt;

    public RoomDTO(Room roomDTO ){
        this.id = roomDTO.getId();
        this.roomName = roomDTO.getName();
        this.hostName = roomDTO.getHostId().getUsername();
        this.status = roomDTO.getStatus();
        this.createdAt = roomDTO.getCreatedAt();


    }
}
