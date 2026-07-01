import React from "react";
import { Users } from "lucide-react";
import defaultPfp from "../../assets/images/default-pfp.jpg";

const ConversationItem = ({ conversation, active, onClick }) => {
    const { name, lastMessage, time, unread, avatar, online, type } = conversation;
    const isGroup = type === "GROUP";

    return (
        <div 
            className={`conversation-item ${active ? 'active' : ''} ${isGroup ? 'group-conv' : ''}`} 
            onClick={onClick}
        >
            <div className="avatar-wrapper">
                {isGroup ? (
                    <div className="group-avatar">
                        <span>{(name || "G")[0].toUpperCase()}</span>
                    </div>
                ) : (
                    <>
                        <img src={avatar || defaultPfp} alt={name} className="avatar" />
                        {online && <span className="online-indicator"></span>}
                    </>
                )}
            </div>
            
            <div className="content">
                <div className="header">
                    <h4 className="name">
                        {name}
                        {isGroup && <Users size={12} className="group-icon" />}
                    </h4>
                    <span className="time">{time}</span>
                </div>
                <div className="footer">
                    <p className="last-message">{lastMessage}</p>
                    {unread > 0 && <span className="unread-badge">{unread}</span>}
                </div>
            </div>
        </div>
    );
};

export default ConversationItem;
