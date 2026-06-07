import React from "react";
import defaultPfp from "../../assets/images/default-pfp.jpg";

const ConversationItem = ({ conversation, active, onClick }) => {
    const { name, lastMessage, time, unread, avatar, online } = conversation;

    return (
        <div 
            className={`conversation-item ${active ? 'active' : ''}`} 
            onClick={onClick}
        >
            <div className="avatar-wrapper">
                <img src={avatar || defaultPfp} alt={name} className="avatar" />
                {online && <span className="online-indicator"></span>}
            </div>
            
            <div className="content">
                <div className="header">
                    <h4 className="name">{name}</h4>
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
