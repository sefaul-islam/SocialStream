package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.Comments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comments, Long> {
    List<Comments> findByPostIdOrderByCreatedAtDesc(Long postId);
}