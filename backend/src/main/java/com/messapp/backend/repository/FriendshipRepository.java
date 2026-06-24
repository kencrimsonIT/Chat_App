package com.messapp.backend.repository;

import com.messapp.backend.entity.Friendship;
import com.messapp.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
