import React, { useEffect, useRef, useState } from "react";
import { Info, MoreHorizontal, Users } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import MessageItem from "./MessageItem";
import ChatInput from "./ChatInput";
import GroupInfoPanel from "./GroupInfoPanel";
import defaultPfp from "../../assets/images/default-pfp.jpg";

const ChatWindow = ({ activeChat, roomDetail, currentUserId, currentUsername, messages, onSendMessage, onSendFile, onSendGif, onGroupInfoUpdate, isLoading, userPresence }) => {
    const scrollRef = useRef();
    const [showGroupInfo, setShowGroupInfo] = useState(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        // Close group info panel when switching chats
        setShowGroupInfo(false);
    }, [activeChat?.id]);

    if (isLoading) {
        return (
            <main className="chat-window">
                <header className="chat-header">
                    <div className="header-user">
                        <div className="avatar-wrapper">
                            <Skeleton circle width={45} height={45} />
                        </div>
                        <div className="user-info" style={{ marginLeft: 12 }}>
                            <Skeleton width={130} height={18} />
                            <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
                        </div>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
                        <Skeleton circle width={36} height={36} />
                        <Skeleton circle width={36} height={36} />
                        <Skeleton circle width={36} height={36} />
                        <Skeleton circle width={36} height={36} />
                    </div>
                </header>

                <div className="message-list">
                    {[false, true, false, false, true].map((isMe, index) => (
                        <div key={index} className={`message-item-wrapper ${isMe ? 'me' : 'them'}`} style={{ display: 'flex', marginBottom: 20, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            {!isMe && (
                                <div className="message-avatar" style={{ marginRight: 10 }}>
                                    <Skeleton circle width={36} height={36} />
                                </div>
                            )}
                            <div className="message-content" style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                <Skeleton borderRadius={18} width={Math.floor(Math.random() * 80) + 120} height={42} />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color, #eee)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Skeleton circle width={40} height={40} />
                    <div style={{ flex: 1 }}>
                        <Skeleton borderRadius={24} height={48} />
                    </div>
                    <Skeleton circle width={40} height={40} />
                </div>
            </main>
        );
    }

    if (!activeChat) {
        return (
            <div className="chat-window-empty">
                <div className="empty-content">
                    <div className="icon-wrapper">
                        <MoreHorizontal size={48} />
                    </div>
                    <h2>Chào mừng bạn đến với MessApp!</h2>
                    <p>Hãy chọn một cuộc trò chuyện để bắt đầu nhắn tin.</p>
                </div>
            </div>
        );
    }

    const isGroup = activeChat.type === "GROUP";
    const memberCount = roomDetail?.members?.length || 0;

    const getOtherMemberId = () => {
        if (isGroup) return null;
        const otherMember = roomDetail?.members?.find(
            m => m.userId.toString() !== currentUserId.toString()
        );
        return otherMember?.userId;
    };

    const getOtherUserStatus = () => {
        if (isGroup) return null;

        const otherMemberId = getOtherMemberId();
        if (!otherMemberId) return null;

        const presence = userPresence?.[otherMemberId];

        if (presence?.status === 'ONLINE') {
            return 'Đang hoạt động';
        }

        if (presence?.lastSeen) {
            const lastSeen = new Date(presence.lastSeen);
            const now = new Date();
            const diffMinutes = Math.floor((now - lastSeen) / 60000);

            if (diffMinutes < 1) return 'Vừa xong';
            if (diffMinutes < 60) return `Hoạt động ${diffMinutes}m trước`;
            if (diffMinutes < 1440) return `Hoạt động ${Math.floor(diffMinutes / 60)}h trước`;
            return `Hoạt động ${Math.floor(diffMinutes / 1440)}d trước`;
        }

        return 'Ngoại tuyến';
    };

    const isOtherUserOnline = () => {
        const otherMemberId = getOtherMemberId();
        return otherMemberId && userPresence?.[otherMemberId]?.status === 'ONLINE';
    };

    return (
        <>
            <main className={`chat-window ${showGroupInfo && isGroup ? 'with-side-panel' : ''}`}>
                <header className="chat-header">
                    <div className="header-user">
                        <div className="avatar-wrapper">
                            {isGroup ? (
                                <div className="group-avatar">
                                    <span>{(activeChat.name || "G")[0].toUpperCase()}</span>
                                </div>
                            ) : (
                                <>
                                    <img src={activeChat.avatar || defaultPfp} alt={activeChat.name} />
                                    {isOtherUserOnline() && <span className="status-dot"></span>}
                                </>
                            )}
                        </div>
                        <div className="user-info">
                            <h3>{activeChat.name}</h3>
                            <p className="status">
                                {isGroup
                                    ? `${memberCount} thành viên`
                                    : getOtherUserStatus()
                                }
                            </p>
                        </div>
                    </div>

                    <div className="header-actions">
                        {isGroup && (
                            <button
                                className={`icon-btn ${showGroupInfo ? 'active' : ''}`}
                                onClick={() => setShowGroupInfo(!showGroupInfo)}
                                title="Thông tin nhóm"
                            >
                                <Users size={20} />
                            </button>
                        )}
                    </div>
                </header>

                <div className="message-list" ref={scrollRef}>
                    {messages.map((msg, index) => (
                        <MessageItem
                            key={index}
                            message={msg}
                            isMe={msg.senderId === 'me'}
                        />
                    ))}
                </div>

                <ChatInput onSend={onSendMessage} onSendFile={onSendFile} onSendGif={onSendGif} />
            </main>

            {/* Group Info Side Panel */}
            {isGroup && showGroupInfo && (
                <GroupInfoPanel
                    roomId={activeChat.id}
                    currentUserId={Number(currentUserId)}
                    currentUserName={currentUsername}
                    onClose={() => setShowGroupInfo(false)}
                    onUpdate={onGroupInfoUpdate}
                    userPresence={userPresence}
                />
            )}
        </>
    );
};

export default ChatWindow;
