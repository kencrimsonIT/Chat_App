import React from "react";
import { Check, X } from "lucide-react";

const FriendRequestList = ({ pendingRequests, onAccept, onDecline }) => {
    if (pendingRequests.length === 0) return null;

    return (
        <div className="friend-requests-section">
            <h3 className="section-title">Lời mời kết bạn ({pendingRequests.length})</h3>
            <ul className="requests-list-inner">
                {pendingRequests.map(request => (
                    <li key={request.id} className="request-item">
                        <div className="contact-info">
                            <img
                                src={request.sender.avatarUrl || "/assets/images/default-pfp.jpg"}
                                alt={request.sender.username}
                                className="avatar"
                            />
                            <div className="contact-details">
                                <p className="name">{request.sender.fullName || request.sender.username}</p>
                            </div>
                        </div>
                        <div className="action-buttons">
                            <button className="accept-btn" onClick={() => onAccept(request.id)}>
                                <Check size={16} />
                            </button>
                            <button className="decline-btn" onClick={() => onDecline(request.id)}>
                                <X size={16} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FriendRequestList;