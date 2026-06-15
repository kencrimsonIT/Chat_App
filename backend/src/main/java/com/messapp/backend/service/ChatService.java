package com.messapp.backend.service;

import com.messapp.backend.document.Message;
import com.messapp.backend.dto.chat.MessageDTO;
import com.messapp.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private MessageRepository messageRepository;

    public MessageDTO saveMessage(MessageDTO messageDTO) {
        Message message = new Message();
        message.setRoomId(messageDTO.getRoomId());
        message.setSenderId(messageDTO.getSenderId());
        message.setSenderUsername(messageDTO.getSenderUsername());
        message.setContent(messageDTO.getContent());
        message.setType(messageDTO.getType());
        message.setCreatedAt(LocalDateTime.now());

        Message savedMessage = messageRepository.save(message);
        
        return convertToDTO(savedMessage);
    }

    public List<MessageDTO> getChatHistory(Long roomId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return messageRepository.findByRoomIdOrderByCreatedAtDesc(roomId, pageable)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private MessageDTO convertToDTO(Message message) {
        return MessageDTO.builder()
                .id(message.getId())
                .roomId(message.getRoomId())
                .senderId(message.getSenderId())
                .senderUsername(message.getSenderUsername())
                .content(message.getContent())
                .type(message.getType())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
