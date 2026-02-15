package com.example.SocialStream.services;

import com.example.SocialStream.DTO.ChatMessageDTO;
import com.example.SocialStream.DTO.SendRoomMessageDTO;
import com.example.SocialStream.entities.ChatMessage;
import com.example.SocialStream.entities.Room;
import com.example.SocialStream.entities.User;
import com.example.SocialStream.enums.Reaction;
import com.example.SocialStream.exceptions.InvalidOperationException;
import com.example.SocialStream.exceptions.UserNotFoundException;
import com.example.SocialStream.repositories.ChatMessageRepository;
import com.example.SocialStream.repositories.RoomMemberRepository;
import com.example.SocialStream.repositories.RoomRepository;
import com.example.SocialStream.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatMessageService {
    private final ChatMessageRepository chatMessageRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomMemberRepository roomMemberRepository;

    /**
     * Send a message to a room
     */
    @Transactional
    public ChatMessageDTO sendMessage(Long senderId, Long roomId, SendRoomMessageDTO dto) {
        // Validate room membership
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, senderId)) {
            throw new InvalidOperationException("You must be a member of the room to send messages");
        }

        // Get room and sender
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new InvalidOperationException("Room not found with id: " + roomId));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + senderId));

        // Create message
        ChatMessage message = new ChatMessage();
        message.setRoom(room);
        message.setSender(sender);
        message.setMessage(dto.getMessage());
        message.setSentAt(LocalDateTime.now());

        // Save and return
        ChatMessage saved = chatMessageRepository.save(message);
        return new ChatMessageDTO(saved);
    }

    /**
     * Add a reaction to a chat message
     */
    @Transactional
    public ChatMessageDTO addReaction(Long messageId, Long userId, Reaction reaction) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new InvalidOperationException("Message not found with id: " + messageId));

        // Validate that the user is a member of the room
        if (!roomMemberRepository.existsByRoomIdAndUserId(message.getRoom().getId(), userId)) {
            throw new InvalidOperationException("You must be a member of the room to react to messages");
        }

        // Update reaction
        message.setReaction(reaction);
        ChatMessage saved = chatMessageRepository.save(message);
        return new ChatMessageDTO(saved);
    }

    /**
     * Get room messages with pagination
     */
    public Page<ChatMessageDTO> getRoomMessages(Long roomId, Long userId, int page, int size) {
        // Validate room membership
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new InvalidOperationException("You must be a member of the room to view messages");
        }

        Pageable pageable = PageRequest.of(page, size);
        return chatMessageRepository.findByRoomIdOrderBySentAtDesc(roomId, pageable)
                .map(ChatMessageDTO::new);
    }

    /**
     * Get recent room messages (last 50)
     */
    public List<ChatMessageDTO> getRecentRoomMessages(Long roomId, Long userId) {
        // Validate room membership
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new InvalidOperationException("You must be a member of the room to view messages");
        }

        return chatMessageRepository.findTop50ByRoomIdOrderBySentAtDesc(roomId)
                .stream()
                .map(ChatMessageDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Get a single message by ID
     */
    public ChatMessage getMessage(Long messageId) {
        return chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new InvalidOperationException("Message not found with id: " + messageId));
    }
}
