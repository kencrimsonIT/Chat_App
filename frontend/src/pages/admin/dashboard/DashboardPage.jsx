import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
    LayoutDashboard, 
    Users, 
    Settings, 
    LogOut, 
    MessageCircle, 
    Sun, 
    Moon, 
    Search, 
    Bell,
    MoreVertical,
    UserPlus,
    Activity,
    Shield
} from "lucide-react";
import { toggleTheme } from "../../../redux/slices/themeSlice";
import "./DashboardPage.scss";
import defaultPfp from "../../../assets/images/default-pfp.jpg";

const DashboardPage = () => {
    const dispatch = useDispatch();
    const darkMode = useSelector((state) => state.theme.darkMode);

    const mockUsers = [
        { id: 1, name: "Kent Paul", email: "kent_paul@1983", role: "ADMIN", status: "Online" },
        { id: 2, name: "Tommy Vercetti", email: "tommy@vicecity.com", role: "USER", status: "Offline" },
        { id: 3, name: "Lance Vance", email: "lance@dance.com", role: "USER", status: "Away" },
        { id: 4, name: "Ken Rosenberg", email: "ken@lawyer.com", role: "USER", status: "Online" },
        { id: 5, name: "Ricardo Diaz", email: "diaz@mansion.com", role: "USER", status: "Offline" },
    ];

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        <MessageCircle size={28} />
                    </div>
                    <span>MessApp Admin</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-group">
                        <p className="group-title">Menu</p>
                        <a href="#" className="nav-item active">
                            <LayoutDashboard size={20} />
                            <span>Tổng quan</span>
                        </a>
                        <a href="#" className="nav-item">
                            <Users size={20} />
                            <span>Người dùng</span>
                        </a>
                        <a href="#" className="nav-item">
                            <Shield size={20} />
                            <span>Quyền hạn</span>
                        </a>
                    </div>

                    <div className="nav-group">
                        <p className="group-title">Hệ thống</p>
                        <a href="#" className="nav-item">
                            <Activity size={20} />
                            <span>Hoạt động</span>
                        </a>
                        <a href="#" className="nav-item">
                            <Settings size={20} />
                            <span>Cài đặt</span>
                        </a>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn">
                        <LogOut size={20} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-search">
                        <Search size={20} />
                        <input type="text" placeholder="Tìm kiếm người dùng, tác vụ..." />
                    </div>

                    <div className="header-actions">
                        <button 
                            className="icon-btn theme-toggle" 
                            onClick={() => dispatch(toggleTheme())}
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="icon-btn notification">
                            <Bell size={20} />
                            <span className="badge"></span>
                        </button>
                        <div className="user-profile">
                            <img src={defaultPfp} alt="Admin" />
                            <div className="profile-info">
                                <p className="name">Admin</p>
                                <p className="role">Quản trị viên</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Overview */}
                <div className="dashboard-body">
                    <div className="welcome-section">
                        <h1>Chào mừng trở lại, Admin! 👋</h1>
                        <p>Dưới đây là những gì đang diễn ra với hệ thống của bạn hôm nay.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon users">
                                <Users size={24} />
                            </div>
                            <div className="stat-data">
                                <p className="label">Tổng người dùng</p>
                                <p className="value">1,248</p>
                                <p className="trend positive">+12% tháng này</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon active">
                                <Activity size={24} />
                            </div>
                            <div className="stat-data">
                                <p className="label">Đang trực tuyến</p>
                                <p className="value">156</p>
                                <p className="trend positive">+5% so với hôm qua</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon messages">
                                <MessageCircle size={24} />
                            </div>
                            <div className="stat-data">
                                <p className="label">Tin nhắn hôm nay</p>
                                <p className="value">8,432</p>
                                <p className="trend positive">+18% tăng trưởng</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon roles">
                                <Shield size={24} />
                            </div>
                            <div className="stat-data">
                                <p className="label">Quản trị viên</p>
                                <p className="value">12</p>
                                <p className="trend">Ổn định</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Users Table */}
                    <div className="content-card">
                        <div className="card-header">
                            <h2>Người dùng mới gần đây</h2>
                            <button className="btn-primary">
                                <UserPlus size={18} />
                                Thêm người dùng
                            </button>
                        </div>
                        <div className="table-responsive">
                            <table className="user-table">
                                <thead>
                                    <tr>
                                        <th>Người dùng</th>
                                        <th>Email</th>
                                        <th>Vai trò</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="table-user">
                                                    <img src={defaultPfp} alt={user.name} />
                                                    <span>{user.name}</span>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`role-badge ${user.role.toLowerCase()}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={`status-indicator ${user.status.toLowerCase()}`}>
                                                    <span className="dot"></span>
                                                    {user.status}
                                                </div>
                                            </td>
                                            <td>
                                                <button className="action-btn">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="card-footer">
                            <button className="view-all-btn">Xem tất cả người dùng</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DashboardPage;
