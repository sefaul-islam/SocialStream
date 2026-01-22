package com.example.SocialStream.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@DiscriminatorValue("VIDEO")
public class Video extends Media{
    private String director;
    private String year;
    private long viewCount=0;
    @Column(length = 1000)
    private String description;
    @DecimalMin("1.0")
    @DecimalMax("10.0")
    @Column(precision = 3, scale = 1)
    private BigDecimal rating;

    @Column(columnDefinition = "TEXT")
    private String cast;
}
