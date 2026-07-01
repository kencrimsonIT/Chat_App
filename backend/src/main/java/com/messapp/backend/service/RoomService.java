package com.messapp.backend.service;

import com.messapp.backend.dto.group.RoomDetailDTO;
import com.messapp.backend.dto.group.RoomMemberDTO;
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

    // ──────────────────────────────────────────────
    // Private room
    // ──────────────────────────────────────────────

    public Room createPrivateRoom(Long user1Id, Long user2Id) {
        User user1 = userRepository.findById(user1Id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User user2 = userRepository.findById(user2Id).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Room> user1Rooms = roomMemberRepository.findByUser(user1).stream()
                .map(RoomMember::getRoom)
                .collect(Collectors.toList());

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

    // ──────────────────────────────────────────────
    // Group room
    // ──────────────────────────────────────────────

    /**
     * Create a group room with a name and list of members.
     * The creator is automatically added as ADMIN.
     */
    public RoomDetailDTO createGroupRoom(String name, Long creatorId, List<Long> memberIds) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Creator not found"));

        // Validate group name
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Group name is required");
        }

        // Ensure at least one other member is added
        boolean hasOtherMember = memberIds != null && memberIds.stream().anyMatch(id -> !id.equals(creatorId));
        if (!hasOtherMember) {
            throw new IllegalArgumentException("Group must have at least one member besides the creator");
        }

        // Create the room
        Room room = Room.builder()
                .name(name.trim())
                .type(Room.RoomType.GROUP)
                .build();
        room = roomRepository.save(room);

        // Add creator as ADMIN
        roomMemberRepository.save(RoomMember.builder()
                .room(room)
                .user(creator)
                .role(RoomMember.Role.ADMIN)
                .build());

        // Add other members as MEMBER
        if (memberIds != null) {
            for (Long memberId : memberIds) {
                if (memberId.equals(creatorId)) continue; // skip creator (already added)

                User member = userRepository.findById(memberId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + memberId));

                roomMemberRepository.save(RoomMember.builder()
                        .room(room)
                        .user(member)
                        .role(RoomMember.Role.MEMBER)
                        .build());
            }
        }

        return buildRoomDetail(room);
    }

    /**
     * Update group room information (name).
     * Only admins can update the room.
     */
    public RoomDetailDTO updateRoomInfo(Long roomId, String name, Long currentUserId) {
        Room room = getRoomById(roomId);

        if (room.getType() != Room.RoomType.GROUP) {
            throw new IllegalArgumentException("Room is not a group room");
        }

        RoomMember member = getRoomMember(roomId, currentUserId);
        if (member.getRole() != RoomMember.Role.ADMIN) {
            throw new IllegalArgumentException("Only group admins can update room info");
        }

        if (name != null && !name.trim().isEmpty()) {
            room.setName(name.trim());
        }
        room = roomRepository.save(room);

        return buildRoomDetail(room);
    }

    /**
     * Add a member to a group room.
     * Only admins can add members.
     */
    public RoomDetailDTO addMember(Long roomId, Long userIdToAdd, Long currentUserId) {
        Room room = getRoomById(roomId);

        if (room.getType() != Room.RoomType.GROUP) {
            throw new IllegalArgumentException("Room is not a group room");
        }

        RoomMember currentMember = getRoomMember(roomId, currentUserId);
        if (currentMember.getRole() != RoomMember.Role.ADMIN) {
            throw new IllegalArgumentException("Only group admins can add members");
        }

        // Check if user is already a member
        if (roomMemberRepository.findByRoomIdAndUserId(roomId, userIdToAdd).isPresent()) {
            throw new IllegalArgumentException("User is already a member of this group");
        }

        User userToAdd = userRepository.findById(userIdToAdd)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        roomMemberRepository.save(RoomMember.builder()
                .room(room)
                .user(userToAdd)
                .role(RoomMember.Role.MEMBER)
                .build());

        return buildRoomDetail(room);
    }

    /**
     * Remove a member from a group room.
     * Admins can remove any member, or a member can remove themselves (leave).
     */
    public RoomDetailDTO removeMember(Long roomId, Long userIdToRemove, Long currentUserId) {
        Room room = getRoomById(roomId);

        if (room.getType() != Room.RoomType.GROUP) {
            throw new IllegalArgumentException("Room is not a group room");
        }

        boolean isSelfRemoval = userIdToRemove.equals(currentUserId);
        RoomMember currentMember = getRoomMember(roomId, currentUserId);

        if (!isSelfRemoval && currentMember.getRole() != RoomMember.Role.ADMIN) {
            throw new IllegalArgumentException("Only group admins can remove other members");
        }

        RoomMember memberToRemove = roomMemberRepository.findByRoomIdAndUserId(roomId, userIdToRemove)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this group"));

        // Prevent removing the last admin
        if (memberToRemove.getRole() == RoomMember.Role.ADMIN) {
            long adminCount = roomMemberRepository.findByRoomId(roomId).stream()
                    .filter(m -> m.getRole() == RoomMember.Role.ADMIN)
                    .count();
            if (adminCount <= 1 && !isSelfRemoval) {
                throw new IllegalArgumentException("Cannot remove the last admin. Promote another member to admin first.");
            }
        }

        roomMemberRepository.delete(memberToRemove);

        return buildRoomDetail(room);
    }

    /**
     * Leave a group room.
     */
    public RoomDetailDTO leaveGroup(Long roomId, Long userId) {
        return removeMember(roomId, userId, userId);
    }

    /**
     * Change a member's role in a group room.
     * Only admins can change roles.
     */
    public RoomDetailDTO changeMemberRole(Long roomId, Long targetUserId, RoomMember.Role newRole, Long currentUserId) {
        Room room = getRoomById(roomId);

        if (room.getType() != Room.RoomType.GROUP) {
            throw new IllegalArgumentException("Room is not a group room");
        }

        RoomMember currentMember = getRoomMember(roomId, currentUserId);
        if (currentMember.getRole() != RoomMember.Role.ADMIN) {
            throw new IllegalArgumentException("Only group admins can change member roles");
        }

        RoomMember targetMember = roomMemberRepository.findByRoomIdAndUserId(roomId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this group"));

        // Prevent demoting the last admin
        if (targetMember.getRole() == RoomMember.Role.ADMIN && newRole == RoomMember.Role.MEMBER) {
            long adminCount = roomMemberRepository.findByRoomId(roomId).stream()
                    .filter(m -> m.getRole() == RoomMember.Role.ADMIN)
                    .count();
            if (adminCount <= 1) {
                throw new IllegalArgumentException("Cannot demote the last admin. Promote another member to admin first.");
            }
        }

        targetMember.setRole(newRole);
        roomMemberRepository.save(targetMember);

        return buildRoomDetail(room);
    }

    /**
     * Get all members of a room.
     * The requesting user must be a member of the room.
     */
    public List<RoomMemberDTO> getRoomMembers(Long roomId, Long currentUserId) {
        Room room = getRoomById(roomId);

        // Verify the requesting user is a member
        getRoomMember(roomId, currentUserId);

        return roomMemberRepository.findByRoomId(roomId).stream()
                .map(this::convertToMemberDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get room details including members.
     * The requesting user must be a member of the room.
     */
    public RoomDetailDTO getRoomDetails(Long roomId, Long currentUserId) {
        Room room = getRoomById(roomId);

        // Verify the requesting user is a member
        if (room.getType() == Room.RoomType.GROUP) {
            getRoomMember(roomId, currentUserId);
        }

        return buildRoomDetail(room);
    }

    /**
     * Get all rooms for a user.
     */
    public List<Room> getUserRooms(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return roomMemberRepository.findByUser(user).stream()
                .map(RoomMember::getRoom)
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    private Room getRoomById(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    private RoomMember getRoomMember(Long roomId, Long userId) {
        return roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this room"));
    }

    private RoomDetailDTO buildRoomDetail(Room room) {
        List<RoomMemberDTO> members = roomMemberRepository.findByRoomId(room.getId()).stream()
                .map(this::convertToMemberDTO)
                .collect(Collectors.toList());

        return RoomDetailDTO.builder()
                .id(room.getId())
                .name(room.getName())
                .type(room.getType().name())
                .createdAt(room.getCreatedAt())
                .members(members)
                .build();
    }

    private RoomMemberDTO convertToMemberDTO(RoomMember roomMember) {
        User user = roomMember.getUser();
        return RoomMemberDTO.builder()
                .id(roomMember.getId())
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(roomMember.getRole().name())
                .joinedAt(roomMember.getJoinedAt())
                .build();
    }
}
