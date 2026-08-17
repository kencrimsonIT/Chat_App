package com.messapp.backend.service;

import com.messapp.backend.dto.call.CallSignalDTO;
import com.messapp.backend.entity.Call;
import com.messapp.backend.repository.CallRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CallService {

    @Autowired
    private CallRepository callRepository;

    /**
     * Persist a new RINGING call record and attach the generated id + timestamp
     * to the signaling DTO so both peers know the call id.
     */
    public CallSignalDTO registerInvite(CallSignalDTO dto) {
        Call call = Call.builder()
                .callerId(dto.getFromUserId())
                .calleeId(dto.getToUserId())
                .roomId(dto.getRoomId())
                .callType(Call.CallType.valueOf(dto.getCallType()))
                .status(Call.CallStatus.RINGING)
                .build();
        Call saved = callRepository.save(call);
        dto.setCallId(saved.getId());
        dto.setTimestamp(LocalDateTime.now());
        return dto;
    }

    public void markAccepted(Long callId) {
        updateStatus(callId, Call.CallStatus.ACCEPTED, true);
    }

    public void markDeclined(Long callId) {
        updateStatus(callId, Call.CallStatus.DECLINED, false);
    }

    public void markCancelled(Long callId) {
        updateStatus(callId, Call.CallStatus.CANCELLED, false);
    }

    public void markBusy(Long callId) {
        updateStatus(callId, Call.CallStatus.BUSY, false);
    }

    public void markEnded(Long callId) {
        if (callId == null) return;
        callRepository.findById(callId).ifPresent(call -> {
            call.setStatus(Call.CallStatus.ENDED);
            call.setEndedAt(LocalDateTime.now());
            if (call.getStartedAt() != null) {
                long seconds = Duration.between(call.getStartedAt(), call.getEndedAt()).getSeconds();
                call.setDurationSeconds((int) Math.max(0, seconds));
            }
            callRepository.save(call);
        });
    }

    public List<Call> getCallHistory(Long userId) {
        return callRepository.findByCallerIdOrCalleeIdOrderByCreatedAtDesc(userId, userId);
    }

    private void updateStatus(Long callId, Call.CallStatus status, boolean setStartedAt) {
        if (callId == null) return;
        callRepository.findById(callId).ifPresent(call -> {
            call.setStatus(status);
            if (setStartedAt && call.getStartedAt() == null) {
                call.setStartedAt(LocalDateTime.now());
            }
            if (status == Call.CallStatus.DECLINED || status == Call.CallStatus.CANCELLED
                    || status == Call.CallStatus.BUSY) {
                call.setEndedAt(LocalDateTime.now());
            }
            callRepository.save(call);
        });
    }
}
