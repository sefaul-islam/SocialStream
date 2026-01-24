package com.example.SocialStream.DTO;

import com.example.SocialStream.entities.Media;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter

@NoArgsConstructor
public class MediaDTO {
    private Long id;
    private String title;
    private String mediaUrl;
    private String thumbnailUrl;

    public MediaDTO(Media media){
        this.id = media.getId();
        this.title = media.getTitle();
        this.mediaUrl = media.getMediaurl();
        this.thumbnailUrl = media.getThumbnailurl();

    }


}
