import React, { useState, useEffect, useCallback } from "react";
import { X, UserMinus, UserPlus, ShieldCheck, Shield, LogOut, Crown } from "lucide-react";
import roomService from "../../services/roomService";
import friendshipService from "../../services/friendshipService";
import defaultPfp from "../../assets/images/default-pfp.jpg";

const GroupInfoPanel = ({ roomId, currentUserId, currentUserName, onClose, onUpdate }) => {
    const [members, setMembers] = useState([]);
    const [room, setRoom] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [friends, setFriends] = useState([]);
    const [friendSearch, setFriendSearch] = useState("");
    const [error, setError] = useState("");

    const currentMember = members.find(m => m.userId === currentUserId);
    const isAdmin = currentMember?.role === "ADMIN";

    const loadData = useCallback(async () => {
        try {
            const [roomData, memberData] = await Promise.all([
                roomService.getRoomDetails(roomId),
                roomService.getRoomMembers(roomId),
            ]);
            setRoom(roomData);
            setMembers(memberData);
        } catch (err) {
            console.error("Failed to load group info:", err);
        } finally {
            setIsLoading(false);
        }
    }, [roomId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Bạn có chắc muốn xóa thành viên này khỏi nhóm?")) return;
        try {
            await roomService.removeMember(roomId, userId);
            await loadData();
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.response?.data?.message || "Không thể xóa thành viên");
        }
    };

    const handlePromote = async (userId) => {
        try {
            await roomService.changeMemberRole(roomId, userId, "ADMIN");
            await loadData();
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.response?.data?.message || "Không thể thay đổi quyền");
        }
    };

    const handleDemote = async (userId) => {
        try {
            await roomService.changeMemberRole(roomId, userId, "MEMBER");
            await loadData();
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.response?.data?.message || "Không thể thay đổi quyền");
        }
    };

    const handleLeave = async () => {
        if (!window.confirm("Bạn có chắc muốn rời nhóm này?")) return;
        try {
            await roomService.leaveGroup(roomId);
            if (onUpdate) onUpdate({ left: true });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Không thể rời nhóm");
        }
    };

    const handleAddMember = async (userId) => {
        try {
            await roomService.addMember(roomId, userId);
            await loadData();
            setShowAddMember(false);
            setFriendSearch("");
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.response?.data?.message || "Không thể thêm thành viên");
        }
    };

    const loadFriends = async () => {
        try {
            const data = await friendshipService.getFriends();
            const memberIds = new Set(members.map(m => m.userId));
            setFriends(data.filter(f => !memberIds.has(f.id)));
        } catch (err) {
            console.error("Failed to load friends:", err);
        }
    };

    const handleShowAddMember = async () => {
        setShowAddMember(true);
        await loadFriends();
    };

    const filteredFriends = friends.filter(f =>
        (f.fullName || f.username || "").toLowerCase().includes(friendSearch.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="group-info-panel">
                <div className="panel-header">
                    <h3>Thông tin nhóm</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="panel-body"><p className="loading-text">Đang tải...</p></div>
            </div>
        );
    }

    return (
        <div className="group-info-panel">
            <div className="panel-header">
                <h3>{room?.name || "Thông tin nhóm"}</h3>
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            <div className="panel-body">
                <div className="group-summary">
                    <div className="group-avatar-lg">
                        {(room?.name || "G")[0].toUpperCase()}
                    </div>
                    <h4>{room?.name}</h4>
                    <p className="member-count">{members.length} thành viên</p>
                </div>

                {/* Admin actions */}
                {isAdmin && (
                    <button className="add-member-btn" onClick={handleShowAddMember}>
                        <UserPlus size={18} /> Thêm thành viên
                    </button>
                )}

                {/* Add member section */}
                {showAddMember && (
                    <div className="add-member-section">
                        <div className="search-bar-small">
                            <input
                                type="text"
                                placeholder="Tìm bạn bè..."
                                value={friendSearch}
                                onChange={(e) => setFriendSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="add-member-list">
                            {filteredFriends.length > 0 ? (
                                filteredFriends.map(f => (
                                    <div key={f.id} className="add-member-item" onClick={() => handleAddMember(f.id)}>
                                        <img src={f.avatarUrl || defaultPfp} alt={f.username} className="avatar" />
                                        <span>{f.fullName || f.username}</span>
                                        <UserPlus size={16} className="add-icon" />
                                    </div>
                                ))
                            ) : (
                                <p className="empty-text">Không còn bạn bè nào để thêm</p>
                            )}
                        </div>
                    </div>
                )}

                {error && <p className="error-text" style={{ margin: "8px 0" }}>{error}</p>}

                {/* Members list */}
                <div className="members-section">
                    <h5>Thành viên</h5>
                    <div className="members-list">
                        {members.map(member => {
                            const isCurrentUser = member.userId === currentUserId;
                            return (
                                <div key={member.userId} className="member-item">
                                    <img
                                        src={member.avatarUrl || defaultPfp}
                                        alt={member.username}
                                        className="avatar"
                                    />
                                    <div className="member-info">
                                        <span className="member-name">
                                            {member.fullName || member.username}
                                            {isCurrentUser && <span className="you-tag">(Bạn)</span>}
                                        </span>
                                        <span className="member-role">
                                            {member.role === "ADMIN" ? (
                                                <><Crown size={12} /> Nhóm trưởng</>
                                            ) : "Thành viên"}
                                        </span>
                                    </div>

                                    <div className="member-actions">
                                        {isAdmin && !isCurrentUser && (
                                            <>
                                                {member.role === "MEMBER" ? (
                                                    <button
                                                        className="icon-btn-sm"
                                                        title="Phân quyền quản trị"
                                                        onClick={() => handlePromote(member.userId)}
                                                    >
                                                        <ShieldCheck size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="icon-btn-sm"
                                                        title="Hạ quyền thành viên"
                                                        onClick={() => handleDemote(member.userId)}
                                                    >
                                                        <Shield size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    className="icon-btn-sm danger"
                                                    title="Xóa khỏi nhóm"
                                                    onClick={() => handleRemoveMember(member.userId)}
                                                >
                                                    <UserMinus size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Leave group */}
                <button className="leave-group-btn" onClick={handleLeave}>
                    <LogOut size={18} /> Rời nhóm
                </button>
            </div>
        </div>
    );
};

export default GroupInfoPanel;
