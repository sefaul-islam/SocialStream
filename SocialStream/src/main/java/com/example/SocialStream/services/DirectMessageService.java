package com.example.SocialStream.services;

import com.example.SocialStream.DTO.ConversationSummaryDTO;
import com.example.SocialStream.DTO.DirectMessageDTO;
import com.example.SocialStream.DTO.SendMessageRequestDTO;
import com.example.SocialStream.entities.DirectMessage;
import com.example.SocialStream.entities.User;
import com.example.SocialStream.enums.Reaction;
import com.example.SocialStream.exceptions.InvalidOperationException;
import com.example.SocialStream.exceptions.UserNotFoundException;
import com.example.SocialStream.repositories.DirectMessageRepository;
import com.example.SocialStream.repositories.FriendRepository;
import com.example.SocialStream.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DirectMessageService {
     private final DirectMessageRepository directMessageRepository;
     private final UserRepository userRepository;
     private final FriendRepository friendRepository;

     public Page<DirectMessageDTO> getChatHistory(User currentUser, User chatPartner, int pageNo, int pageSize) {
         Pageable pageable = PageRequest.of(pageNo, pageSize);

         return directMessageRepository.findConversation(currentUser, chatPartner, pageable)
                 .map(DirectMessageDTO::new);
     }

     public Page<DirectMessageDTO> getChatHistoryByIds(Long currentUserId, Long chatPartnerId, int pageNo, int pageSize) {
         User currentUser = userRepository.findById(currentUserId)
                 .orElseThrow(() -> new UserNotFoundException("User not found with id: " + currentUserId));
         User chatPartner = userRepository.findById(chatPartnerId)
                 .orElseThrow(() -> new UserNotFoundException("User not found with id: " + chatPartnerId));

         return getChatHistory(currentUser, chatPartner, pageNo, pageSize);
     }

     @Transactional
     public DirectMessageDTO sendMessage(Long senderId, SendMessageRequestDTO dto) {
         // Validate friendship
         if (!friendRepository.areFriends(senderId, dto.getRecipientId())) {
             throw new InvalidOperationException("You can only send messages to friends");
         }

         // Get users
         User sender = userRepository.findById(senderId)
                 .orElseThrow(() -> new UserNotFoundException("Sender not found with id: " + senderId));
         User recipient = userRepository.findById(dto.getRecipientId())
                 .orElseThrow(() -> new UserNotFoundException("Recipient not found with id: " + dto.getRecipientId()));

         // Create message
         DirectMessage message = new DirectMessage();
         message.setSender(sender);
         message.setRecipient(recipient);
         message.setContent(dto.getContent());
         message.setSendTime(LocalDateTime.now());

         // Save and return
         DirectMessage saved = directMessageRepository.save(message);
         return new DirectMessageDTO(saved);
     }

     @Transactional
     public DirectMessageDTO addReaction(Long messageId, Long userId, Reaction reaction) {
         DirectMessage message = directMessageRepository.findById(messageId)
                 .orElseThrow(() -> new InvalidOperationException("Message not found with id: " + messageId));

         // Validate that the user is part of the conversation
         if (!message.getSender().getId().equals(userId) && !message.getRecipient().getId().equals(userId)) {
             throw new InvalidOperationException("You can only react to messages you're part of");
         }

         // Update reaction
         message.setReaction(reaction);
         DirectMessage saved = directMessageRepository.save(message);
         return new DirectMessageDTO(saved);
     }

     public List<ConversationSummaryDTO> getConversations(Long userId) {
         // Get latest message for each conversation using optimized query
         List<DirectMessage> latestMessages = directMessageRepository.findLatestMessagesByUserId(userId);

         // Create conversation summaries
         List<ConversationSummaryDTO> summaries = new ArrayList<>();
         for (DirectMessage message : latestMessages) {
             User partner = message.getSender().getId().equals(userId) 
                     ? message.getRecipient() 
                     : message.getSender();

             ConversationSummaryDTO summary = new ConversationSummaryDTO(
                     partner.getId(),
                     partner.getUsername(),
                     partner.getProfilePictureUrl(),
                     message.getContent(),
                     message.getSendTime(),
                     0 // unreadCount - can be implemented later
             );
             summaries.add(summary);
         }

         return summaries;
     }

     public DirectMessage getMessage(Long messageId) {
         DirectMessage directMessage = directMessageRepository.findById(messageId).orElseThrow(() -> new InvalidOperationException("Message not found with id: " + messageId));
         return directMessage;
     }
}
