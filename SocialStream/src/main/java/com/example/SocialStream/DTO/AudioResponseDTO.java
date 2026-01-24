package com.example.SocialStream.DTO;

import com.example.SocialStream.entities.Audio;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class AudioResponseDTO {
    private Long id;
    private String mediaUrl;
    private String thumbnailUrl;
    private int durationInSeconds;
    private String title;
    private LocalDateTime uploadedAt;
    private String artist;
    private String genre;
    private long streamCount;

    public AudioResponseDTO(Audio audio){
        this.id=audio.getId();
        this.mediaUrl=audio.getMediaurl();
        this.thumbnailUrl=audio.getThumbnailurl();
        this.durationInSeconds=audio.getDuration();
        this.title=audio.getTitle();
        this.uploadedAt=audio.getUploadedAt();
        this.artist=audio.getArtist();
        this.genre=audio.getGenre();
        this.streamCount=audio.getStreamCount();
    }


}
