package com.messapp.backend.controller;

import com.messapp.backend.dto.group.AddMemberRequest;
import com.messapp.backend.dto.group.CreateGroupRoomRequest;
import com.messapp.backend.dto.group.RoomDetailDTO;
import com.messapp.backend.dto.group.RoomMemberDTO;
import com.messapp.backend.dto.group.UpdateMemberRoleRequest;
import com.messapp.backend.dto.group.UpdateRoomRequest;
import com.messapp.backend.entity.Room;
import com.messapp.backend.entity.RoomMember;
import com.messapp.backend.entity.User;
import com.messapp.backend.service.RoomService;
import com.messapp.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    @Autowired
    private RoomService roomService;

    @Autowired
    private UserService userService;

    // ──────────────────────────────────────────────
    // General
    // ──────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<List<Room>> getMyRooms(Authentication authentication) {
        return ResponseEntity.ok(roomService.getUserRooms(authentication.getName()));
    }

    // ──────────────────────────────────────────────
    // Private rooms
    // ──────────────────────────────────────────────

    @GetMapping("/private/{friendId}")
    public ResponseEntity<Room> getPrivateRoomWithFriend(
            @PathVariable Long friendId,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        Room privateRoom = roomService.createPrivateRoom(currentUser.getId(), friendId);
        return ResponseEntity.ok(privateRoom);
    }

    @PostMapping("/private/{targetUserId}")
    public ResponseEntity<Room> createPrivateRoom(@PathVariable Long targetUserId, Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(roomService.createPrivateRoom(currentUser.getId(), targetUserId));
    }

    // ──────────────────────────────────────────────
    // Group rooms
    // ──────────────────────────────────────────────

    /**
     * Create a new group room.
     */
    @PostMapping("/group")
    public ResponseEntity<RoomDetailDTO> createGroupRoom(
            @RequestBody CreateGroupRoomRequest request,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        RoomDetailDTO groupRoom = roomService.createGroupRoom(
                request.getName(),
                currentUser.getId(),
                request.getMemberIds());
        return ResponseEntity.status(HttpStatus.CREATED).body(groupRoom);
    }

    /**
     * Get room details (including members).
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<RoomDetailDTO> getRoomDetails(
            @PathVariable Long roomId,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(roomService.getRoomDetails(roomId, currentUser.getId()));
    }

    /**
     * Update group room information (name).
     */
    @PutMapping("/{roomId}")
    public ResponseEntity<RoomDetailDTO> updateRoomInfo(
            @PathVariable Long roomId,
            @RequestBody UpdateRoomRequest request,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(roomService.updateRoomInfo(roomId, request.getName(), currentUser.getId()));
    }

    /**
     * Get all members of a room.
     */
    @GetMapping("/{roomId}/members")
    public ResponseEntity<List<RoomMemberDTO>> getRoomMembers(
            @PathVariable Long roomId,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(roomService.getRoomMembers(roomId, currentUser.getId()));
    }

    /**
     * Add a member to a group room.
     */
    @PostMapping("/{roomId}/members")
    public ResponseEntity<RoomDetailDTO> addMember(
            @PathVariable Long roomId,
            @RequestBody AddMemberRequest request,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(roomService.addMember(roomId, request.getUserId(), currentUser.getId()));
    }

    /**
     * Remove a member from a group room (or leave the group).
     */
    @DeleteMapping("/{roomId}/members/{userId}")
    public ResponseEntity<RoomDetailDTO> removeMember(
            @PathVariable Long roomId,
            @PathVariable Long userId,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(roomService.removeMember(roomId, userId, currentUser.getId()));
    }

    /**
     * Change a member's role in a group room.
     */
    @PutMapping("/{roomId}/members/{userId}/role")
    public ResponseEntity<RoomDetailDTO> changeMemberRole(
            @PathVariable Long roomId,
            @PathVariable Long userId,
            @RequestBody UpdateMemberRoleRequest request,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        RoomMember.Role newRole = RoomMember.Role.valueOf(request.getRole().toUpperCase());
        return ResponseEntity.ok(roomService.changeMemberRole(roomId, userId, newRole, currentUser.getId()));
    }

    /**
     * Leave a group room.
     */
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<RoomDetailDTO> leaveGroup(
            @PathVariable Long roomId,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(roomService.leaveGroup(roomId, currentUser.getId()));
    }
}
