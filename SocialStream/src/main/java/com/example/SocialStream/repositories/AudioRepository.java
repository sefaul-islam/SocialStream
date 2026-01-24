package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.Audio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AudioRepository extends JpaRepository <Audio,Long>{

    Optional<Audio> findByTitle(String title);
}
