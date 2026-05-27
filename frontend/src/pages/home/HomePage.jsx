import React from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MessageCircle, ShieldCheck, Zap, LogIn, UserPlus, Sun, Moon } from 'lucide-react';
import { toggleTheme } from "../../redux/slices/themeSlice";
import "./HomePage.scss";
import chatHero from "../../assets/images/chat-hero.png";

const HomePage = () => {
    const dispatch = useDispatch();
    const darkMode = useSelector((state) => state.theme.darkMode);

    return (
        <div className="home-container">
            {/* Navigation */}
            <nav className="navbar">
                <div className="logo">
                    <MessageCircle size={32} />
                    <span>MessApp</span>
                </div>
                <div className="nav-links">
                    <button 
                        className="theme-toggle" 
                        onClick={() => dispatch(toggleTheme())}
                        title={darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <Link to="/login" className="nav-btn login">
                        <LogIn size={18} />
                        <span>Đăng nhập</span>
                    </Link>
                    <Link to="/register" className="nav-btn register">
                        <UserPlus size={18} />
                        <span>Đăng ký</span>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Kết nối mọi lúc, <br /> mọi nơi với <span>MessApp</span></h1>
                    <p className="hero-description">
                        Trải nghiệm nền tảng nhắn tin thời gian thực hiện đại, 
                        bảo mật và hoàn toàn miễn phí. Bắt đầu trò chuyện với 
                        bạn bè ngay hôm nay!
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="cta-button primary">
                            Bắt đầu ngay
                        </Link>
                        <Link to="/login" className="cta-button secondary">
                            Tìm hiểu thêm
                        </Link>
                    </div>
                </div>
                <div className="hero-image">
                    <img src={chatHero} alt="MessApp Hero" />
                </div>
            </header>

            {/* Features Section */}
            <section className="features-section">
                <div className="feature-card">
                    <div className="icon-wrapper">
                        <Zap size={32} />
                    </div>
                    <h3>Trò chuyện tức thì</h3>
                    <p>Nhắn tin nhanh chóng với tốc độ phản hồi cực cao.</p>
                </div>
                <div className="feature-card">
                    <div className="icon-wrapper">
                        <ShieldCheck size={32} />
                    </div>
                    <h3>Bảo mật tuyệt đối</h3>
                    <p>Dữ liệu của bạn luôn được mã hóa và bảo vệ an toàn.</p>
                </div>
                <div className="feature-card">
                    <div className="icon-wrapper">
                        <MessageCircle size={32} />
                    </div>
                    <h3>Giao diện thân thiện</h3>
                    <p>Trải nghiệm mượt mà, dễ dàng sử dụng trên mọi thiết bị.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <p>&copy; 2024 MessApp. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default HomePage;
