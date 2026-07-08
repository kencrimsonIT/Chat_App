import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import "./ChatPage.scss";
import defaultPfp from "../../assets/images/default-pfp.jpg";
import chatService from "../../services/chatService";
import roomService from "../../services/roomService";
import { connectWebSocket, subscribeToRoom, sendChatMessage, disconnectWebSocket, subscribeToUserPresence, sendUserStatus } from "../../websocket/socket";

const ChatPage = () => {
    const darkMode = useSelector((state) => state.theme.darkMode);
    const [activeChatId, setActiveChatId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [roomDetails, setRoomDetails] = useState({});
    const [messages, setMessages] = useState([]);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [userPresence, setUserPresence] = useState({});

    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    const subscriptionRef = useRef(null);
    const presenceSubscriptionRef = useRef(null);

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

    // Subscribe to user presence changes
    useEffect(() => {
        if (socketConnected) {
            presenceSubscriptionRef.current = subscribeToUserPresence((presence) => {
                setUserPresence(prev => ({
                    ...prev,
                    [presence.userId]: {
                        status: presence.status,
                        lastSeen: presence.timestamp
                    }
                }));
            });

            return () => {
                if (presenceSubscriptionRef.current) {
                    presenceSubscriptionRef.current.unsubscribe();
                }
            };
        }
    }, [socketConnected]);

    // Notify server when component mounts (user goes online)
    useEffect(() => {
        if (socketConnected && userId) {
            // Delay để đảm bảo WebSocket đã sẵn sàng
            const timer = setTimeout(() => {
                sendUserStatus(userId, 'ONLINE');
            }, 500);

            // Handle page visibility - pause when tab is not visible
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    sendUserStatus(userId, 'AWAY');
                } else {
                    sendUserStatus(userId, 'ONLINE');
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                clearTimeout(timer);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
    }, [socketConnected, userId]);

    // Helper function to check if user is online
    const isUserOnline = (checkUserId) => {
        return userPresence[checkUserId]?.status === 'ONLINE';
    };

    // Helper function to get last seen time
    const getLastSeenTime = (checkUserId) => {
        const presence = userPresence[checkUserId];
        if (!presence) return null;

        if (presence.status === 'ONLINE') return null;

        const lastSeen = new Date(presence.lastSeen);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastSeen) / 60000);

        if (diffMinutes < 1) return 'Vừa xong';
        if (diffMinutes < 60) return `${diffMinutes}m trước`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h trước`;
        return `${Math.floor(diffMinutes / 1440)}d trước`;
    };

    // Update conversations with online status
    useEffect(() => {
        setConversations(prev => prev.map(conv => {
            if (conv.type === 'PRIVATE') {
                const otherMember = roomDetails[conv.id]?.members?.find(
                    m => m.userId.toString() !== userId.toString()
                );

                if (otherMember) {
                    return {
                        ...conv,
                        online: isUserOnline(otherMember.userId),
                        lastSeenTime: getLastSeenTime(otherMember.userId)
                    };
                }
            }
            return conv;
        }));
    }, [userPresence, roomDetails, userId]);

    const fetchRooms = async () => {
        try {
            const rooms = await chatService.getMyRooms();

            // Fetch room details cho tất cả rooms
            const detailsMap = {};
            for (const room of rooms) {
                try {
                    const detail = await roomService.getRoomDetails(room.id);
                    detailsMap[room.id] = detail;
                } catch (err) {
                    console.error("Failed to fetch room details:", err);
                }
            }
            setRoomDetails(prev => ({ ...prev, ...detailsMap }));

            // Format rooms với đúng tên và avatar
            const formattedRooms = rooms.map(room => ({
                id: room.id,
                name: getConversationName(room, detailsMap[room.id]),
                type: room.type || "PRIVATE",
                avatar: getConversationAvatar(room, detailsMap[room.id]),
                lastMessage: "...",
                time: room.createdAt ? new Date(room.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
                unread: 0,
                online: false,
            }));
            setConversations(formattedRooms);
        } catch (err) {
            console.error("Failed to fetch rooms", err);
        }
    };

    const getConversationName = (room, detail) => {
        if (room.type === "GROUP") {
            return room.name;
        }

        // Cho PRIVATE room, lấy tên đối phương
        if (room.type === "PRIVATE" && detail?.members) {
            const otherMember = detail.members.find(m => m.userId.toString() !== userId.toString());
            return otherMember?.fullName || otherMember?.username || room.name || "Private Chat";
        }

        return room.name || "Private Chat";
    };

    const getConversationAvatar = (room, detail) => {
        if (room.type === "GROUP") {
            return null;
        }

        // Cho PRIVATE room, lấy avatar đối phương
        if (room.type === "PRIVATE" && detail?.members) {
            const otherMember = detail.members.find(m => m.userId.toString() !== userId.toString());
            return otherMember?.avatarUrl || null;
        }

        return null;
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

            const room = await chatService.getPrivateRoom(targetId);
            const detail = await roomService.getRoomDetails(room.id);

            setConversations(prev => {
                const isExist = prev.some(c => c.id === room.id);
                if (isExist) return prev;

                return [...prev, {
                    id: room.id,
                    name: getConversationName(room, detail),
                    type: "PRIVATE",
                    avatar: getConversationAvatar(room, detail),
                    lastMessage: "Bắt đầu cuộc trò chuyện",
                    time: "",
                    unread: 0,
                    online: true
                }];
            });

            setRoomDetails(prev => ({ ...prev, [room.id]: detail }));
            setActiveChatId(room.id);
        } catch (err) {
            console.error("Không thể mở phòng trò chuyện:", err);
        }
    };

    const handleRoomCreated = async (newRoom) => {
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
            setActiveChatId(null);
            fetchRooms();
        } else {
            if (activeChatId) {
                await fetchRoomDetails(activeChatId);
                fetchRooms();
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

    const handleSendGif = (gifUrl, title) => {
        if (!activeChatId || !socketConnected) return;

        const messageDTO = {
            roomId: activeChatId,
            senderId: userId,
            senderUsername: username,
            content: title || "",
            type: "IMAGE",
            fileUrl: gifUrl,
            fileName: title || "GIF",
            fileType: "image/gif"
        };

        sendChatMessage(messageDTO);
    };

    const handleSendFile = async (file, onProgress) => {
        if (!activeChatId) return;

        try {
            await chatService.uploadFile(file, activeChatId, "", onProgress);
        } catch (err) {
            console.error("File upload failed:", err);
            throw err;
        }
    };

    const getSenderAvatar = (senderId) => {
        if (!roomDetails[activeChatId]?.members) return defaultPfp;

        const member = roomDetails[activeChatId].members.find(m => m.userId.toString() === senderId.toString());
        return member?.avatarUrl || defaultPfp;
    };

    // Transform messages to the format expected by MessageItem
    const formattedMessages = messages.map(msg => ({
        id: msg.id,
        text: msg.content,
        time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
        senderId: msg.senderId.toString() === userId.toString() ? "me" : "them",
        senderUsername: msg.senderUsername,
        senderAvatar: msg.senderId.toString() === userId.toString()
            ? (localStorage.getItem("userAvatar") || defaultPfp)
            : getSenderAvatar(msg.senderId),
        type: msg.type,
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        fileType: msg.fileType,
        fileSize: msg.fileSize
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
                    userPresence={userPresence}
                />
                <ChatWindow
                    activeChat={activeChat}
                    roomDetail={activeRoomDetail}
                    currentUserId={Number(userId)}
                    currentUsername={username}
                    messages={formattedMessages}
                    isLoading={isMessagesLoading}
                    onSendMessage={handleSendMessage}
                    onSendFile={handleSendFile}
                    onSendGif={handleSendGif}
                    onGroupInfoUpdate={handleGroupInfoUpdate}
                    userPresence={userPresence}
                />
            </div>
        </div>
    );
};

export default ChatPage;
