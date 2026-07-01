package com.messapp.backend.dto.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RoomMemberDTO {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private String avatarUrl;
    private String role;
    private LocalDateTime joinedAt;
}
