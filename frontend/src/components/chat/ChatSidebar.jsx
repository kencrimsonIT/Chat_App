import React, { useState, useEffect } from "react";
import { Search, MoreVertical, MessageSquare, Users, Settings, UserPlus } from "lucide-react";
import ConversationItem from "./ConversationItem";
import FriendsList from "../common/FriendsList";
import FriendRequestList from "../common/FriendRequestList";
import friendshipService from "../../services/friendshipService";
import AddFriendModal from "../common/AddFriendModal";
import { connectWebSocket, subscribeToFriendshipNotifications } from "../../websocket/socket";

// Bổ sung prop `currentUser` để lấy ID đăng ký kênh thông báo
const ChatSidebar = ({ currentUser, conversations, activeId, onSelect, onRoomCreated }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("chat"); // 'chat' hoặc 'contacts' hoặc 'settings'

    // States quản lý danh bạ
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);

    // Fetch dữ liệu danh bạ khi người dùng chuyển sang tab Liên hệ
    useEffect(() => {
        if (activeTab === "contacts") {
            const loadContacts = async () => {
                try {
                    const [friendsData, pendingData] = await Promise.all([
                        friendshipService.getFriends(),
                        friendshipService.getPendingRequests()
                    ]);
                    setFriends(friendsData);
                    setPendingRequests(pendingData);
                } catch (error) {
                    console.error("Lỗi khi tải danh bạ:", error);
                }
            };
            loadContacts();
        }
    }, [activeTab]);

    // ------------------------------------------------------------------
    // EFFECT LẮNG NGHE WEBSOCKET THÔNG BÁO KẾT BẠN
    // ------------------------------------------------------------------
    useEffect(() => {
        let friendSub = null;

        // Cần đảm bảo có thông tin currentUser trước khi connect
        if (!currentUser || !currentUser.id) return;

        const setupWebSocket = () => {
            friendSub = subscribeToFriendshipNotifications(currentUser.id, async (notification) => {

                // Xử lý khi có ai đó gửi lời mời kết bạn ĐẾN mình
                if (notification.type === 'FRIEND_REQUEST') {
                    console.log("Có lời mời kết bạn từ:", notification.senderFullName);

                    setPendingRequests(prev => {
                        // Kiểm tra trùng lặp để tránh render dư thừa
                        const isExist = prev.some(req => req.id === notification.friendshipId);
                        if (isExist) return prev;

                        // Tạo object request mới với cấu trúc mapping từ DTO trả về
                        const newRequest = {
                            id: notification.friendshipId,
                            sender: {
                                id: notification.senderId,
                                username: notification.senderUsername,
                                fullName: notification.senderFullName,
                                avatarUrl: notification.senderAvatarUrl
                            },
                            status: "PENDING",
                            createdAt: notification.timestamp
                        };
                        return [newRequest, ...prev]; // Đẩy request mới lên đầu mảng
                    });
                }

                // Xử lý khi lời mời mình gửi đi ĐƯỢC CHẤP NHẬN
                if (notification.type === 'FRIEND_ACCEPTED') {
                    console.log("Lời mời kết bạn đã được chấp nhận bởi:", notification.receiverFullName);
                    // Fetch lại danh sách bạn bè mới nhất
                    try {
                        const updatedFriends = await friendshipService.getFriends();
                        setFriends(updatedFriends);
                    } catch (error) {
                        console.error("Lỗi cập nhật danh sách bạn bè:", error);
                    }
                }
            });
        };

        connectWebSocket(setupWebSocket);

        // Cleanup function khi component unmount
        return () => {
            if (friendSub) {
                friendSub.unsubscribe();
            }
        };
    }, [currentUser]);

    const handleAccept = async (id) => {
        try {
            await friendshipService.acceptFriendRequest(id);
            // Cập nhật nhanh danh sách local sau khi đồng ý kết bạn
            setPendingRequests(prev => prev.filter(req => req.id !== id));
            const updatedFriends = await friendshipService.getFriends();
            setFriends(updatedFriends);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDecline = async (id) => {
        try {
            await friendshipService.declineFriendRequest(id);
            setPendingRequests(prev => prev.filter(req => req.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleStartChat = async (targetUserId) => {
        // Xử lý tạo phòng chat riêng từ ID bạn bè (sử dụng chatService đã có của bạn)
    };

    // Lọc cuộc trò chuyện ở tab Chat
    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <aside className="chat-sidebar">
                {/* Header */}
                <div className="sidebar-header">
                    <div className="header-top">
                        <h1>{activeTab === "chat" ? "Tin nhắn" : activeTab === "contacts" ? "Danh bạ" : "Cài đặt"}</h1>
                        <div className="header-actions">
                            {/* Nút bật Modal thêm bạn bè (Chỉ hiện khi ở tab Danh bạ) */}
                            {activeTab === "contacts" && (
                                <button className="icon-btn" onClick={() => setShowAddFriendModal(true)}>
                                    <UserPlus size={20} />
                                </button>
                            )}
                            <button className="icon-btn"><MoreVertical size={20} /></button>
                        </div>
                    </div>

                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder={activeTab === "chat" ? "Tìm kiếm cuộc trò chuyện..." : "Tìm kiếm trong danh bạ..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content thay đổi động theo activeTab */}
                <div className="sidebar-content">
                    {activeTab === "chat" && (
                        <div className="conversations-list">
                            {filteredConversations.length > 0 ? (
                                filteredConversations.map(conv => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        active={activeId === conv.id}
                                        onClick={() => onSelect(conv.id)}
                                    />
                                ))
                            ) : (
                                <div className="empty-state"><p>Không tìm thấy cuộc trò chuyện nào.</p></div>
                            )}
                        </div>
                    )}

                    {activeTab === "contacts" && (
                        <div className="contacts-tab-wrapper">
                            {/* Render Lờ mời kết bạn */}
                            <FriendRequestList
                                pendingRequests={pendingRequests}
                                onAccept={handleAccept}
                                onDecline={handleDecline}
                            />
                            {/* Render Danh sách bạn bè */}
                            <FriendsList
                                friends={friends}
                                onStartChat={handleStartChat}
                            />
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div className="empty-state"><p>Giao diện cài đặt...</p></div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="sidebar-footer">
                    <nav className="bottom-nav">
                        <button
                            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            <MessageSquare size={20} />
                            <span>Trò chuyện</span>
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('contacts')}
                        >
                            <Users size={20} />
                            <span>Liên hệ</span>
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings size={20} />
                            <span>Cài đặt</span>
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Modal nằm ngang hàng với aside, không bị ảnh hưởng bởi CSS của sidebar */}
            {showAddFriendModal && (
                <AddFriendModal onClose={() => setShowAddFriendModal(false)} />
            )}
        </>
    );
};

export default ChatSidebar;