package com.messapp.backend.repository;

import com.messapp.backend.entity.RoomMember;
import com.messapp.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    List<RoomMember> findByUser(User user);
    List<RoomMember> findByRoomId(Long roomId);
    Optional<RoomMember> findByRoomIdAndUserId(Long roomId, Long userId);
}
