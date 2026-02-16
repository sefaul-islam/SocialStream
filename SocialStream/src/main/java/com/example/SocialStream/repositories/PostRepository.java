package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByUserId(Long userId);

    /**
     * Find posts created by friends of the specified user
     * Uses a subquery to identify all accepted friendships (bidirectional)
     * @param userId The ID of the current user
     * @return List of posts created by user's friends, ordered by upload date descending
     */
    @Query("SELECT p FROM Post p WHERE p.user.id IN (" +
           "  SELECT CASE " +
           "    WHEN f.requester.id = :userId THEN f.receiver.id " +
           "    ELSE f.requester.id " +
           "  END " +
           "  FROM Friendship f " +
           "  WHERE (f.requester.id = :userId OR f.receiver.id = :userId) " +
           "  AND f.status = 'ACCEPTED'" +
           ") ORDER BY p.uploadedAt DESC")
    List<Post> findFriendsPosts(@Param("userId") Long userId);
}
