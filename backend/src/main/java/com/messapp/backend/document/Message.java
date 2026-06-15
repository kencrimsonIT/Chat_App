package com.messapp.backend.document;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "messages")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Message {
    @Id
    private String id;

    @Indexed
    private Long roomId;

    private Long senderId;
    private String senderUsername;
    private String content;
    private String type;

    @Indexed
    private LocalDateTime createdAt = LocalDateTime.now();

    private Set<Long> readBy = new HashSet<>();
}
