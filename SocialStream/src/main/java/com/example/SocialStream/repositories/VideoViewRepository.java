package com.example.SocialStream.repositories;

import com.example.SocialStream.entities.VideoView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VideoViewRepository extends JpaRepository<VideoView, Long> {

    @Query("SELECT vv FROM VideoView vv WHERE vv.user.id = :userId AND vv.video.id = :videoId AND vv.viewedAt >= :since")
    Optional<VideoView> findRecentView(@Param("userId") Long userId, @Param("videoId") Long videoId, @Param("since") LocalDateTime since);

    @Query("SELECT vv FROM VideoView vv WHERE vv.user.id = :userId ORDER BY vv.viewedAt DESC")
    List<VideoView> findByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(vv) FROM VideoView vv WHERE vv.video.id = :videoId")
    Long countByVideoId(@Param("videoId") Long videoId);
}
