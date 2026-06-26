import React, { useEffect, useRef } from "react";
import { Phone, Video, Info, MoreHorizontal, UserPlus } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import MessageItem from "./MessageItem";
import ChatInput from "./ChatInput";
import defaultPfp from "../../assets/images/default-pfp.jpg";

const ChatWindow = ({ activeChat, messages, onSendMessage, isLoading }) => {
    const scrollRef = useRef();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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
                    {/* Render mảng mô phỏng tin nhắn (tin của mình, tin của bạn) */}
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

                {/* Phần Input mô phỏng */}
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

    return (
        <main className="chat-window">
            <header className="chat-header">
                <div className="header-user">
                    <div className="avatar-wrapper">
                        <img src={activeChat.avatar || defaultPfp} alt={activeChat.name} />
                        {activeChat.online && <span className="status-dot"></span>}
                    </div>
                    <div className="user-info">
                        <h3>{activeChat.name}</h3>
                        <p className="status">{activeChat.online ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
                    </div>
                </div>

                <div className="header-actions">
                    <button className="icon-btn"><Phone size={20} /></button>
                    <button className="icon-btn"><Video size={20} /></button>
                    <button className="icon-btn"><UserPlus size={20} /></button>
                    <button className="icon-btn"><Info size={20} /></button>
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

            <ChatInput onSend={onSendMessage} />
        </main>
    );
};

export default ChatWindow;
