package com.messapp.backend.controller;

import com.messapp.backend.dto.chat.MessageDTO;
import com.messapp.backend.entity.User;
import com.messapp.backend.service.ChatService;
import com.messapp.backend.service.CloudinaryService;
import com.messapp.backend.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private UserService userService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload MessageDTO messageDTO) {
        MessageDTO savedMessage = chatService.saveMessage(messageDTO);
        messagingTemplate.convertAndSend("/topic/room/" + messageDTO.getRoomId(), savedMessage);
    }

    @GetMapping("/api/chat/history/{roomId}")
    public ResponseEntity<List<MessageDTO>> getChatHistory(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(chatService.getChatHistory(roomId, page, size));
    }

    /**
     * Upload a file attachment and send it as a message to a room.
     * Accepts multipart/form-data with file, roomId, and optional caption.
     */
    @PostMapping("/api/chat/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("roomId") Long roomId,
            @RequestParam(value = "caption", required = false) String caption,
            Authentication authentication) {

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File không được để trống"));
            }

            // Validate file size (max 20MB)
            if (file.getSize() > 20 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("error", "File quá lớn. Giới hạn tối đa 20MB."));
            }

            // Get sender info from authenticated user
            String username = authentication.getName();
            User currentUser = userService.getUserByUsername(username);
            Long senderId = currentUser.getId();

            // Upload file to Cloudinary
            Map uploadResult = cloudinaryService.upload(file);
            String fileUrl = (String) uploadResult.get("url");
            String publicId = (String) uploadResult.get("public_id");

            log.info("File uploaded to Cloudinary: {} (public_id: {})", fileUrl, publicId);

            // Determine message type based on file content type
            String mimeType = file.getContentType();
            String messageType;
            if (mimeType != null && mimeType.startsWith("image/")) {
                messageType = "IMAGE";
            } else {
                messageType = "FILE";
            }

            // Build message DTO
            MessageDTO messageDTO = MessageDTO.builder()
                    .roomId(roomId)
                    .senderId(senderId)
                    .senderUsername(username)
                    .content(caption != null ? caption : "")
                    .type(messageType)
                    .fileUrl(fileUrl)
                    .fileName(file.getOriginalFilename())
                    .fileType(mimeType)
                    .fileSize(file.getSize())
                    .createdAt(LocalDateTime.now())
                    .build();

            // Save and broadcast via WebSocket
            MessageDTO savedMessage = chatService.saveMessage(messageDTO);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, savedMessage);

            return ResponseEntity.ok(savedMessage);

        } catch (Exception e) {
            log.error("Failed to upload file: ", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Tải file lên thất bại: " + e.getMessage()));
        }
    }
}
