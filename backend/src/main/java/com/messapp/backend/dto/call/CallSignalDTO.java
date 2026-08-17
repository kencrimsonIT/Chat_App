package com.messapp.backend.dto.call;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Unified payload for WebRTC call signaling exchanged over STOMP.
 * type: INVITE | ACCEPT | DECLINE | CANCEL | BUSY | END | SIGNAL
 */
@Data
public class CallSignalDTO {

    private String type;

    private Long callId;
    private Long roomId;
    private Long fromUserId;
    private Long toUserId;

    private String callType; // AUDIO | VIDEO

    private String callerName;
    private String callerAvatar;
    private String calleeName;
    private String calleeAvatar;

    /** WebRTC payload: { "sdp": {...} } or { "candidate": {...} } */
    private Map<String, Object> signal;

    private LocalDateTime timestamp;
}
