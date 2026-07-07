import React, { useState, useEffect } from "react";
import { X, Search, Check, Users } from "lucide-react";
import friendshipService from "../../services/friendshipService";
import roomService from "../../services/roomService";
import defaultPfp from "../../assets/images/default-pfp.jpg";

const CreateGroupModal = ({ currentUserId, onClose, onGroupCreated }) => {
    const [groupName, setGroupName] = useState("");
    const [friends, setFriends] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadFriends = async () => {
            try {
                const data = await friendshipService.getFriends();
                setFriends(data);
            } catch (err) {
                console.error("Failed to load friends:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadFriends();
    }, []);

    const toggleSelect = (userId) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    };

    const handleCreate = async () => {
        setError("");
        if (!groupName.trim()) {
            setError("Vui lòng nhập tên nhóm");
            return;
        }
        if (selectedIds.size === 0) {
            setError("Vui lòng chọn ít nhất một thành viên");
            return;
        }

        setIsCreating(true);
        try {
            const newGroup = await roomService.createGroupRoom(
                groupName.trim(),
                Array.from(selectedIds)
            );
            onGroupCreated(newGroup);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tạo nhóm");
        } finally {
            setIsCreating(false);
        }
    };

    const filteredFriends = friends.filter(friend => {
        const name = (friend.fullName || friend.username || "").toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    return (
        <div className="add-friend-modal-overlay" onClick={onClose}>
            <div className="group-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Tạo nhóm mới</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="group-modal-body">
                    {/* Group name input */}
                    <div className="group-name-input">
                        <label>Tên nhóm</label>
                        <input
                            type="text"
                            placeholder="Nhập tên nhóm..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Friend search */}
                    <div className="search-form" style={{ padding: "0 0 12px 0" }}>
                        <div className="input-group">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Tìm bạn bè..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Selected count */}
                    <div className="selected-count">
                        <Users size={16} />
                        <span>Đã chọn: {selectedIds.size} người</span>
                    </div>

                    {/* Friend list */}
                    <div className="friend-select-list">
                        {isLoading ? (
                            <p className="loading-text">Đang tải danh sách bạn bè...</p>
                        ) : filteredFriends.length > 0 ? (
                            filteredFriends.map(friend => (
                                <div
                                    key={friend.id}
                                    className={`friend-select-item ${selectedIds.has(friend.id) ? 'selected' : ''}`}
                                    onClick={() => toggleSelect(friend.id)}
                                >
                                    <div className="friend-info">
                                        <img
                                            src={friend.avatarUrl || defaultPfp}
                                            alt={friend.username}
                                            className="avatar"
                                        />
                                        <span className="name">{friend.fullName || friend.username}</span>
                                    </div>
                                    <div className={`check-box ${selectedIds.has(friend.id) ? 'checked' : ''}`}>
                                        {selectedIds.has(friend.id) && <Check size={14} />}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-text">Không tìm thấy bạn bè</p>
                        )}
                    </div>

                    {error && <p className="error-text">{error}</p>}
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Hủy</button>
                    <button
                        className="create-btn"
                        onClick={handleCreate}
                        disabled={isCreating || selectedIds.size === 0}
                    >
                        {isCreating ? "Đang tạo..." : "Tạo nhóm"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
