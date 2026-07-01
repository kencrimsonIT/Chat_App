package com.messapp.backend.controller;

import com.messapp.backend.dto.friendship.FriendRequestDTO;
import com.messapp.backend.dto.friendship.FriendshipNotificationDTO;
import com.messapp.backend.entity.Friendship;
import com.messapp.backend.entity.User;
import com.messapp.backend.realtime.WebSocketHandler;
import com.messapp.backend.service.FriendshipService;
import com.messapp.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/friendships")
public class FriendshipController {

    @Autowired
    private FriendshipService friendshipService;

    @Autowired
    private UserService userService;

    @Autowired
    private WebSocketHandler webSocketHandler;

    // ─── Send a friend request ───────────────────────────────────────────
    @PostMapping("/send")
    public ResponseEntity<Friendship> sendFriendRequest(@RequestBody FriendRequestDTO request) {
        User sender = getAuthenticatedUser();
        Friendship friendship = friendshipService.sendFriendRequest(sender.getId(), request.getReceiverId());

        // Push real-time notification to the receiver
        FriendshipNotificationDTO notification = buildNotification(
                friendship,
                FriendshipNotificationDTO.NotificationType.FRIEND_REQUEST
        );
        webSocketHandler.sendFriendshipNotification(friendship.getReceiver().getId(), notification);

        return ResponseEntity.ok(friendship);
    }

    // ─── Accept a friend request ─────────────────────────────────────────
    @PutMapping("/{id}/accept")
    public ResponseEntity<Friendship> acceptFriendRequest(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        Friendship friendship = friendshipService.acceptFriendRequest(id);

        // Verify the current user is the receiver of this request
        if (!friendship.getReceiver().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }

        // Notify the original sender that their request was accepted
        FriendshipNotificationDTO notification = buildNotification(
                friendship,
                FriendshipNotificationDTO.NotificationType.FRIEND_ACCEPTED
        );
        webSocketHandler.sendFriendshipNotification(friendship.getSender().getId(), notification);

        return ResponseEntity.ok(friendship);
    }

    // ─── Decline a friend request ────────────────────────────────────────
    @PutMapping("/{id}/decline")
    public ResponseEntity<Friendship> declineFriendRequest(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        Friendship friendship = friendshipService.declineFriendRequest(id, currentUser.getId());

        // Notify the original sender that their request was declined
        FriendshipNotificationDTO notification = buildNotification(
                friendship,
                FriendshipNotificationDTO.NotificationType.FRIEND_DECLINED
        );
        webSocketHandler.sendFriendshipNotification(friendship.getSender().getId(), notification);

        return ResponseEntity.ok(friendship);
    }

    // ─── List accepted friends ───────────────────────────────────────────
    @GetMapping("/friends")
    public ResponseEntity<List<User>> getFriends() {
        User currentUser = getAuthenticatedUser();
        List<User> friends = friendshipService.getFriends(currentUser.getId());
        return ResponseEntity.ok(friends);
    }

    // ─── List pending incoming requests ──────────────────────────────────
    @GetMapping("/pending")
    public ResponseEntity<List<Friendship>> getPendingRequests() {
        User currentUser = getAuthenticatedUser();
        List<Friendship> pending = friendshipService.getPendingRequests(currentUser.getId());
        return ResponseEntity.ok(pending);
    }

    // ─── List sent pending requests ──────────────────────────────────────
    @GetMapping("/sent")
    public ResponseEntity<List<Friendship>> getSentRequests() {
        User currentUser = getAuthenticatedUser();
        List<Friendship> sent = friendshipService.getSentRequests(currentUser.getId());
        return ResponseEntity.ok(sent);
    }

    // ─── Block a user ────────────────────────────────────────────────────
    @PostMapping("/block/{userId}")
    public ResponseEntity<Friendship> blockUser(@PathVariable Long userId) {
        User currentUser = getAuthenticatedUser();

        if (currentUser.getId().equals(userId)) {
            return ResponseEntity.badRequest().build();
        }

        Friendship friendship = friendshipService.blockUser(currentUser.getId(), userId);

        // Notify the blocked user
        FriendshipNotificationDTO notification = buildNotification(
                friendship,
                FriendshipNotificationDTO.NotificationType.FRIEND_BLOCKED
        );
        webSocketHandler.sendFriendshipNotification(userId, notification);

        return ResponseEntity.ok(friendship);
    }

    // ─── Unblock a user ──────────────────────────────────────────────────
    @DeleteMapping("/block/{userId}")
    public ResponseEntity<Void> unblockUser(@PathVariable Long userId) {
        User currentUser = getAuthenticatedUser();

        friendshipService.unblockUser(currentUser.getId(), userId);

        // Notify the unblocked user
        // Build a minimal notification for unblock
        FriendshipNotificationDTO notification = new FriendshipNotificationDTO();
        notification.setType(FriendshipNotificationDTO.NotificationType.FRIEND_UNBLOCKED);
        notification.setSenderId(currentUser.getId());
        notification.setSenderUsername(currentUser.getUsername());
        notification.setSenderFullName(currentUser.getFullName());
        notification.setSenderAvatarUrl(currentUser.getAvatarUrl());
        notification.setReceiverId(userId);
        notification.setTimestamp(LocalDateTime.now());
        webSocketHandler.sendFriendshipNotification(userId, notification);

        return ResponseEntity.ok().build();
    }

    // ─── List blocked users ──────────────────────────────────────────────
    @GetMapping("/blocked")
    public ResponseEntity<List<User>> getBlockedUsers() {
        User currentUser = getAuthenticatedUser();
        List<User> blockedUsers = friendshipService.getBlockedUsers(currentUser.getId());
        return ResponseEntity.ok(blockedUsers);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByUsername(authentication.getName());
    }

    private FriendshipNotificationDTO buildNotification(Friendship friendship,
                                                        FriendshipNotificationDTO.NotificationType type) {
        FriendshipNotificationDTO dto = new FriendshipNotificationDTO();
        dto.setFriendshipId(friendship.getId());
        dto.setType(type);
        dto.setSenderId(friendship.getSender().getId());
        dto.setSenderUsername(friendship.getSender().getUsername());
        dto.setSenderFullName(friendship.getSender().getFullName());
        dto.setSenderAvatarUrl(friendship.getSender().getAvatarUrl());
        dto.setReceiverId(friendship.getReceiver().getId());
        dto.setReceiverUsername(friendship.getReceiver().getUsername());
        dto.setReceiverFullName(friendship.getReceiver().getFullName());
        dto.setReceiverAvatarUrl(friendship.getReceiver().getAvatarUrl());
        dto.setTimestamp(LocalDateTime.now());
        return dto;
    }
}
