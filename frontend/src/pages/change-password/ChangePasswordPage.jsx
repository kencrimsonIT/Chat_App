import React, {useState} from "react";
import PasswordField from "../../assets/images/password.png";
import "./ChangePasswordPage.scss";
import {Lock, SquareCheckBig, Save} from "lucide-react";
import useChangePassword from "../../hooks/useChangePassword";

const ChangePasswordPage = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const { changePassword, loading, error, message } = useChangePassword();

    const handleChange = async () => {
        const success = await changePassword(currentPassword, newPassword, confirmNewPassword);
        if (success) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        }
    }

    return (
        <div className="container">
            <div className="change-password-panel">
                <img src={PasswordField} alt="" />

                <h1 className="page-title">Đổi mật khẩu</h1>

                {/*Feedback Messages*/}
                {error && <p className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</p>}
                {message && <p className="success-message" style={{color: 'green', marginBottom: '10px'}}>{message}</p>}

                {/*Current Password*/}
                <div className="input-row">
                    <Lock />
                    <input
                        type="password"
                        placeholder="Nhập mật khẩu hiện tại"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                    />
                </div>

                {/*New Password*/}
                <div className="input-row">
                    <Lock />
                    <input
                        type="password"
                        placeholder="Mật khẩu mới"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                    />
                </div>

                {/*Confirm New Password*/}
                <div className="input-row">
                    <SquareCheckBig />
                    <input
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                    />
                </div>

                {/*Save Button*/}
                <button
                    className="save-btn"
                    onClick={handleChange}
                    disabled={loading}
                >
                    {loading ? "Đang lưu..." : "Lưu"}
                    {!loading && <Save />}
                </button>

            </div>
        </div>
    );
}

export default ChangePasswordPage;
