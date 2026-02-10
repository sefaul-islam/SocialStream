package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    
}
