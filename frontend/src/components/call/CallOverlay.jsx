import React, { useEffect, useRef } from "react";
import {
    Phone, PhoneOff, Mic, MicOff, Video, VideoOff
} from "lucide-react";
import { useCall } from "../../context/CallContext";
import defaultPfp from "../../assets/images/default-pfp.jpg";
import "./CallOverlay.scss";

const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const CallOverlay = () => {
    const {
        callState, callInfo, localStream, remoteStream,
        isMuted, isCameraOff, callDuration,
        acceptCall, declineCall, cancelCall, endCall, toggleMute, toggleCamera,
    } = useCall();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (callState === "idle" || !callInfo) return null;

    const myId = Number(localStorage.getItem("userId"));
    const amCaller = callInfo.fromUserId === myId;
    const otherName = amCaller ? callInfo.calleeName : callInfo.callerName;
    const otherAvatar = amCaller ? callInfo.calleeAvatar : callInfo.callerAvatar;
    const isVideo = callInfo.callType === "VIDEO";

    const getTitle = () => {
        switch (callState) {
            case "incoming":
                return isVideo ? "Cuộc gọi video đến" : "Cuộc gọi thoại đến";
            case "outgoing":
                return "Đang gọi...";
            case "active":
                return isVideo ? "Cuộc gọi video" : "Cuộc gọi thoại";
            case "declined":
                return "Cuộc gọi bị từ chối";
            case "missed":
                return "Cuộc gọi nhỡ";
            case "busy":
                return "Người dùng đang bận trong cuộc gọi khác";
            case "ended":
                return "Cuộc gọi đã kết thúc";
            default:
                return "";
        }
    };

    const renderStatusScreen = () => (
        <div className="call-overlay">
            <div className="call-card">
                <div className="call-avatar-wrapper">
                    <img
                        src={otherAvatar || defaultPfp}
                        alt={otherName || "User"}
                        className="call-avatar"
                    />
                </div>
                <h2 className="call-name">{otherName || "Người dùng"}</h2>
                <p className="call-status">{getTitle()}</p>

                {(callState === "incoming" || callState === "outgoing") && (
                    <div className="call-actions">
                        {callState === "incoming" ? (
                            <>
                                <button className="call-btn accept" onClick={acceptCall} title="Nghe máy">
                                    <Phone size={26} />
                                </button>
                                <button className="call-btn decline" onClick={declineCall} title="Từ chối">
                                    <PhoneOff size={26} />
                                </button>
                            </>
                        ) : (
                            <button className="call-btn decline" onClick={cancelCall} title="Hủy cuộc gọi">
                                <PhoneOff size={26} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    const renderActiveCall = () => (
        <div className="call-overlay active-call">
            {isVideo ? (
                <video
                    ref={remoteVideoRef}
                    className="remote-video"
                    autoPlay
                    playsInline
                />
            ) : (
                <div className="audio-call-bg">
                    <div className="call-avatar-wrapper large">
                        <img
                            src={otherAvatar || defaultPfp}
                            alt={otherName || "User"}
                            className="call-avatar"
                        />
                    </div>
                    <h2 className="call-name">{otherName || "Người dùng"}</h2>
                    <p className="call-status">{formatDuration(callDuration)}</p>
                </div>
            )}

            {isVideo && (
                <div className="local-video-wrapper">
                    {isCameraOff ? (
                        <div className="local-video-placeholder">
                            <img src={defaultPfp} alt="You" />
                        </div>
                    ) : (
                        <video
                            ref={localVideoRef}
                            className="local-video"
                            autoPlay
                            playsInline
                            muted
                        />
                    )}
                </div>
            )}

            {/* Connecting placeholder while waiting for the remote video stream */}
            {isVideo && !remoteStream && (
                <div className="video-connecting">
                    <div className="call-avatar-wrapper">
                        <img
                            src={otherAvatar || defaultPfp}
                            alt={otherName || "User"}
                            className="call-avatar"
                        />
                    </div>
                    <p className="call-status">Đang kết nối...</p>
                </div>
            )}

            <div className="active-call-controls">
                <button
                    className={`call-btn control ${isMuted ? "active" : ""}`}
                    onClick={toggleMute}
                    title={isMuted ? "Bật mic" : "Tắt mic"}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                {isVideo && (
                    <button
                        className={`call-btn control ${isCameraOff ? "active" : ""}`}
                        onClick={toggleCamera}
                        title={isCameraOff ? "Bật camera" : "Tắt camera"}
                    >
                        {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>
                )}
                <button className="call-btn end" onClick={endCall} title="Kết thúc cuộc gọi">
                    <PhoneOff size={26} />
                </button>
            </div>
        </div>
    );

    return callState === "active" ? renderActiveCall() : renderStatusScreen();
};

export default CallOverlay;
