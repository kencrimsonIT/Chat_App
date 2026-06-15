package com.messapp.backend.controller;

import com.messapp.backend.dto.chat.MessageDTO;
import com.messapp.backend.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

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
}
