import React, { useState } from "react";
import { useSelector } from "react-redux";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import "./ChatPage.scss";
import defaultPfp from "../../assets/images/default-pfp.jpg";

const ChatPage = () => {
    const darkMode = useSelector((state) => state.theme.darkMode);
    const [activeChatId, setActiveChatId] = useState(null);

    // Mock conversations data
    const [conversations] = useState([
        { id: 1, name: "Kent Paul", lastMessage: "Chào bạn, hôm nay thế nào?", time: "10:30 AM", unread: 2, online: true, avatar: defaultPfp },
        { id: 2, name: "Nhóm Dự Án", lastMessage: "Đã cập nhật tài liệu mới nhé.", time: "Hôm qua", unread: 0, online: false, avatar: null },
        { id: 3, name: "Trần Anh", lastMessage: "Ok, hẹn gặp sau.", time: "Thứ 2", unread: 0, online: true, avatar: defaultPfp },
        { id: 4, name: "Linh Chi", lastMessage: "Bạn gửi cho mình file thiết kế với.", time: "Thứ 2", unread: 5, online: false, avatar: null },
    ]);

    // Mock messages data
    const [allMessages, setAllMessages] = useState({
        1: [
            { text: "Chào bạn!", time: "10:25 AM", senderId: "them", senderAvatar: defaultPfp },
            { text: "Chào bạn, hôm nay thế nào?", time: "10:30 AM", senderId: "them", senderAvatar: defaultPfp },
        ],
        2: [
            { text: "Chào mọi người", time: "9:00 AM", senderId: "me", senderAvatar: defaultPfp },
            { text: "Đã cập nhật tài liệu mới nhé.", time: "9:05 AM", senderId: "them", senderAvatar: defaultPfp },
        ]
    });

    const activeChat = conversations.find(c => c.id === activeChatId);
    const currentMessages = allMessages[activeChatId] || [];

    const handleSendMessage = (text) => {
        if (!activeChatId) return;
        
        const newMessage = {
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderId: "me",
            senderAvatar: defaultPfp
        };

        setAllMessages(prev => ({
            ...prev,
            [activeChatId]: [...(prev[activeChatId] || []), newMessage]
        }));
    };

    return (
        <div className={`chat-page-container ${darkMode ? "dark-theme" : ""}`}>
            <div className="chat-layout">
                <ChatSidebar 
                    conversations={conversations} 
                    activeId={activeChatId}
                    onSelect={setActiveChatId}
                />
                <ChatWindow 
                    activeChat={activeChat}
                    messages={currentMessages}
                    onSendMessage={handleSendMessage}
                />
            </div>
        </div>
    );
};

export default ChatPage;
