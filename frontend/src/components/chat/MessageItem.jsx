import React from "react";

const MessageItem = ({ message, isMe }) => {
    const { text, time, senderAvatar } = message;

    return (
        <div className={`message-item-wrapper ${isMe ? 'me' : 'them'}`}>
            {!isMe && (
                <div className="message-avatar">
                    <img src={senderAvatar} alt="avatar" />
                </div>
            )}
            
            <div className="message-content">
                <div className="bubble">
                    <p>{text}</p>
                </div>
                <span className="message-time">{time}</span>
            </div>
        </div>
    );
};

export default MessageItem;
