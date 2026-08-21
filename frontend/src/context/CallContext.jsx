import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { connectWebSocket, subscribeToCall, sendCallMessage } from "../websocket/socket";
import incomingRingtone from "../assets/sounds/incoming_ringtone.mp3";
import outgoingRingtone from "../assets/sounds/outcoming_ringtone.mp3";

const CallContext = createContext(null);

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

export const CallProvider = ({ children }) => {
    const userId = Number(sessionStorage.getItem("userId"));

    const [callState, setCallState] = useState("idle"); // idle | outgoing | incoming | active | ended | declined | busy | missed
    const [callInfo, setCallInfo] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const callInfoRef = useRef(null);
    const isCallerRef = useRef(false);
    const pendingCandidatesRef = useRef([]);
    const pendingSignalsRef = useRef([]);
    const durationTimerRef = useRef(null);
    const resetTimerRef = useRef(null);
    const incomingRingtoneRef = useRef(null);
    const outgoingRingtoneRef = useRef(null);

    // Keep the current state readable inside async/event handlers (avoids stale closures)
    const callStateRef = useRef(callState);
    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    // Play / stop ringtone when call state changes
    useEffect(() => {
        if (callState === "incoming") {
            if (!incomingRingtoneRef.current) {
                incomingRingtoneRef.current = new Audio(incomingRingtone);
                incomingRingtoneRef.current.loop = true;
            }
            incomingRingtoneRef.current.currentTime = 0;
            incomingRingtoneRef.current.play().catch(() => {});
        } else if (callState === "outgoing") {
            if (!outgoingRingtoneRef.current) {
                outgoingRingtoneRef.current = new Audio(outgoingRingtone);
                outgoingRingtoneRef.current.loop = true;
            }
            outgoingRingtoneRef.current.currentTime = 0;
            outgoingRingtoneRef.current.play().catch(() => {});
        } else {
            [incomingRingtoneRef, outgoingRingtoneRef].forEach((ref) => {
                if (ref.current) {
                    ref.current.pause();
                    ref.current.currentTime = 0;
                }
            });
        }
    }, [callState]);

    // ==================== Helpers ====================

    const cleanupCall = useCallback(() => {
        // Stop ringtones on cleanup
        [incomingRingtoneRef, outgoingRingtoneRef].forEach((ref) => {
            if (ref.current) {
                ref.current.pause();
                ref.current.currentTime = 0;
            }
        });
        if (peerConnectionRef.current) {
            peerConnectionRef.current.onicecandidate = null;
            peerConnectionRef.current.ontrack = null;
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
        remoteStreamRef.current = null;
        pendingCandidatesRef.current = [];
        pendingSignalsRef.current = [];
        if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setCallDuration(0);
        setIsMuted(false);
        setIsCameraOff(false);
    }, []);

    const scheduleReset = useCallback(() => {
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
            setCallState("idle");
            setCallInfo(null);
        }, 2500);
    }, []);

    const startDurationTimer = useCallback(() => {
        const start = Date.now();
        if (durationTimerRef.current) clearInterval(durationTimerRef.current);
        durationTimerRef.current = setInterval(() => {
            setCallDuration(Math.floor((Date.now() - start) / 1000));
        }, 1000);
    }, []);

    const sendSignal = useCallback((payload) => {
        const info = callInfoRef.current;
        const peerId = isCallerRef.current ? info?.toUserId : info?.fromUserId;
        if (!info || !peerId) return;
        sendCallMessage("call.signal", {
            type: "SIGNAL",
            callId: info.callId,
            fromUserId: userId,
            toUserId: peerId,
            signal: payload,
            timestamp: new Date().toISOString(),
        });
    }, [userId]);

    const getUserMedia = useCallback(async (callType) => {
        const constraints = callType === "VIDEO"
            ? { audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 } } }
            : { audio: true, video: false };
        return navigator.mediaDevices.getUserMedia(constraints);
    }, []);

    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal({ candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                remoteStreamRef.current = event.streams[0];
                setRemoteStream(event.streams[0]);
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [sendSignal]);

    const addLocalTracks = useCallback((pc, stream) => {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }, []);

    // ==================== Incoming message handling ====================

    const handleIncomingInvite = useCallback((msg) => {
        // Already in a call -> reply BUSY
        if (callStateRef.current !== "idle") {
            sendCallMessage("call.busy", {
                type: "BUSY",
                callId: msg.callId,
                fromUserId: userId,
                toUserId: msg.fromUserId,
                callType: msg.callType,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        callInfoRef.current = msg;
        setCallInfo(msg);
        setCallState("incoming");
    }, [userId]);

    const handleSignal = useCallback(async (msg) => {
        const pc = peerConnectionRef.current;
        if (!pc) {
            // Peer connection not ready yet (e.g. offer arrived while the callee
            // was still grabbing the camera/mic) -> queue and process later.
            pendingSignalsRef.current.push(msg);
            return;
        }

        try {
            if (msg.signal?.sdp) {
                const sdp = msg.signal.sdp;
                await pc.setRemoteDescription(sdp);

                if (sdp.type === "offer") {
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    sendSignal({ sdp: pc.localDescription });
                }

                // Flush any ICE candidates that arrived before the remote description
                while (pendingCandidatesRef.current.length) {
                    const candidate = pendingCandidatesRef.current.shift();
                    try {
                        await pc.addIceCandidate(candidate);
                    } catch (err) {
                        console.error("Failed to add queued ICE candidate:", err);
                    }
                }
            }

            if (msg.signal?.candidate) {
                if (pc.remoteDescription) {
                    await pc.addIceCandidate(msg.signal.candidate);
                } else {
                    pendingCandidatesRef.current.push(msg.signal.candidate);
                }
            }
        } catch (err) {
            console.error("Failed to handle WebRTC signal:", err);
        }
    }, [sendSignal]);

    const flushPendingSignals = useCallback(async () => {
        while (pendingSignalsRef.current.length) {
            const msg = pendingSignalsRef.current.shift();
            await handleSignal(msg);
        }
    }, [handleSignal]);

    const handleAccept = useCallback(async (msg) => {
        if (callStateRef.current !== "outgoing") return;
        const info = callInfoRef.current;
        if (!info) return;

        isCallerRef.current = true;
        try {
            const stream = await getUserMedia(info.callType);
            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = createPeerConnection();
            addLocalTracks(pc, stream);
            await flushPendingSignals();

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal({ sdp: pc.localDescription });

            setCallState("active");
            startDurationTimer();
        } catch (err) {
            console.error("Failed to start outgoing call media:", err);
            cleanupCall();
            // Notify the other side that the call could not start
            sendCallMessage("call.end", {
                type: "END",
                callId: info.callId,
                fromUserId: userId,
                toUserId: info.toUserId,
                timestamp: new Date().toISOString(),
            });
            setCallState("ended");
            scheduleReset();
        }
    }, [userId, getUserMedia, createPeerConnection, addLocalTracks, flushPendingSignals, sendSignal, startDurationTimer, cleanupCall, scheduleReset]);

    const handleDecline = useCallback((msg) => {
        if (callStateRef.current !== "outgoing") return;
        cleanupCall();
        setCallState("declined");
        scheduleReset();
    }, [cleanupCall, scheduleReset]);

    const handleCancel = useCallback((msg) => {
        if (callStateRef.current !== "incoming") return;
        cleanupCall();
        setCallState("missed");
        scheduleReset();
    }, [cleanupCall, scheduleReset]);

    const handleBusy = useCallback((msg) => {
        if (callStateRef.current !== "outgoing") return;
        cleanupCall();
        setCallState("busy");
        scheduleReset();
    }, [cleanupCall, scheduleReset]);

    const handleEnd = useCallback((msg) => {
        if (callStateRef.current === "idle") return;
        cleanupCall();
        setCallState("ended");
        scheduleReset();
    }, [cleanupCall, scheduleReset]);

    const handleCallMessage = useCallback((msg) => {
        if (!msg?.type) return;
        switch (msg.type) {
            case "INVITE":
                handleIncomingInvite(msg);
                break;
            case "ACCEPT":
                handleAccept(msg);
                break;
            case "DECLINE":
                handleDecline(msg);
                break;
            case "CANCEL":
                handleCancel(msg);
                break;
            case "BUSY":
                handleBusy(msg);
                break;
            case "END":
                handleEnd(msg);
                break;
            case "SIGNAL":
                handleSignal(msg);
                break;
            default:
                break;
        }
    }, [handleIncomingInvite, handleAccept, handleDecline, handleCancel, handleBusy, handleEnd, handleSignal]);

    // ==================== Subscribe to call signaling ====================

    useEffect(() => {
        if (!userId) return;

        let subscription = null;
        let cancelled = false;

        connectWebSocket().then(() => {
            if (cancelled) return;
            subscription = subscribeToCall(userId, handleCallMessage);
        });

        return () => {
            cancelled = true;
            if (subscription) subscription.unsubscribe();
        };
    }, [userId, handleCallMessage]);

    // Clean up media on unmount
    useEffect(() => {
        return () => {
            cleanupCall();
            if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        };
    }, [cleanupCall]);

    // ==================== Public actions ====================

    const startCall = useCallback(({ roomId, calleeId, calleeName, calleeAvatar, type }) => {
        if (callStateRef.current !== "idle") return;
        if (!calleeId) return;

        const info = {
            roomId,
            fromUserId: userId,
            toUserId: calleeId,
            callType: type, // "AUDIO" | "VIDEO"
            callerName: sessionStorage.getItem("username") || "User",
            callerAvatar: sessionStorage.getItem("userAvatar") || "",
            calleeName: calleeName || "",
            calleeAvatar: calleeAvatar || "",
            timestamp: new Date().toISOString(),
        };

        callInfoRef.current = info;
        setCallInfo(info);
        setCallState("outgoing");
        sendCallMessage("call.invite", { ...info, type: "INVITE" });
    }, [userId]);

    const acceptCall = useCallback(async () => {
        if (callStateRef.current !== "incoming") return;
        const info = callInfoRef.current;
        if (!info) return;

        isCallerRef.current = false;
        sendCallMessage("call.accept", {
            type: "ACCEPT",
            callId: info.callId,
            fromUserId: userId,
            toUserId: info.fromUserId,
            timestamp: new Date().toISOString(),
        });

        try {
            const stream = await getUserMedia(info.callType);
            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = createPeerConnection();
            addLocalTracks(pc, stream);
            await flushPendingSignals();

            setCallState("active");
            startDurationTimer();
        } catch (err) {
            console.error("Failed to get media for incoming call:", err);
            cleanupCall();
            sendCallMessage("call.end", {
                type: "END",
                callId: info.callId,
                fromUserId: userId,
                toUserId: info.fromUserId,
                timestamp: new Date().toISOString(),
            });
            setCallState("ended");
            scheduleReset();
        }
    }, [userId, getUserMedia, createPeerConnection, addLocalTracks, flushPendingSignals, startDurationTimer, cleanupCall, scheduleReset]);

    const declineCall = useCallback(() => {
        if (callStateRef.current !== "incoming") return;
        const info = callInfoRef.current;
        if (!info) return;

        sendCallMessage("call.decline", {
            type: "DECLINE",
            callId: info.callId,
            fromUserId: userId,
            toUserId: info.fromUserId,
            timestamp: new Date().toISOString(),
        });
        cleanupCall();
        setCallState("idle");
        setCallInfo(null);
    }, [userId, cleanupCall]);

    const cancelCall = useCallback(() => {
        if (callStateRef.current !== "outgoing") return;
        const info = callInfoRef.current;
        if (info) {
            sendCallMessage("call.cancel", {
                type: "CANCEL",
                callId: info.callId,
                fromUserId: userId,
                toUserId: info.toUserId,
                timestamp: new Date().toISOString(),
            });
        }
        cleanupCall();
        setCallState("idle");
        setCallInfo(null);
    }, [userId, cleanupCall]);

    const endCall = useCallback(() => {
        const info = callInfoRef.current;
        const peerId = isCallerRef.current ? info?.toUserId : info?.fromUserId;
        if (info && peerId) {
            sendCallMessage("call.end", {
                type: "END",
                callId: info.callId,
                fromUserId: userId,
                toUserId: peerId,
                timestamp: new Date().toISOString(),
            });
        }
        cleanupCall();
        setCallState("ended");
        scheduleReset();
    }, [userId, cleanupCall, scheduleReset]);

    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) return;
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
    }, []);

    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) return;
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
    }, []);

    const value = {
        callState,
        callInfo,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        callDuration,
        startCall,
        acceptCall,
        declineCall,
        cancelCall,
        endCall,
        toggleMute,
        toggleCamera,
    };

    return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error("useCall must be used within a CallProvider");
    }
    return context;
};

export default CallContext;
