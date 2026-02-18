package com.example.SocialStream.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "search_history",
    indexes = {
        @Index(name = "idx_user_search_timestamp", columnList = "user_id,searched_at")
    })
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SearchHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "query", nullable = false, length = 500)
    private String query;
    
    @Column(name = "searched_at", nullable = false)
    private LocalDateTime searchedAt;
}
