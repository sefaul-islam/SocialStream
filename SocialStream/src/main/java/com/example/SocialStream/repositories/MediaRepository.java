package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MediaRepository extends JpaRepository<Media,Long> {
}
