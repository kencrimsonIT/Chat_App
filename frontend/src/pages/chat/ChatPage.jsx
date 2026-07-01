import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import "./ChatPage.scss";
import defaultPfp from "../../assets/images/default-pfp.jpg";
import chatService from "../../services/chatService";
import roomService from "../../services/roomService";
import { connectWebSocket, subscribeToRoom, sendChatMessage, disconnectWebSocket } from "../../websocket/socket";

const ChatPage = () => {
    const darkMode = useSelector((state) => state.theme.darkMode);
    const [activeChatId, setActiveChatId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [roomDetails, setRoomDetails] = useState({}); // { roomId: { type, name, members, ... } }
    const [messages, setMessages] = useState([]);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle room selection and history loading
    useEffect(() => {
        if (activeChatId) {
            setMessages([]);
            fetchHistory(activeChatId);
            fetchRoomDetails(activeChatId);

            // Re-subscribe when active chat changes
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }

            if (socketConnected) {
                subscriptionRef.current = subscribeToRoom(activeChatId, (newMessage) => {
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChatId, socketConnected]);

    const fetchRooms = async () => {
        try {
            const rooms = await chatService.getMyRooms();
            // Map Room entity to conversation format expected by Sidebar
            const formattedRooms = rooms.map(room => ({
                id: room.id,
                name: room.name || `Phòng ${room.id}`,
                type: room.type || "PRIVATE",
                lastMessage: "...",
                time: room.createdAt ? new Date(room.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
                unread: 0,
                online: false,
                avatar: null
            }));
            setConversations(formattedRooms);

            // Fetch room details for groups to get member info
            const detailsMap = {};
            for (const room of rooms) {
                if (room.type === "GROUP") {
                    try {
                        const detail = await roomService.getRoomDetails(room.id);
                        detailsMap[room.id] = detail;
                    } catch (err) {
                        console.error("Failed to fetch room details:", err);
                    }
                }
            }
            setRoomDetails(prev => ({ ...prev, ...detailsMap }));
        } catch (err) {
            console.error("Failed to fetch rooms", err);
        }
    };

    const fetchHistory = async (roomId) => {
        setIsMessagesLoading(true);
        try {
            const history = await chatService.getChatHistory(roomId);
            setMessages(history.reverse());
        } catch (err) {
            console.error("Failed to fetch chat history", err);
        } finally {
            setIsMessagesLoading(false);
        }
    };

    const fetchRoomDetails = async (roomId) => {
        try {
            const detail = await roomService.getRoomDetails(roomId);
            setRoomDetails(prev => ({ ...prev, [roomId]: detail }));
        } catch (err) {
            console.error("Failed to fetch room details:", err);
        }
    };

    const handleStartChatWithFriend = async (friend) => {
        try {
            const targetId = typeof friend === 'object' ? friend.id : friend;
            const friendName = typeof friend === 'object' ? (friend.fullName || friend.username) : `Phòng chat`;
            const friendAvatar = typeof friend === 'object' ? friend.avatarUrl : null;

            const room = await chatService.getPrivateRoom(targetId);

            setConversations(prev => {
                const isExist = prev.some(c => c.id === room.id);
                if (isExist) return prev;

                return [...prev, {
                    id: room.id,
                    name: room.name || friendName,
                    type: "PRIVATE",
                    avatar: friendAvatar,
                    lastMessage: "Bắt đầu cuộc trò chuyện",
                    time: "",
                    unread: 0,
                    online: true
                }];
            });

            setActiveChatId(room.id);
        } catch (err) {
            console.error("Không thể mở phòng trò chuyện:", err);
        }
    };

    const handleRoomCreated = async (newRoom) => {
        // newRoom comes from CreateGroupModal -> roomService.createGroupRoom response (RoomDetailDTO)
        setConversations(prev => {
            const isExist = prev.some(c => c.id === newRoom.id);
            if (isExist) return prev;

            return [...prev, {
                id: newRoom.id,
                name: newRoom.name,
                type: "GROUP",
                avatar: null,
                lastMessage: "Nhóm vừa được tạo",
                time: "",
                unread: 0,
                online: false
            }];
        });

        setRoomDetails(prev => ({ ...prev, [newRoom.id]: newRoom }));
        setActiveChatId(newRoom.id);
    };

    const handleGroupInfoUpdate = async (result) => {
        if (result?.left) {
            // User left the group — go back to no active chat
            setActiveChatId(null);
            // Refresh the room list
            fetchRooms();
        } else {
            // Group was updated (members changed, etc.)
            if (activeChatId) {
                await fetchRoomDetails(activeChatId);
                fetchRooms(); // Refresh sidebar
            }
        }
    };

    const activeChat = conversations.find(c => c.id === activeChatId);
    const activeRoomDetail = activeChatId ? roomDetails[activeChatId] : null;

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

    // Transform messages to the format expected by MessageItem
    const formattedMessages = messages.map(msg => ({
        id: msg.id,
        text: msg.content,
        time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
        senderId: msg.senderId.toString() === userId.toString() ? "me" : "them",
        senderUsername: msg.senderUsername,
        senderAvatar: defaultPfp
    }));

    return (
        <div className={`chat-page-container ${darkMode ? "dark-theme" : ""}`}>
            <div className="chat-layout">
                <ChatSidebar
                    currentUser={{ id: Number(userId), username }}
                    conversations={conversations}
                    activeId={activeChatId}
                    onSelect={setActiveChatId}
                    onRoomCreated={handleRoomCreated}
                    onStartChat={handleStartChatWithFriend}
                />
                <ChatWindow
                    activeChat={activeChat}
                    roomDetail={activeRoomDetail}
                    currentUserId={Number(userId)}
                    currentUsername={username}
                    messages={formattedMessages}
                    isLoading={isMessagesLoading}
                    onSendMessage={handleSendMessage}
                    onGroupInfoUpdate={handleGroupInfoUpdate}
                />
            </div>
        </div>
    );
};

export default ChatPage;
