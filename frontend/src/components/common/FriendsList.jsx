import React from "react";
import { MessageSquare, Ban } from "lucide-react";

const FriendList = ({ friends, onStartChat, onBlockUser }) => {
    const handleBlock = (e, userId) => {
        e.stopPropagation();
        if (window.confirm("Bạn có chắc muốn chặn người dùng này?")) {
            if (onBlockUser) onBlockUser(userId);
        }
    };

    return (
        <div className="friend-list-section">
            <h3 className="section-title">Bạn bè ({friends.length})</h3>
            {friends.length > 0 ? (
                <ul className="contacts-list-inner">
                    {friends.map(friend => (
                        <li key={friend.id} className="contact-item">
                            <div className="contact-info">
                                <img
                                    src={friend.avatarUrl || "/assets/images/default-pfp.jpg"}
                                    alt={friend.username}
                                    className="avatar"
                                />
                                <div className="contact-details">
                                    <p className="name">{friend.fullName || friend.username}</p>
                                    <p className="status-text">Active</p>
                                </div>
                            </div>
                            <div className="action-buttons">
                                <button className="icon-btn" onClick={() => onStartChat(friend)} title="Nhắn tin">
                                    <MessageSquare size={18} />
                                </button>
                                <button
                                    className="icon-btn danger"
                                    onClick={(e) => handleBlock(e, friend.id)}
                                    title="Chặn người dùng"
                                >
                                    <Ban size={18} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty-state">Chưa có bạn bè nào trong danh bạ.</p>
            )}
        </div>
    );
};

export default FriendList;