package com.messapp.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "rooms")
@Data
public class Room {
    public enum Role {ADMIN, MEMBER}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Role role = Role.MEMBER;

    private LocalDateTime joinedAt = LocalDateTime.now();
}