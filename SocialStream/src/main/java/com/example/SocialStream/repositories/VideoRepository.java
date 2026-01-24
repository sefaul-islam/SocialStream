package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoRepository extends JpaRepository<Video,Long> {
    Optional<Video> findByTitle(String title);

    // Search videos by title containing the search pattern (case-insensitive)
    List<Video> findByTitleContainingIgnoreCase(String titlePattern);

    // Custom query for more advanced search patterns
    @Query("SELECT v FROM Video v WHERE LOWER(v.title) LIKE LOWER(CONCAT('%', :pattern, '%'))")
    List<Video> searchByTitlePattern(@Param("pattern") String pattern);
}
