package com.messapp.backend.repository;

import com.messapp.backend.entity.Friendship;
import com.messapp.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    // Find specific friendship request between two users
    Optional<Friendship> findBySenderAndReceiver(User sender, User receiver);

    // Find friendships where a user is the sender and has a given status
    List<Friendship> findBySenderAndStatus(User sender, Friendship.FriendshipStatus status);

    // Find friendships where a user is the receiver and has a given status
    List<Friendship> findByReceiverAndStatus(User receiver, Friendship.FriendshipStatus status);

    // Find specific friendship by sender, receiver, and status
    Optional<Friendship> findBySenderAndReceiverAndStatus(User sender, User receiver, Friendship.FriendshipStatus status);

    // Check if any block relationship exists between two users (either direction)
    @Query("SELECT f FROM Friendship f WHERE f.status = 'BLOCKED' AND ((f.sender = :user1 AND f.receiver = :user2) OR (f.sender = :user2 AND f.receiver = :user1))")
    List<Friendship> findBlockBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
}
