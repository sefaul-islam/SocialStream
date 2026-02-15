package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository  extends JpaRepository<Room,Long> {
    Page<Room> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    /**
     * Find rooms created by the user or their friends (ACCEPTED friendships)
     * @param userId The ID of the current user
     * @param pageable Pagination parameters
     * @return Page of rooms created by user or friends
     */
    @Query("SELECT r FROM Room r WHERE r.hostId.id = :userId " +
           "OR EXISTS (" +
           "  SELECT f FROM Friendship f " +
           "  WHERE f.status = 'ACCEPTED' " +
           "  AND ((f.requester.id = :userId AND f.receiver.id = r.hostId.id) " +
           "       OR (f.receiver.id = :userId AND f.requester.id = r.hostId.id))" +
           ")")
    Page<Room> findRoomsByUserAndFriends(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * Find rooms created by the user or their friends with name filtering
     * @param userId The ID of the current user
     * @param name The name filter (case-insensitive partial match)
     * @param pageable Pagination parameters
     * @return Page of filtered rooms created by user or friends
     */
    @Query("SELECT r FROM Room r WHERE " +
           "(r.hostId.id = :userId " +
           "OR EXISTS (" +
           "  SELECT f FROM Friendship f " +
           "  WHERE f.status = 'ACCEPTED' " +
           "  AND ((f.requester.id = :userId AND f.receiver.id = r.hostId.id) " +
           "       OR (f.receiver.id = :userId AND f.requester.id = r.hostId.id))" +
           ")) " +
           "AND LOWER(r.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Room> findRoomsByUserAndFriendsAndNameContaining(
        @Param("userId") Long userId, 
        @Param("name") String name, 
        Pageable pageable
    );
}
