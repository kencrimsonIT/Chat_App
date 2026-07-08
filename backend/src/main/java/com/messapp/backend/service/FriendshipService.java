package com.messapp.backend.service;

import com.messapp.backend.entity.Friendship;
import com.messapp.backend.entity.User;
import com.messapp.backend.repository.FriendshipRepository;
import com.messapp.backend.repository.UserRepository;
import com.messapp.backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FriendshipService {

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomService roomService;

    // Send friend request
    public Friendship sendFriendRequest(Long senderId, Long receiverId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        // Prevent self-request
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("Cannot send friend request to self");
        }

        // Check if either user has blocked the other
        if (isBlocked(senderId, receiverId)) {
            throw new IllegalArgumentException("Cannot send friend request — a block is in effect between you and this user");
        }

        // Check for existing friendship (any status)
        var existingFriendship = friendshipRepository.findBySenderAndReceiver(sender, receiver);
        if (existingFriendship.isPresent()) {
            Friendship f = existingFriendship.get();
            // If the relationship was previously declined, allow re-sending a new request
            if (f.getStatus() == Friendship.FriendshipStatus.PENDING ||
                    f.getStatus() == Friendship.FriendshipStatus.ACCEPTED) {
                throw new IllegalArgumentException("Friend request already exists");
            }
            // If it was declined, re-send as PENDING
            f.setStatus(Friendship.FriendshipStatus.PENDING);
            f.setUpdatedAt(LocalDateTime.now());
            return friendshipRepository.save(f);
        }

        Friendship friendship = new Friendship();
        friendship.setSender(sender);
        friendship.setReceiver(receiver);
        friendship.setStatus(Friendship.FriendshipStatus.PENDING);
        friendship.setCreatedAt(LocalDateTime.now());
        return friendshipRepository.save(friendship);
    }

    // Accept friend request
    public Friendship acceptFriendRequest(Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship not found"));

        friendship.setStatus(Friendship.FriendshipStatus.ACCEPTED);
        friendship.setUpdatedAt(LocalDateTime.now());

        Friendship savedFriendship = friendshipRepository.save(friendship);

        roomService.createPrivateRoom(
                savedFriendship.getSender().getId(),
                savedFriendship.getReceiver().getId()
        );

        return savedFriendship;
    }

    // Decline friend request
    public Friendship declineFriendRequest(Long friendshipId, Long receiverId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship not found"));

        // Only receiver can decline the request
        if (!friendship.getReceiver().getId().equals(receiverId)) {
            throw new IllegalArgumentException("Cannot decline friendship request to self");
        }

        // Decline pending request
        if (friendship.getStatus() != Friendship.FriendshipStatus.PENDING) {
            throw new IllegalArgumentException("This request is no longer pending");
        }

        friendship.setStatus(Friendship.FriendshipStatus.DECLINED);
        friendship.setUpdatedAt(LocalDateTime.now());
        return friendshipRepository.save(friendship);
    }

    // Get list of friends for a user (accepted friendships, excluding blocked users)
    public List<User> getFriends(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get all users that blocked the current user
        List<Long> blockedByIds = friendshipRepository
                .findByReceiverAndStatus(user, Friendship.FriendshipStatus.BLOCKED)
                .stream()
                .map(f -> f.getSender().getId())
                .collect(Collectors.toList());

        List<Friendship> asSender = friendshipRepository.findBySenderAndStatus(user, Friendship.FriendshipStatus.ACCEPTED);
        List<Friendship> asReceiver = friendshipRepository.findByReceiverAndStatus(user,  Friendship.FriendshipStatus.ACCEPTED);

        List<User> friends = new ArrayList<>();
        for (Friendship f : asSender) {
            User friend = f.getReceiver();
            if (!blockedByIds.contains(friend.getId())) {
                friends.add(friend);
            }
        }
        for (Friendship f : asReceiver) {
            User friend = f.getSender();
            if (!blockedByIds.contains(friend.getId())) {
                friends.add(friend);
            }
        }
        return friends;
    }

    // Get pending requests received by a user
    public List<Friendship> getPendingRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return friendshipRepository.findByReceiverAndStatus(user, Friendship.FriendshipStatus.PENDING);
    }

    // Get pending requests sent by a user
    public List<Friendship> getSentRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return friendshipRepository.findBySenderAndStatus(user, Friendship.FriendshipStatus.PENDING);
    }

    // ─── Block a user ──────────────────────────────────────────────────────
    public Friendship blockUser(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new IllegalArgumentException("Cannot block yourself");
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new ResourceNotFoundException("User to block not found"));

        // Check if already blocked (either direction)
        List<Friendship> existingBlocks = friendshipRepository.findBlockBetweenUsers(blocker, blocked);
        for (Friendship f : existingBlocks) {
            // If the blocker is already the sender of a BLOCKED record, it's already blocked
            if (f.getSender().getId().equals(blockerId)) {
                throw new IllegalArgumentException("User is already blocked");
            }
            // If the other user blocked us, they have already blocked us
            throw new IllegalArgumentException("Cannot block this user");
        }

        // Find existing friendship record (any status) and update it
        var existing = friendshipRepository.findBySenderAndReceiver(blocker, blocked);
        if (existing.isPresent()) {
            Friendship f = existing.get();
            f.setStatus(Friendship.FriendshipStatus.BLOCKED);
            f.setUpdatedAt(LocalDateTime.now());
            return friendshipRepository.save(f);
        }

        // Also check reverse direction
        var reverseExisting = friendshipRepository.findBySenderAndReceiver(blocked, blocker);
        if (reverseExisting.isPresent()) {
            Friendship f = reverseExisting.get();
            // Reassign so blocker is the sender
            f.setSender(blocker);
            f.setReceiver(blocked);
            f.setStatus(Friendship.FriendshipStatus.BLOCKED);
            f.setUpdatedAt(LocalDateTime.now());
            return friendshipRepository.save(f);
        }

        // Create new BLOCKED record
        Friendship friendship = new Friendship();
        friendship.setSender(blocker);
        friendship.setReceiver(blocked);
        friendship.setStatus(Friendship.FriendshipStatus.BLOCKED);
        friendship.setCreatedAt(LocalDateTime.now());
        return friendshipRepository.save(friendship);
    }

    // ─── Unblock a user ────────────────────────────────────────────────────
    public void unblockUser(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new IllegalArgumentException("Cannot unblock yourself");
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Friendship friendship = friendshipRepository
                .findBySenderAndReceiverAndStatus(blocker, blocked, Friendship.FriendshipStatus.BLOCKED)
                .orElseThrow(() -> new ResourceNotFoundException("Block not found"));

        friendshipRepository.delete(friendship);
    }

    // ─── Get list of users blocked by the current user ─────────────────────
    public List<User> getBlockedUsers(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return friendshipRepository.findBySenderAndStatus(user, Friendship.FriendshipStatus.BLOCKED)
                .stream()
                .map(Friendship::getReceiver)
                .collect(Collectors.toList());
    }

    // ─── Check if either user has blocked the other ────────────────────────
    public boolean isBlocked(Long userId1, Long userId2) {
        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return !friendshipRepository.findBlockBetweenUsers(user1, user2).isEmpty();
    }
}