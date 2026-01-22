package com.example.SocialStream.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "admins")
public class Admin {
    @Id
    private Long adminId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "admin_Id")
    private User user;

    @Column(name = "created_at")
    private LocalDateTime creatingDate;
}
