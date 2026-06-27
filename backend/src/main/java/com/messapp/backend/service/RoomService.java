package com.messapp.backend.service;

import com.messapp.backend.entity.Room;
import com.messapp.backend.entity.RoomMember;
import com.messapp.backend.entity.User;
import com.messapp.backend.exception.ResourceNotFoundException;
import com.messapp.backend.repository.RoomMemberRepository;
import com.messapp.backend.repository.RoomRepository;
import com.messapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private UserRepository userRepository;

    public Room createPrivateRoom(Long user1Id, Long user2Id) {
        User user1 = userRepository.findById(user1Id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User user2 = userRepository.findById(user2Id).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get user1's chat rooms
        List<Room> user1Rooms = roomMemberRepository.findByUser(user1).stream()
                .map(RoomMember::getRoom)
                .collect(Collectors.toList());

        // Check private room where user2 is also a member
        for (Room room : user1Rooms) {
            if (room.getType() == Room.RoomType.PRIVATE) {
                boolean isUser2InRoom = roomMemberRepository.findByUser(user2).stream()
                        .anyMatch(rm -> rm.getRoom().getId().equals(room.getId()));

                if (isUser2InRoom) {
                    return room;
                }
            }
        }

        Room room = Room.builder()
                .type(Room.RoomType.PRIVATE)
                .build();
        room = roomRepository.save(room);

        roomMemberRepository.save(RoomMember.builder().room(room).user(user1).role(RoomMember.Role.ADMIN).build());
        roomMemberRepository.save(RoomMember.builder().room(room).user(user2).role(RoomMember.Role.MEMBER).build());

        return room;
    }

    public List<Room> getUserRooms(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        return roomMemberRepository.findByUser(user).stream()
                .map(RoomMember::getRoom)
                .collect(Collectors.toList());
    }
}
