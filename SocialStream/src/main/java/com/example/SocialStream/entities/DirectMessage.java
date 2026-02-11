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
@Table(name = "OnetoOneMessages",indexes ={
        @Index(name = "idx_message_sender_recipient_time",columnList = "sender_id,recipient_id,send_time")
})
public class DirectMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false, updatable = false)
    private User sender;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false, updatable = false)
    private User recipient;

    private String content;
    @Column(name = "send_time", nullable = false, updatable = false)
    private LocalDateTime sendTime;
    @Enumerated(EnumType.STRING)
    private Reaction reaction;



}
