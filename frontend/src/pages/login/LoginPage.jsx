import React, {useState} from "react";
import {Link} from "react-router-dom";
import './LoginPage.scss';
import chat from "../../assets/images/chat.png";
import { User, Lock, LogIn } from 'lucide-react';
import {SiGoogle,  SiFacebook} from "@icons-pack/react-simple-icons";
import { useGoogleLogin as useGoogleOAuth } from '@react-oauth/google';
import useLogin from "../../hooks/useLogin";
import useGoogleLogin from "../../hooks/useGoogleLogin";

const LoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const {login, loading, error} = useLogin();
    const {googleLogin, loading: googleLoading, error: googleError} = useGoogleLogin();

    const loginWithGoogle = useGoogleOAuth({
        onSuccess: tokenResponse => {
            googleLogin(tokenResponse.access_token);
        },
        onError: () => {
            console.log('Google Login Failed');
        },
    });

    const handleLogin = () => {
        login(username, password);
    }

    return (
        <div className="container">
            <div className="login-container">
                {/*Left Panel*/}
                <div className="left-panel">
                    <img src={chat} alt="" />
                </div>

                {/*Right Panel*/}
                <div className="right-panel">
                    <h1 className="page-title">Đăng nhập</h1>

                    {/*Error Message*/}
                    {(error || googleError) && (
                        <p className="error-message">{error || googleError}</p>
                    )}

                    {/*Username*/}
                    <div className="input-row">
                        <User />
                        <input
                            type="text"
                            placeholder="Tên đăng nhập"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    {/*Password*/}
                    <div className="input-row">
                        <Lock />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {/*Forgot password?*/}
                    <div className="forgot-row">
                        <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
                    </div>

                    {/*Submit*/}
                    <button
                        className="login-btn"
                        onClick={handleLogin}
                        disabled={loading || googleLoading}
                    >
                        {(loading || googleLoading) ? "Đang xử lý..." : "Đăng nhập"}
                        {!(loading || googleLoading) && <LogIn />}
                    </button>

                    {/*Divider*/}
                    <div className="divider">
                        <div className="divider-line" />
                        <span className="divider-text">Hoặc đăng nhập với</span>
                        <div className="divider-line" />
                    </div>

                    {/*Third party login*/}
                    <div className="social-row">
                        <button 
                            className="social-btn" 
                            title="Google"
                            onClick={() => loginWithGoogle()}
                            disabled={googleLoading}
                        >
                            <SiGoogle color="#CC0000" />
                            <span>Google</span>
                        </button>
                        <button className="social-btn" title="Facebook">
                            <SiFacebook color="#0866FF" />
                            <span>Facebook</span>
                        </button>
                    </div>
                </div>
            </div>

            {/*Register Page Linking*/}
            <p className="register-text">
                Chưa có tài khoản? <Link to="/register" className="register-link">Tạo tài khoản</Link>
            </p>
        </div>
    );
}

export default LoginPage;