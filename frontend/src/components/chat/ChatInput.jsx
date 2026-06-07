import React, { useState } from "react";
import { Plus, Smile, Send, Paperclip, Image } from "lucide-react";

const ChatInput = ({ onSend }) => {
    const [text, setText] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onSend(text);
            setText("");
        }
    };

    return (
        <div className="chat-input-container">
            <div className="input-actions-left">
                <button className="icon-btn" title="Đính kèm"><Paperclip size={20} /></button>
                <button className="icon-btn" title="Gửi ảnh"><Image size={20} /></button>
            </div>

            <form className="input-form" onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="Nhập tin nhắn..." 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <button className="emoji-btn"><Smile size={20} /></button>
                <button 
                    type="submit" 
                    className={`send-btn ${text.trim() ? 'active' : ''}`}
                    disabled={!text.trim()}
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatInput;
