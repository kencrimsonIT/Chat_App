import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import "./ChatPage.scss";
import defaultPfp from "../../assets/images/default-pfp.jpg";
import chatService from "../../services/chatService";
import { connectWebSocket, subscribeToRoom, sendChatMessage, disconnectWebSocket } from "../../websocket/socket";

const ChatPage = () => {
    const darkMode = useSelector((state) => state.theme.darkMode);
    const [activeChatId, setActiveChatId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [socketConnected, setSocketConnected] = useState(false);
    
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    const subscriptionRef = useRef(null);

    // Initial load: Fetch rooms and connect WebSocket
    useEffect(() => {
        fetchRooms();
        connectWebSocket(() => {
            setSocketConnected(true);
        });

        return () => {
            disconnectWebSocket();
        };
    }, []);

    // Handle room selection and history loading
    useEffect(() => {
        if (activeChatId) {
            fetchHistory(activeChatId);
            
            // Re-subscribe when active chat changes
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
            
            if (socketConnected) {
                subscriptionRef.current = subscribeToRoom(activeChatId, (newMessage) => {
                    setMessages(prev => {
                        // Avoid duplicates if message was already added via local update (optional)
                        if (prev.find(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                });
            }
        }
    }, [activeChatId, socketConnected]);

    const fetchRooms = async () => {
        try {
            const rooms = await chatService.getMyRooms();
            // Map Room entity to conversation format expected by Sidebar
            const formattedRooms = rooms.map(room => ({
                id: room.id,
                name: room.name || `Phòng ${room.id}`,
                lastMessage: "...", // Could be fetched from backend later
                time: room.createdAt ? new Date(room.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
                unread: 0,
                online: false,
                avatar: null
            }));
            setConversations(formattedRooms);
        } catch (err) {
            console.error("Failed to fetch rooms", err);
        }
    };

    const fetchHistory = async (roomId) => {
        try {
            const history = await chatService.getChatHistory(roomId);
            // Reverse because backend returns Descending order (newest first)
            setMessages(history.reverse());
        } catch (err) {
            console.error("Failed to fetch chat history", err);
        }
    };

    const activeChat = conversations.find(c => c.id === activeChatId);

    const handleSendMessage = (text) => {
        if (!activeChatId || !socketConnected) return;
        
        const messageDTO = {
            roomId: activeChatId,
            senderId: userId,
            senderUsername: username,
            content: text,
            type: "TEXT"
        };

        sendChatMessage(messageDTO);
    };

    // Transform messages to the format expected by MessageItem (UI adapts)
    const formattedMessages = messages.map(msg => ({
        id: msg.id,
        text: msg.content,
        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderId: msg.senderId.toString() === userId.toString() ? "me" : "them",
        senderAvatar: defaultPfp // In real app, this would come from msg or a user map
    }));

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
                    messages={formattedMessages}
                    onSendMessage={handleSendMessage}
                />
            </div>
        </div>
    );
};

export default ChatPage;
