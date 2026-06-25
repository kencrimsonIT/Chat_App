import React, { useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import userService from "../../services/userService";
import friendshipService from "../../services/friendshipService";

const AddFriendModal = ({ onClose }) => {
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sentRequests, setSentRequests] = useState(new Set());

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!keyword.trim()) return;

        setIsLoading(true);
        try {
            const data = await userService.searchUsers(keyword);
            setResults(data);
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendRequest = async (receiverId) => {
        try {
            await friendshipService.sendFriendRequest(receiverId);
            setSentRequests(prev => new Set(prev).add(receiverId));
        } catch (error) {
            console.error("Lỗi gửi lời mời:", error);
        }
    };

    return (
        // onClick ở overlay giúp click ra ngoài viền để đóng Modal
        <div className="add-friend-modal-overlay" onClick={onClose}>
            {/* stopPropagation để khi click vào bên trong form sẽ không bị đóng Modal */}
            <div className="add-friend-modal-content" onClick={e => e.stopPropagation()}>

                <div className="modal-header">
                    <h3>Thêm bạn bè mới</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form className="search-form" onSubmit={handleSearch}>
                    <div className="input-group">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Nhập tên người dùng hoặc email..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="search-btn" disabled={isLoading}>
                        Tìm
                    </button>
                </form>

                <div className="search-results">
                    {results.length > 0 ? (
                        <ul>
                            {results.map(user => (
                                <li key={user.id} className="result-item">
                                    <div className="user-info">
                                        <img
                                            src={user.avatarUrl || "/assets/images/default-pfp.jpg"}
                                            alt="avatar"
                                            className="avatar"
                                        />
                                        <span className="name">{user.fullName || user.username}</span>
                                    </div>
                                    <button
                                        className={`add-btn ${sentRequests.has(user.id) ? 'sent' : ''}`}
                                        onClick={() => handleSendRequest(user.id)}
                                        disabled={sentRequests.has(user.id)}
                                    >
                                        <UserPlus size={16} />
                                        {sentRequests.has(user.id) ? "Đã gửi" : "Kết bạn"}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                            <p>{isLoading ? "Đang tìm kiếm..." : "Không có kết quả nào"}</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AddFriendModal;