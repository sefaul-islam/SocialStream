package com.example.SocialStream.controllers;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

import com.example.SocialStream.DTO.JoinRoomDTO;
import com.example.SocialStream.entities.RoomMember;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import com.example.SocialStream.DTO.CreateRoomDTO;
import com.example.SocialStream.DTO.RoomDTO;
import com.example.SocialStream.auth.CustomUserDetails;
import com.example.SocialStream.services.RoomServices;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomServices roomServices;

    @PostMapping("/createroom")
    public ResponseEntity<RoomDTO> createRoom(@RequestBody CreateRoomDTO createRoomDTO,@AuthenticationPrincipal CustomUserDetails userDetails){

        System.out.println("Creating room for user ID: " + userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(roomServices.createRoom(createRoomDTO, userDetails.getUserId()));
    }

    @GetMapping("/getroom")
    public ResponseEntity<List<RoomDTO>> getRoom(@RequestParam(required = false,defaultValue = "1") int pagenumber,
                                                 @RequestParam(required = false, defaultValue = "5") int pagesize,
                                                 @RequestParam(required = false,defaultValue = "id") String sortBy,
                                                 @RequestParam(required = false, defaultValue = "ASC") String sortDir,
                                                 @RequestParam(required = false) String filterBy){

        Sort sort =null;
        if(sortDir.equalsIgnoreCase("ASC")){
            sort = Sort.by(sortBy).ascending();
        } else {
            sort = Sort.by(sortBy).descending();
        }

        return ResponseEntity.status(HttpStatus.OK).body(roomServices.getRoom(PageRequest.
                of(pagenumber-1,pagesize,sort), filterBy));
    }

    @PostMapping("/joinroom")
    public ResponseEntity<String> joinRoom(@RequestParam Long roomId,@RequestBody JoinRoomDTO joinRoomDTO, @AuthenticationPrincipal CustomUserDetails userDetails){
        roomServices.joinRoom( roomId,joinRoomDTO, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.OK).body("Joined room successfully");
    }

    @GetMapping("/{roomId}/members")
    public ResponseEntity<List<RoomMember>> getRoomMembers(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<RoomMember> members = roomServices.getRoomMembers(roomId);
        return ResponseEntity.ok(members);
    }

    @GetMapping("/{roomId}/is-member")
    public ResponseEntity<Map<String, Boolean>> checkMembership(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        boolean isMember = roomServices.isUserMember(roomId, userDetails.getUserId());
        Map<String, Boolean> response = new HashMap<>();
        response.put("isMember", isMember);
        return ResponseEntity.ok(response);
    }
}
