import React, {useState} from "react";
import "./ProfilePage.scss";
import defaultPfp from "../../assets/images/default-pfp.jpg";
import {PenLine, Camera, Info} from "lucide-react";

const ProfilePage = () => {
    const [profile, setProfile] = useState({
        displayName: "Kent Paul",
        username: "kent_paul@1983",
        bio: "Vẫn còn là một bí ẩn...",
        avatar: defaultPfp,
        coverPhoto: ""
    });
    const [isEditing, setIsEditing] = useState(false);

    const handleChangeAvatar = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setProfile((prevProfile) => ({
                        ...prevProfile,
                        avatar: event.target.result
                    }));
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    const handleEdit = () => {
        setIsEditing(!isEditing);
    }

    return (
        <div className="profile-container">
            {/*Upper Panel - Cover photo*/}
            <div className="upper-panel">
                <img
                    src={profile.backgroundImage}
                    alt="Background"
                    className="profile-background-image"
                />

                <button className="camera-btn" onClick={handleChangeAvatar}>
                    Thêm ảnh nền <Camera />
                </button>
            </div>

            {/*Lower Panel - Profile Content*/}
            <div className="lower-panel">
                {/*Avatar*/}
                <div className="avatar-section">
                    <div className="avatar-container">
                        <img
                            src={profile.avatar}
                            alt={profile.displayName}
                            className="avatar"
                        />
                    </div>

                    {/*User info*/}
                    <div className="user-info">
                        <div className="user-header">
                            <div className="user-text">
                                <h1 className="user-display-name">{profile.displayName}</h1>
                                <p className="user-username">{profile.username}</p>
                            </div>

                            <button className="edit-btn" onClick={handleEdit}>
                                <span>Chỉnh sửa</span>
                                <PenLine />
                            </button>
                        </div>
                    </div>
                </div>

                {/*Bio*/}
                <div className="bio">
                    <div className="bio-header">
                        <Info />
                        <h2 className="bio-title">Tiểu sử</h2>
                    </div>

                    <p className="bio-text">{profile.bio}</p>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;