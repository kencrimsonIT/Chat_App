package com.messapp.backend.controller;

import com.messapp.backend.entity.Room;
import com.messapp.backend.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
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
    private com.messapp.backend.service.UserService userService;

    @GetMapping("/me")
    public ResponseEntity<List<Room>> getMyRooms(Authentication authentication) {
        return ResponseEntity.ok(roomService.getUserRooms(authentication.getName()));
    }

    @PostMapping("/private/{targetUserId}")
    public ResponseEntity<Room> createPrivateRoom(@PathVariable Long targetUserId, Authentication authentication) {
        com.messapp.backend.entity.User currentUser = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(roomService.createPrivateRoom(currentUser.getId(), targetUserId));
    }
}
