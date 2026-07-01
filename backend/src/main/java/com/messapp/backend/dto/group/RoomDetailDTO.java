package com.messapp.backend.dto.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RoomDetailDTO {
    private Long id;
    private String name;
    private String type;
    private LocalDateTime createdAt;
    private List<RoomMemberDTO> members;
}
