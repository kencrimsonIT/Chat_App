import React, {useState} from "react";
import {Link} from "react-router-dom";
import chat2 from "../../assets/images/chat2.png";
import "./RegisterPage.scss";
import {User, Mail, Lock, SquareCheckBig, UserRoundPlus} from "lucide-react";

const RegisterPage = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleRegister = () => {

    }


    return (
        <div className="container">
            <div className="register-container">
                {/*Left Panel*/}
                <div className="left-panel">
                    <h1 className="page-title">Tạo tài khoản</h1>

                    {/*Username*/}
                    <div className="input-row">
                        <User />
                        <input
                            type="text"
                            placeholder="Tên tài khoản"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

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

                    {/*Password*/}
                    <div className="input-row">
                        <Lock />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {/*Password*/}
                    <div className="input-row">
                        <SquareCheckBig />
                        <input
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {/*Submit*/}
                    <button className="register-btn" onClick={handleRegister}>
                        Tạo tài khoản
                        <UserRoundPlus />
                    </button>
                </div>

                {/*Right Panel*/}
                <div className="right-panel">
                    <img src={chat2} alt="" />
                </div>
            </div>

            {/*Login Page Linking*/}
            <p className="to-login-text">
                Đã có tài khoản? <Link to="/login" className="to-login-link">Đăng nhập</Link>
            </p>
        </div>
    );
}

export default RegisterPage;