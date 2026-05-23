import React, {useState} from "react";
import {useSearchParams} from "react-router-dom";
import ShieldCheck from "../../assets/images/8182940.png";
import "./RecoveryPasswordPage.scss";
import {Lock, SquareCheckBig, CheckCheck} from "lucide-react";
import useResetPassword from "../../hooks/useResetPassword";

const RecoveryPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword]= useState("");
    const [confirmNewPassword, setConfirmNewPassword]= useState("");

    const {resetPassword: executeReset, loading, error, message} = useResetPassword();

    const handleReset = () => {
        if (!newPassword || !confirmNewPassword || !token) return;
        executeReset(token, newPassword, confirmNewPassword);
    }

    return (
        <div className="container">
            <div className="recovery-password-panel">
                <img src={ShieldCheck} alt="" />

                <h1 className="page-title">Đặt lại mật khẩu</h1>

                {/*Feedback Messages*/}
                {error && <p className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</p>}
                {message && <p className="success-message" style={{color: 'green', marginBottom: '10px'}}>{message}</p>}

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

                {/*Reset Button*/}
                <button 
                    className="reset-btn" 
                    onClick={handleReset}
                    disabled={loading}
                >
                    {loading ? "Đang xác nhận..." : "Xác nhận"}
                    {!loading && <CheckCheck />}
                </button>
            </div>
        </div>
    );
}

export default RecoveryPasswordPage;