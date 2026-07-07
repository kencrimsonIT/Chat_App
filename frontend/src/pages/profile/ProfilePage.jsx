import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { 
    Camera, 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Calendar, 
    Edit3,
    Check,
    X,
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
    const [saving, setSaving] = useState(false);
    
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

        // Raw user data from API (no display-placeholder translations)
    const [rawUser, setRawUser] = useState(null);

    const [editForm, setEditForm] = useState({
        displayName: "",
        phone: "",
        location: "",
        bio: ""
    });

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
            setRawUser(data);
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

    const handleEdit = () => {
        // Use raw API data to avoid coupling with display strings
        setEditForm({
            displayName: rawUser?.fullName || rawUser?.username || "",
            phone: rawUser?.phone || "",
            location: rawUser?.location || "",
            bio: rawUser?.bio || ""
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedUser = await userService.updateProfile({
                fullName: editForm.displayName,
                phone: editForm.phone,
                location: editForm.location,
                bio: editForm.bio
            });
            setRawUser(updatedUser);
            setUserData(prev => ({
                ...prev,
                displayName: updatedUser.fullName || updatedUser.username,
                phone: updatedUser.phone || "Chưa cập nhật",
                location: updatedUser.location || "Chưa cập nhật",
                bio: updatedUser.bio || "Chưa có tiểu sử."
            }));
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
            alert("Cập nhật hồ sơ thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const handleEditChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
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
                            <div className={`info-item ${isEditing ? 'editing' : ''}`}>
                                <div className="icon-box"><Phone size={18} /></div>
                                <div className="info-detail">
                                    <label>Số điện thoại</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="edit-input"
                                            value={editForm.phone}
                                            onChange={(e) => handleEditChange('phone', e.target.value)}
                                            placeholder="Nhập số điện thoại"
                                        />
                                    ) : (
                                        <p>{userData.phone}</p>
                                    )}
                                </div>
                            </div>
                            <div className={`info-item ${isEditing ? 'editing' : ''}`}>
                                <div className="icon-box"><MapPin size={18} /></div>
                                <div className="info-detail">
                                    <label>Địa chỉ</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="edit-input"
                                            value={editForm.location}
                                            onChange={(e) => handleEditChange('location', e.target.value)}
                                            placeholder="Nhập địa chỉ"
                                        />
                                    ) : (
                                        <p>{userData.location}</p>
                                    )}
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
                        <div className={`bio-section ${isEditing ? 'editing' : ''}`}>
                            <h3>Tiểu sử</h3>
                            {isEditing ? (
                                <textarea
                                    className="edit-textarea"
                                    value={editForm.bio}
                                    onChange={(e) => handleEditChange('bio', e.target.value)}
                                    placeholder="Viết tiểu sử của bạn..."
                                    rows={4}
                                />
                            ) : (
                                <p>{userData.bio}</p>
                            )}
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
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="edit-display-name"
                                        value={editForm.displayName}
                                        onChange={(e) => handleEditChange('displayName', e.target.value)}
                                        placeholder="Nhập tên hiển thị"
                                    />
                                ) : (
                                    <h1 className="display-name">{userData.displayName}</h1>
                                )}
                                <p className="username">@{userData.username}</p>
                            </div>
                            <div className="action-buttons">
                                {isEditing ? (
                                    <>
                                        <button className="btn-cancel" onClick={handleCancel}>
                                            <X size={18} /> Hủy
                                        </button>
                                        <button className="btn-save" onClick={handleSave} disabled={saving}>
                                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                            {saving ? "Đang lưu..." : "Lưu"}
                                        </button>
                                    </>
                                ) : (
                                    <button className="btn-edit" onClick={handleEdit}>
                                        <Edit3 size={18} /> Chỉnh sửa hồ sơ
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="profile-content">
                    {/*<nav className="profile-tabs">*/}
                    {/*    <button */}
                    {/*        className={`tab-link ${activeTab === 'info' ? 'active' : ''}`}*/}
                    {/*        onClick={() => setActiveTab('info')}*/}
                    {/*    >*/}
                    {/*        <User size={18} />*/}
                    {/*        <span>Thông tin cá nhân</span>*/}
                    {/*    </button>*/}
                    {/*    /!*<button *!/*/}
                    {/*    /!*    className={`tab-link ${activeTab === 'security' ? 'active' : ''}`}*!/*/}
                    {/*    /!*    onClick={() => setActiveTab('security')}*!/*/}
                    {/*    /!*>*!/*/}
                    {/*    /!*    <ShieldCheck size={18} />*!/*/}
                    {/*    /!*    <span>Bảo mật</span>*!/*/}
                    {/*    /!*</button>*!/*/}
                    {/*    /!*<button *!/*/}
                    {/*    /!*    className={`tab-link ${activeTab === 'activity' ? 'active' : ''}`}*!/*/}
                    {/*    /!*    onClick={() => setActiveTab('activity')}*!/*/}
                    {/*    /!*>*!/*/}
                    {/*    /!*    <Activity size={18} />*!/*/}
                    {/*    /!*    <span>Hoạt động</span>*!/*/}
                    {/*    /!*</button>*!/*/}
                    {/*</nav>*/}

                    <div className="tab-content-area">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
