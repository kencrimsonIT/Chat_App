import React, { useEffect, useRef } from "react";
import { Phone, Video, Info, MoreHorizontal, UserPlus } from "lucide-react";
import MessageItem from "./MessageItem";
import ChatInput from "./ChatInput";
import defaultPfp from "../../assets/images/default-pfp.jpg";

const ChatWindow = ({ activeChat, messages, onSendMessage }) => {
    const scrollRef = useRef();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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
