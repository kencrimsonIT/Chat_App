package com.messapp.backend.realtime;

import com.messapp.backend.dto.friendship.FriendshipNotificationDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketHandler {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Send a friendship notification to a specific user.
     * The client subscribes to: /topic/friendship/{userId}
     *
     * @param targetUserId the ID of the user who should receive the notification
     * @param notification the notification payload
     */
    public void sendFriendshipNotification(Long targetUserId, FriendshipNotificationDTO notification) {
        messagingTemplate.convertAndSend(
                "/topic/friendship/" + targetUserId,
                notification
        );
    }
}
