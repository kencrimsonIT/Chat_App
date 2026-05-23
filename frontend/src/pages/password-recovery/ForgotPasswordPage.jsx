import React, {useState} from "react";
import "./ForgotPasswordPage.scss";
import LockPassword from "../../assets/images/5321806.png";
import {Mail, Forward} from "lucide-react";
import {Link} from "react-router-dom";
import useForgotPassword from "../../hooks/useForgotPassword";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const {forgotPassword, loading, error, message} = useForgotPassword();

    const sendEmail = () => {
        if (!email) return;
        forgotPassword(email);
    }

    return (
        <div className="container">
            <div className="forgot-password-panel">
                <img src={LockPassword} alt="" />

                <h1 className="page-title">Quên mật khẩu?</h1>

                {/*Feedback Messages*/}
                {error && <p className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</p>}
                {message && <p className="success-message" style={{color: 'green', marginBottom: '10px'}}>{message}</p>}

                {/*Email*/}
                <div className="input-row">
                    <Mail />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {/*Send Button*/}
                <button 
                    className="send-btn" 
                    onClick={sendEmail}
                    disabled={loading}
                >
                    {loading ? "Đang gửi..." : "Gửi"}
                    {!loading && <Forward />}
                </button>
            </div>

            {/*Login Page Linking*/}
            <p className="login-text">
                Đã nhớ mật khẩu? <Link to="/login" className="login-link">Đăng nhập</Link>
            </p>
        </div>
    );
}

export default ForgotPasswordPage;