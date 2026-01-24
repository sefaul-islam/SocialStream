package com.example.SocialStream.services;

import com.example.SocialStream.DTO.FriendReqResponseDTO;
import com.example.SocialStream.entities.Friendship;
import com.example.SocialStream.entities.User;
import com.example.SocialStream.enums.FriendshipStatus;
import com.example.SocialStream.repositories.FriendRepository;
import com.example.SocialStream.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SocialService {
    private final UserRepository userRepository;
    private final FriendRepository friendRepository;

    @Transactional
    public String sendFriendRequest(Long userId,Long friendId){
        User reqsender = userRepository.findById(userId)
                .orElseThrow(()-> new RuntimeException("User not found with id: "+userId));
        User reqReceiver = userRepository.findById(friendId)
                .orElseThrow(()-> new RuntimeException("User not found with id: "+friendId));
        Friendship friendship = new Friendship();
        friendship.setRequester(reqsender);
        friendship.setReceiver(reqReceiver);
        friendship.setStatus(FriendshipStatus.PENDING);
        friendship.setCreatedAt(LocalDateTime.now());
        friendRepository.save(friendship);
        return "Friend request sent successfully";
    }

    @Transactional
    public void acceptFriendRequest(Long friendshipId){
        Friendship friendship = friendRepository.findById(friendshipId)
                .orElseThrow(()-> new RuntimeException("Friendship not found with id: "+friendshipId));
        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendRepository.save(friendship);
    }
    @Transactional
    public void rejectFriendRequest(Long friendshipId){
        Friendship friendship = friendRepository.findById(friendshipId)
                .orElseThrow(()-> new RuntimeException("Friendship not found with id: "+friendshipId));
        friendship.setStatus(FriendshipStatus.DECLINED);
        friendRepository.save(friendship);
    }
    public List<FriendReqResponseDTO> getFriendRequests(Long receiverId){
        List<Friendship> friendrequests = friendRepository.findPendingRequestsByReceiverId(receiverId);

        return friendrequests.stream()
                .map(FriendReqResponseDTO::new)
                .toList();
    }
    public List<FriendReqResponseDTO> getFriendSuggestions(Long userId){
        List<User> allUsers = userRepository.findAll();
        List<Friendship> existingFriendships = friendRepository.findAll();

        return allUsers.stream()
                .filter(user -> !user.getId().equals(userId)) // Exclude self
                .filter(user -> existingFriendships.stream()
                        .noneMatch(f -> (f.getRequester().getId().equals(userId) && f.getReceiver().getId().equals(user.getId())) ||
                                (f.getReceiver().getId().equals(userId) && f.getRequester().getId().equals(user.getId()))
                        )) // Exclude existing friendships
                .map(user -> {
                    Friendship dummyFriendship = new Friendship();
                    dummyFriendship.setRequester(user); // Set the suggested user as requester so DTO shows their info
                    dummyFriendship.setReceiver(userRepository.findById(userId).orElse(null));
                    return new FriendReqResponseDTO(dummyFriendship);
                })
                .toList();
    }
    public List<FriendReqResponseDTO> getMyFriends(Long userId){
        List<Friendship> friendships = friendRepository.findAll().stream()
                .filter(f -> (f.getRequester().getId().equals(userId) || f.getReceiver().getId().equals(userId))
                        && f.getStatus() == FriendshipStatus.ACCEPTED)
                .toList();

        return friendships.stream()
                .map(f -> {
                    User friend = f.getRequester().getId().equals(userId) ? f.getReceiver() : f.getRequester();
                    Friendship dummyFriendship = new Friendship();
                    dummyFriendship.setRequester(friend); // Set friend as requester so DTO shows friend's info
                    dummyFriendship.setReceiver(userRepository.findById(userId).orElse(null));
                    return new FriendReqResponseDTO(dummyFriendship);
                })
                .toList();
    }
}
