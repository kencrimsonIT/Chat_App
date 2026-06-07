import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { 
    Camera, 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Calendar, 
    ShieldCheck, 
    Activity, 
    Edit3,
    Check,
    X,
    Lock,
    Loader2
} from "lucide-react";
import "./ProfilePage.scss";
import defaultPfp from "../../assets/images/default-pfp.jpg";
import userService from "../../services/userService";

const ProfilePage = () => {
    const darkMode = useSelector((state) => state.theme.darkMode);
    const [activeTab, setActiveTab] = useState("info");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const [userData, setUserData] = useState({
        displayName: "",
        username: "",
        email: "",
        phone: "",
        location: "",
        bio: "",
        joinDate: "",
        avatar: defaultPfp,
        cover: ""
    });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const data = await userService.getCurrentUser();
            setUserData({
                displayName: data.fullName || data.username,
                username: data.username,
                email: data.email,
                phone: data.phone || "Chưa cập nhật",
                location: data.location || "Chưa cập nhật",
                bio: data.bio || "Chưa có tiểu sử.",
                joinDate: new Date(data.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
                avatar: data.avatarUrl || defaultPfp,
                cover: data.coverUrl || ""
            });
        } catch (err) {
            console.error("Failed to fetch user data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = () => {
        avatarInputRef.current.click();
    };

    const handleCoverClick = () => {
        coverInputRef.current.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const newAvatarUrl = await userService.uploadAvatar(file);
            setUserData(prev => ({ ...prev, avatar: newAvatarUrl }));
            // Update localStorage if needed
            localStorage.setItem("avatarUrl", newAvatarUrl);
        } catch (err) {
            alert("Lỗi khi tải ảnh đại diện lên");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleCoverChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingCover(true);
        try {
            const newCoverUrl = await userService.uploadCover(file);
            setUserData(prev => ({ ...prev, cover: newCoverUrl }));
        } catch (err) {
            alert("Lỗi khi tải ảnh nền lên");
        } finally {
            setUploadingCover(false);
        }
    };

    const handleSave = () => {
        setIsEditing(false);
        // Save profile logic (e.g. bio, location) could be added here
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "info":
                return (
                    <div className="tab-pane fade-in">
                        <div className="info-grid">
                            <div className="info-item">
                                <div className="icon-box"><Mail size={18} /></div>
                                <div className="info-detail">
                                    <label>Email</label>
                                    <p>{userData.email}</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="icon-box"><Phone size={18} /></div>
                                <div className="info-detail">
                                    <label>Số điện thoại</label>
                                    <p>{userData.phone}</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="icon-box"><MapPin size={18} /></div>
                                <div className="info-detail">
                                    <label>Địa chỉ</label>
                                    <p>{userData.location}</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="icon-box"><Calendar size={18} /></div>
                                <div className="info-detail">
                                    <label>Ngày tham gia</label>
                                    <p>{userData.joinDate}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bio-section">
                            <h3>Tiểu sử</h3>
                            <p>{userData.bio}</p>
                        </div>
                    </div>
                );
            case "security":
                return (
                    <div className="tab-pane fade-in">
                        <div className="security-list">
                            <div className="security-item">
                                <div className="security-info">
                                    <Lock size={20} />
                                    <div>
                                        <h4>Đổi mật khẩu</h4>
                                        <p>Cập nhật mật khẩu thường xuyên để bảo vệ tài khoản</p>
                                    </div>
                                </div>
                                <button className="btn-outline-sm">Thay đổi</button>
                            </div>
                            <div className="security-item">
                                <div className="security-info">
                                    <ShieldCheck size={20} />
                                    <div>
                                        <h4>Xác thực 2 lớp</h4>
                                        <p>Tăng cường bảo mật bằng mã xác thực OTP</p>
                                    </div>
                                </div>
                                <button className="btn-outline-sm">Thiết lập</button>
                            </div>
                        </div>
                    </div>
                );
            case "activity":
                return (
                    <div className="tab-pane fade-in">
                        <div className="activity-placeholder">
                            <Activity size={48} className="muted-icon" />
                            <p>Không có hoạt động gần đây để hiển thị.</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="profile-page-container">
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div className={`profile-page-container ${darkMode ? "dark-theme" : ""}`}>
            <input 
                type="file" 
                ref={avatarInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
            />
            <input 
                type="file" 
                ref={coverInputRef} 
                onChange={handleCoverChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
            />

            <div className="profile-card">
                {/* Header Section */}
                <div className="profile-header">
                    <div className="cover-photo">
                        {userData.cover ? (
                            <img src={userData.cover} alt="Cover" />
                        ) : (
                            <div className="cover-placeholder"></div>
                        )}
                        <button 
                            className="edit-cover-btn" 
                            onClick={handleCoverClick}
                            disabled={uploadingCover}
                        >
                            {uploadingCover ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                            <span>{uploadingCover ? "Đang tải..." : "Thay đổi ảnh nền"}</span>
                        </button>
                    </div>
                    
                    <div className="header-main">
                        <div className="avatar-wrapper">
                            <div className="avatar-container">
                                <img src={userData.avatar} alt="Avatar" />
                                <button 
                                    className="change-avatar-btn" 
                                    onClick={handleAvatarClick}
                                    disabled={uploadingAvatar}
                                >
                                    {uploadingAvatar ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="user-identity">
                            <div className="identity-text">
                                <h1 className="display-name">{userData.displayName}</h1>
                                <p className="username">@{userData.username}</p>
                            </div>
                            <div className="action-buttons">
                                {isEditing ? (
                                    <>
                                        <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                                            <X size={18} /> Hủy
                                        </button>
                                        <button className="btn-save" onClick={handleSave}>
                                            <Check size={18} /> Lưu
                                        </button>
                                    </>
                                ) : (
                                    <button className="btn-edit" onClick={() => setIsEditing(true)}>
                                        <Edit3 size={18} /> Chỉnh sửa hồ sơ
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">124</span>
                            <span className="stat-label">Bạn bè</span>
                        </div>
                        <div className="divider" />
                        <div className="stat-item">
                            <span className="stat-value">42</span>
                            <span className="stat-label">Nhóm</span>
                        </div>
                        <div className="divider" />
                        <div className="stat-item">
                            <span className="stat-value">1.2k</span>
                            <span className="stat-label">Tin nhắn</span>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="profile-content">
                    <nav className="profile-tabs">
                        <button 
                            className={`tab-link ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            <User size={18} />
                            <span>Thông tin cá nhân</span>
                        </button>
                        <button 
                            className={`tab-link ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <ShieldCheck size={18} />
                            <span>Bảo mật</span>
                        </button>
                        <button 
                            className={`tab-link ${activeTab === 'activity' ? 'active' : ''}`}
                            onClick={() => setActiveTab('activity')}
                        >
                            <Activity size={18} />
                            <span>Hoạt động</span>
                        </button>
                    </nav>

                    <div className="tab-content-area">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
