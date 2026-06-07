import React, { useState } from "react";
import { Search, Filter, MessageSquare, Users, Settings, MoreVertical } from "lucide-react";
import ConversationItem from "./ConversationItem";

const ChatSidebar = ({ conversations, activeId, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("all");

    const filteredConversations = conversations.filter(conv => 
        conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <aside className="chat-sidebar">
            <div className="sidebar-header">
                <div className="header-top">
                    <h1>Tin nhắn</h1>
                    <div className="header-actions">
                        <button className="icon-btn"><MoreVertical size={20} /></button>
                    </div>
                </div>

                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm cuộc trò chuyện..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-tabs">
                    <button 
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Tất cả
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        Chưa đọc
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'groups' ? 'active' : ''}`}
                        onClick={() => setFilter('groups')}
                    >
                        Nhóm
                    </button>
                </div>
            </div>

            <div className="conversations-list">
                {filteredConversations.length > 0 ? (
                    filteredConversations.map(conv => (
                        <ConversationItem 
                            key={conv.id} 
                            conversation={conv}
                            active={activeId === conv.id}
                            onClick={() => onSelect(conv.id)}
                        />
                    ))
                ) : (
                    <div className="empty-state">
                        <p>Không tìm thấy cuộc trò chuyện nào.</p>
                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                <nav className="bottom-nav">
                    <button className="nav-item active"><MessageSquare size={20} /><span>Trò chuyện</span></button>
                    <button className="nav-item"><Users size={20} /><span>Liên hệ</span></button>
                    <button className="nav-item"><Settings size={20} /><span>Cài đặt</span></button>
                </nav>
            </div>
        </aside>
    );
};

export default ChatSidebar;
