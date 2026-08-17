package com.messapp.backend.controller;

import com.messapp.backend.dto.call.CallSignalDTO;
import com.messapp.backend.entity.Call;
import com.messapp.backend.service.CallService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Call signaling over STOMP.
 *
 * Clients subscribe to /topic/call/{userId} and publish to /app/call.*
 * The server relays every message to the recipient's topic, persisting
 * call records in the database where relevant.
 */
@RestController
public class CallController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private CallService callService;

    @MessageMapping("/call.invite")
    public void invite(@Payload CallSignalDTO dto) {
        CallSignalDTO processed = callService.registerInvite(dto);
        messagingTemplate.convertAndSend("/topic/call/" + dto.getToUserId(), processed);
    }

    @MessageMapping("/call.accept")
    public void accept(@Payload CallSignalDTO dto) {
        callService.markAccepted(dto.getCallId());
        messagingTemplate.convertAndSend("/topic/call/" + dto.getToUserId(), dto);
    }

    @MessageMapping("/call.decline")
    public void decline(@Payload CallSignalDTO dto) {
        callService.markDeclined(dto.getCallId());
        messagingTemplate.convertAndSend("/topic/call/" + dto.getToUserId(), dto);
    }

    @MessageMapping("/call.cancel")
    public void cancel(@Payload CallSignalDTO dto) {
        callService.markCancelled(dto.getCallId());
        messagingTemplate.convertAndSend("/topic/call/" + dto.getToUserId(), dto);
    }

    @MessageMapping("/call.busy")
    public void busy(@Payload CallSignalDTO dto) {
        callService.markBusy(dto.getCallId());
        messagingTemplate.convertAndSend("/topic/call/" + dto.getToUserId(), dto);
    }

    @MessageMapping("/call.end")
    public void end(@Payload CallSignalDTO dto) {
        callService.markEnded(dto.getCallId());
        messagingTemplate.convertAndSend("/topic/call/" + dto.getToUserId(), dto);
    }

    @MessageMapping("/call.signal")
    public void signal(@Payload CallSignalDTO dto) {
        // Pure WebRTC relay (SDP offers/answers + ICE candidates), no DB write.
        messagingTemplate.convertAndSend("/topic/call/" + dto.getToUserId(), dto);
    }

    @GetMapping("/api/calls/history/{userId}")
    public ResponseEntity<List<Call>> getCallHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(callService.getCallHistory(userId));
    }

    @PostMapping("/api/calls/{callId}/accept")
    public ResponseEntity<?> acceptCallApi(@PathVariable Long callId, @RequestBody CallSignalDTO dto) {
        callService.markAccepted(callId);
        messagingTemplate.convertAndSend("/topic/call/" + dto.getToUserId(), dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/calls/{callId}/reject")
    public ResponseEntity<?> rejectCallApi(@PathVariable Long callId, @RequestBody CallSignalDTO dto) {
        callService.markDeclined(callId);
        dto.setType("DECLINE"); // Ensure type is correct if 'reject' is used
        messagingTemplate.convertAndSend("/topic/call/" + dto.getToUserId(), dto);
        return ResponseEntity.ok().build();
    }
}
