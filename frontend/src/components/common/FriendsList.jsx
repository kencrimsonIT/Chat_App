import React from "react";
import { MessageSquare } from "lucide-react";

const FriendList = ({ friends, onStartChat }) => {
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
                            <button className="icon-btn" onClick={() => onStartChat(friend)}>
                                <MessageSquare size={18} />
                            </button>
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