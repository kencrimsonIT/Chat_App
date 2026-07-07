import React, { useState, useEffect } from "react";
import { Search, MessageSquare, Users, Settings, UserPlus, User, Key, Moon, Sun, Globe, LogOut, Plus, Ban } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import ConversationItem from "./ConversationItem";
import FriendsList from "../common/FriendsList";
import FriendRequestList from "../common/FriendRequestList";
import BlockedUsersList from "../common/BlockedUsersList";
import friendshipService from "../../services/friendshipService";
import AddFriendModal from "../common/AddFriendModal";
import CreateGroupModal from "./CreateGroupModal";
import { connectWebSocket, subscribeToFriendshipNotifications } from "../../websocket/socket";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../../redux/slices/themeSlice";
import useLogout from "../../hooks/useLogout";

// Bổ sung prop `currentUser` để lấy ID đăng ký kênh thông báo
const ChatSidebar = ({
                         currentUser,
                         conversations,
                         activeId,
                         onSelect,
                         onRoomCreated,
                         onStartChat
                     }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("chat"); // 'chat' hoặc 'contacts' hoặc 'settings'

    // States quản lý danh bạ
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showBlockedList, setShowBlockedList] = useState(false);

    // States Redux & Hooks
    const dispatch = useDispatch();
    const darkMode = useSelector(state => state.theme?.darkMode);
    const { logout } = useLogout();

    // State quản lý skeleton loading
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [isLoadingChats, setIsLoadingChats] = useState(true);

    // Kích hoạt hiệu ứng skeleton loading cho tab Trò chuyện khi mount hoặc khi chuyển tab
    useEffect(() => {
        if (activeTab === "chat") {
            setIsLoadingChats(true);
            const timer = setTimeout(() => {
                setIsLoadingChats(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [activeTab]);

    // Fetch dữ liệu danh bạ và danh sách chặn khi chuyển sang tab Liên hệ
    useEffect(() => {
        if (activeTab === "contacts") {
            const loadContacts = async () => {
                setIsLoadingContacts(true);
                try {
                    const artificialDelay = new Promise(resolve => setTimeout(resolve, 800));

                    const [friendsData, pendingData, blockedData] = await Promise.all([
                        friendshipService.getFriends(),
                        friendshipService.getPendingRequests(),
                        friendshipService.getBlockedUsers(),
                        artificialDelay
                    ]);
                    setFriends(friendsData);
                    setPendingRequests(pendingData);
                    setBlockedUsers(blockedData);
                } catch (error) {
                    console.error("Lỗi khi tải danh bạ:", error);
                } finally {
                    setIsLoadingContacts(false);
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

                // Xử lý khi bị chặn bởi người khác
                if (notification.type === 'FRIEND_BLOCKED') {
                    console.log("Bạn đã bị chặn bởi:", notification.senderFullName);
                    // Chặn xóa người đó khỏi danh sách bạn bè tự động
                    try {
                        const updatedFriends = await friendshipService.getFriends();
                        setFriends(updatedFriends);
                    } catch (error) {
                        console.error("Lỗi cập nhật danh sách bạn bè:", error);
                    }
                }

                // Xử lý khi ai đó bỏ chặn mình
                if (notification.type === 'FRIEND_UNBLOCKED') {
                    console.log("Người dùng đã bỏ chặn bạn");
                    // Refresh danh sách chặn (nếu đang hiển thị)
                    try {
                        const updatedBlocked = await friendshipService.getBlockedUsers();
                        setBlockedUsers(updatedBlocked);
                    } catch (error) {
                        console.error("Lỗi cập nhật danh sách chặn:", error);
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

    const handleBlockUser = async (userId) => {
        try {
            await friendshipService.blockUser(userId);
            // Refresh friends list and blocked list
            const [updatedFriends, updatedBlocked] = await Promise.all([
                friendshipService.getFriends(),
                friendshipService.getBlockedUsers()
            ]);
            setFriends(updatedFriends);
            setBlockedUsers(updatedBlocked);
        } catch (error) {
            console.error("Lỗi khi chặn người dùng:", error);
            alert(error.response?.data?.message || "Không thể chặn người dùng này");
        }
    };

    const handleUnblockUser = async (userId) => {
        try {
            await friendshipService.unblockUser(userId);
            // Refresh blocked list
            const updatedBlocked = await friendshipService.getBlockedUsers();
            setBlockedUsers(updatedBlocked);
        } catch (error) {
            console.error("Lỗi khi bỏ chặn:", error);
            alert(error.response?.data?.message || "Không thể bỏ chặn người dùng này");
        }
    };

    const handleGroupCreated = (newGroup) => {
        if (onRoomCreated) {
            onRoomCreated(newGroup);
        }
    };

    // const handleStartChat = async (targetUserId) => {
    //     // Xử lý tạo phòng chat riêng từ ID bạn bè (sử dụng chatService đã có của bạn)
    // };

    // Lọc cuộc trò chuyện ở tab Chat
    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SkeletonTheme baseColor="#e4e6eb" highlightColor="#f2f3f5" duration={1.5}>
            <aside className="chat-sidebar">
                <div className="sidebar-header">
                    <div className="header-top">
                        <h1>{activeTab === "chat" ? "Tin nhắn" : activeTab === "contacts" ? "Danh bạ" : "Cài đặt"}</h1>
                        <div className="header-actions">
                            {activeTab === "chat" && (
                                <button className="icon-btn" onClick={() => setShowCreateGroupModal(true)} title="Tạo nhóm mới">
                                    <Plus size={20} />
                                </button>
                            )}
                            {activeTab === "contacts" && (
                                <button className="icon-btn" onClick={() => setShowAddFriendModal(true)}>
                                    <UserPlus size={20} />
                                </button>
                            )}
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

                <div className="sidebar-content">
                    {activeTab === "chat" && (
                        <div className="conversations-list">
                            {isLoadingChats ? (
                                // Hiển thị 6 skeleton item cho tab Trò chuyện
                                Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="conversation-item">
                                        <div className="avatar-wrapper">
                                            <Skeleton circle width={48} height={48} />
                                        </div>
                                        <div className="content" style={{ flex: 1, marginLeft: 12 }}>
                                            <div className="header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Skeleton width={120} />
                                                <Skeleton width={40} />
                                            </div>
                                            <div className="footer">
                                                <Skeleton width="80%" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredConversations.length > 0 ? (
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
                            {isLoadingContacts ? (
                                // Hiển thị Skeleton cho tab Liên hệ
                                <div style={{ padding: '0 16px' }}>
                                    <Skeleton width={150} height={20} style={{ margin: '16px 0' }} />
                                    {Array(8).fill(0).map((_, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
                                            <Skeleton circle width={45} height={45} />
                                            <Skeleton width={180} style={{ marginLeft: 12 }} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <FriendRequestList pendingRequests={pendingRequests} onAccept={handleAccept} onDecline={handleDecline} />
                                    <FriendsList friends={friends} onStartChat={onStartChat} onBlockUser={handleBlockUser} />

                                    {/* Blocked Users Toggle */}
                                    {blockedUsers.length > 0 && (
                                        <button
                                            className="show-blocked-btn"
                                            onClick={() => setShowBlockedList(!showBlockedList)}
                                        >
                                            <Ban size={16} />
                                            <span>{showBlockedList ? "Ẩn" : "Xem"} danh sách chặn ({blockedUsers.length})</span>
                                        </button>
                                    )}
                                    {showBlockedList && blockedUsers.length > 0 && (
                                        <BlockedUsersList
                                            blockedUsers={blockedUsers}
                                            onUnblock={handleUnblockUser}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div className="settings-tab-wrapper">
                            <Link to="/profile" className="settings-item">
                                <User size={20} /> <span>Hồ sơ</span>
                            </Link>
                            <Link to="/change-password" className="settings-item">
                                <Key size={20} /> <span>Đổi mật khẩu</span>
                            </Link>
                            <button onClick={() => dispatch(toggleTheme())} className="settings-item">
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />} <span>Giao diện: {darkMode ? "Sáng" : "Tối"}</span>
                            </button>
                            <button className="settings-item">
                                <Globe size={20} /> <span>Ngôn ngữ: Tiếng Việt</span>
                            </button>
                            <button onClick={logout} className="settings-item logout-btn">
                                <LogOut size={20} /> <span>Đăng xuất</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="sidebar-footer">
                    <nav className="bottom-nav">
                        <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                            <MessageSquare size={20} /><span>Trò chuyện</span>
                        </button>
                        <button className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
                            <Users size={20} /><span>Liên hệ</span>
                        </button>
                        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                            <Settings size={20} /><span>Cài đặt</span>
                        </button>
                    </nav>
                </div>
            </aside>

            {showAddFriendModal && <AddFriendModal onClose={() => setShowAddFriendModal(false)} />}
            {showCreateGroupModal && (
                <CreateGroupModal
                    currentUserId={currentUser?.id}
                    onClose={() => setShowCreateGroupModal(false)}
                    onGroupCreated={handleGroupCreated}
                />
            )}
        </SkeletonTheme>
    );
};

export default ChatSidebar;