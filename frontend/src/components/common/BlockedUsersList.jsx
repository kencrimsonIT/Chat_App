import React from "react";
import { Ban, UserCheck } from "lucide-react";

const BlockedUsersList = ({ blockedUsers, onUnblock }) => {
    return (
        <div className="blocked-users-section">
            <h3 className="section-title">
                <Ban size={14} />
                <span>Đã chặn ({blockedUsers.length})</span>
            </h3>
            {blockedUsers.length > 0 ? (
                <ul className="blocked-list-inner">
                    {blockedUsers.map(user => (
                        <li key={user.id} className="blocked-item">
                            <div className="contact-info">
                                <div className="blocked-avatar">
                                    <span>{(user.fullName || user.username || "?")[0].toUpperCase()}</span>
                                </div>
                                <div className="contact-details">
                                    <p className="name">{user.fullName || user.username}</p>
                                    <p className="status-text blocked">Đã chặn</p>
                                </div>
                            </div>
                            <button
                                className="unblock-btn"
                                onClick={() => onUnblock(user.id)}
                                title="Bỏ chặn"
                            >
                                <UserCheck size={16} />
                                <span>Bỏ chặn</span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty-state">Bạn chưa chặn ai.</p>
            )}
        </div>
    );
};

export default BlockedUsersList;
