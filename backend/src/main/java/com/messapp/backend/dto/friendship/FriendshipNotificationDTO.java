package com.messapp.backend.dto.friendship;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FriendshipNotificationDTO {

    public enum NotificationType {
        FRIEND_REQUEST,
        FRIEND_ACCEPTED,
        FRIEND_DECLINED,
        FRIEND_BLOCKED,
        FRIEND_UNBLOCKED
    }

    private Long friendshipId;
    private NotificationType type;
    private Long senderId;
    private String senderUsername;
    private String senderFullName;
    private String senderAvatarUrl;
    private Long receiverId;
    private String receiverUsername;
    private String receiverFullName;
    private String receiverAvatarUrl;
    private LocalDateTime timestamp;
}
