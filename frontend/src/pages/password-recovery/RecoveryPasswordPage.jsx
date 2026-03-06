import React, {useState} from "react";
import ShieldCheck from "../../assets/images/8182940.png";
import "./RecoveryPasswordPage.scss";
import {Lock, SquareCheckBig, CheckCheck} from "lucide-react";

const RecoveryPasswordPage = () => {
    const [newPassword, setNewPassword]= useState("");
    const [confirmNewPassword, setConfirmNewPassword]= useState("");

    const resetPassword = () => {

    }

    return (
        <div className="container">
            <div className="recovery-password-panel">
                <img src={ShieldCheck} alt="" />

                <h1 className="page-title">Đặt lại mật khẩu</h1>

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
                <button className="reset-btn" onClick={resetPassword}>
                    Xác nhận
                    <CheckCheck />
                </button>
            </div>
        </div>
    );
}

export default RecoveryPasswordPage;