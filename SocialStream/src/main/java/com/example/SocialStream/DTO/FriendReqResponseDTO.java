package com.example.SocialStream.DTO;

import com.example.SocialStream.entities.Friendship;

import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Getter
public class FriendReqResponseDTO {
    private Long friendshipId;
    private Long requestSenderId;
    private String requestSenderUsername;

    public FriendReqResponseDTO(Friendship friendship){
        this.friendshipId = friendship.getId();
        this.requestSenderId = friendship.getRequester().getId();
        this.requestSenderUsername = friendship.getRequester().getUsername();
    }
}
