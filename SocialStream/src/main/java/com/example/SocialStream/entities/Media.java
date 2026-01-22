package com.example.SocialStream.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "media_type", discriminatorType = DiscriminatorType.STRING)
public class Media {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    private String mediaurl;
    private String thumbnailurl;
    private int duration; //in seconds
    private String title;
    private LocalDateTime uploadedAt;



}
