package com.example.SocialStream.entities;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.*;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@DiscriminatorValue("AUDIO")
public class Audio extends Media {

    private String artist;
    private String genre;
    private long streamCount;
}
