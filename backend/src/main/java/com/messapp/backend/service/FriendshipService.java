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
        // Prevent duplicate or self request
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("Cannot send friend request to self");
        }
        boolean exists = friendshipRepository
                .findBySenderAndReceiver(sender, receiver)
                .isPresent();
        if (exists) {
            throw new IllegalArgumentException("Friend request already exists");
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

    // Get list of friends for a user (accepted friendships)
    public List<User> getFriends(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<Friendship> asSender = friendshipRepository.findBySenderAndStatus(user, Friendship.FriendshipStatus.ACCEPTED);
        List<Friendship> asReceiver = friendshipRepository.findByReceiverAndStatus(user,  Friendship.FriendshipStatus.ACCEPTED);

        List<User> friends = new ArrayList<>();
        asSender.stream().map(Friendship::getReceiver).forEach(friends::add);
        asReceiver.stream().map(Friendship::getSender).forEach(friends::add);
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
}
