package com.example.SocialStream.entities;

import com.example.SocialStream.enums.Reaction;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "OnetoOneMessages")
public class DirectMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User sender;
    @ManyToOne(fetch = FetchType.LAZY)
    private User recipient;
    private String content;
    private LocalDateTime sendTime;
    @Enumerated(EnumType.STRING)
    private Reaction reaction;



}
