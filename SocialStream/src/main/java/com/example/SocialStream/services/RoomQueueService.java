package com.example.SocialStream.services;

import com.example.SocialStream.entities.*;
import com.example.SocialStream.repositories.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RoomQueueService {

    private final RoomQueueRepository roomQueueRepository;
    private final VoteRepository voteRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomRepository roomRepository;
    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Add a video to the room queue
     */
    @Transactional
    public RoomQueue addToQueue(Long roomId, Long videoId, Long userId) {
        // Validate user is a member of the room
        RoomMember member = roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this room"));

        // Check if video already exists in queue
        if (roomQueueRepository.existsByRoomIdAndVideoId(roomId, videoId)) {
            throw new RuntimeException("Video already exists in queue");
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Video not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get next position
        List<RoomQueue> existingQueue = roomQueueRepository.findByRoomIdOrderByTotalVotesDescAddedAtAsc(roomId);
        int nextPosition = existingQueue.size() + 1;

        RoomQueue queueItem = new RoomQueue();
        queueItem.setRoom(room);
        queueItem.setVideo(video);
        queueItem.setAddedBy(user);
        queueItem.setPosition(nextPosition);
        queueItem.setTotalVotes(0);
        queueItem.setAddedAt(LocalDateTime.now());

        RoomQueue saved = roomQueueRepository.save(queueItem);
        
        // Broadcast queue update to all room members
        broadcastQueueUpdate(roomId, "QUEUE_UPDATED");
        
        return saved;
    }

    /**
     * Remove a video from the queue (Host only)
     */
    @Transactional
    public void removeFromQueue(Long queueId, Long userId) {
        RoomQueue queueItem = roomQueueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue item not found"));

        // Validate user is host or admin
        RoomMember member = roomMemberRepository.findByRoomIdAndUserId(queueItem.getRoom().getId(), userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this room"));

        if (member.getRole() != RoomMember.Role.HOST && member.getRole() != RoomMember.Role.ADMIN) {
            throw new RuntimeException("Only host or admin can remove items from queue");
        }

        Long roomId = queueItem.getRoom().getId();
        roomQueueRepository.delete(queueItem);
        
        // Broadcast queue update to all room members
        broadcastQueueUpdate(roomId, "QUEUE_UPDATED");
    }

    /**
     * Toggle vote on a queue item
     */
    @Transactional
    public RoomQueue toggleVote(Long queueId, Long userId) {
        RoomQueue queueItem = roomQueueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue item not found"));

        // Validate user is a member
        RoomMember member = roomMemberRepository.findByRoomIdAndUserId(queueItem.getRoom().getId(), userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this room"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user already voted
        if (voteRepository.existsByUserIdAndQueueItemId(userId, queueId)) {
            // Remove vote
            voteRepository.deleteByUserIdAndQueueItemId(userId, queueId);
            queueItem.setTotalVotes(queueItem.getTotalVotes() - 1);
        } else {
            // Add vote
            Vote vote = new Vote();
            vote.setUser(user);
            vote.setQueueItem(queueItem);
            vote.setVotedAt(LocalDateTime.now());
            voteRepository.save(vote);
            queueItem.setTotalVotes(queueItem.getTotalVotes() + 1);
        }

        RoomQueue saved = roomQueueRepository.save(queueItem);
        
        // Broadcast queue update to all room members
        broadcastQueueUpdate(queueItem.getRoom().getId(), "QUEUE_UPDATED");
        
        return saved;
    }

    /**
     * Get queue for a room (ordered by votes DESC, then addedAt ASC)
     */
    public List<RoomQueue> getQueue(Long roomId, Long userId) {
        // Validate user is a member
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new RuntimeException("User is not a member of this room");
        }

        return roomQueueRepository.findByRoomIdOrderByTotalVotesDescAddedAtAsc(roomId);
    }

    /**
     * Check if user has voted on a queue item
     */
    public boolean hasUserVoted(Long queueId, Long userId) {
        return voteRepository.existsByUserIdAndQueueItemId(userId, queueId);
    }

    /**
     * Broadcast queue update to all room members via WebSocket
     */
    private void broadcastQueueUpdate(Long roomId, String action) {
        Map<String, Object> message = new HashMap<>();
        message.put("action", action);
        message.put("timestamp", LocalDateTime.now().toString());
        
        messagingTemplate.convertAndSend("/topic/room/" + roomId, (Object) message);
    }
}
