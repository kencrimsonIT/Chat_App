import React, { useState, useEffect } from "react";
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
    UserPlus,
    Activity,
    Shield,
    Loader2
} from "lucide-react";
import { toggleTheme } from "../../../redux/slices/themeSlice";
import "./DashboardPage.scss";
import defaultPfp from "../../../assets/images/default-pfp.jpg";
import adminService from "../../../services/adminService";

const DashboardPage = () => {
    const [activeTab, setActiveTab] = useState("overview");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const dispatch = useDispatch();
    const darkMode = useSelector((state) => state.theme.darkMode);

    useEffect(() => {
        if (activeTab === "users") {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAllUsers();
            setUsers(data);
            setError(null);
        } catch (err) {
            setError("Không thể tải danh sách người dùng");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeAdmin = async (userId) => {
        try {
            await adminService.revokeAdmin(userId);
            // Refresh the list
            fetchUsers();
        } catch (err) {
            alert("Lỗi khi thu hồi quyền ADMIN");
            console.error(err);
        }
    };

    const handleGrantAdmin = async (userId) => {
        try {
            await adminService.assignAdmin(userId);
            // Refresh the list
            fetchUsers();
        } catch (err) {
            alert("Lỗi khi cấp quyền ADMIN");
            console.error(err);
        }
    };

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
                        <button 
                            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <LayoutDashboard size={20} />
                            <span>Tổng quan</span>
                        </button>
                        <button 
                            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <Users size={20} />
                            <span>Người dùng</span>
                        </button>
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

                {/* Dashboard Body */}
                <div className="dashboard-body">
                    {activeTab === 'overview' ? (
                        <>
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
                        </>
                    ) : (
                        /* User List Section */
                        <div className="content-card">
                            <div className="card-header">
                                <h2>Danh sách người dùng</h2>
                                <button className="btn-primary">
                                    <UserPlus size={18} />
                                    Thêm người dùng
                                </button>
                            </div>
                            
                            {loading ? (
                                <div className="loading-state" style={{ padding: '50px', display: 'flex', justifyContent: 'center' }}>
                                    <Loader2 className="animate-spin" size={40} />
                                </div>
                            ) : error ? (
                                <div className="error-state" style={{ padding: '50px', textAlign: 'center', color: '#ef4444' }}>
                                    <p>{error}</p>
                                    <button onClick={fetchUsers} className="view-all-btn" style={{ marginTop: '10px' }}>Thử lại</button>
                                </div>
                            ) : (
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
                                            {users.map(user => {
                                                const isAdmin = user.roles.includes("ROLE_ADMIN");
                                                return (
                                                    <tr key={user.id}>
                                                        <td>
                                                            <div className="table-user">
                                                                <img src={user.avatarUrl || defaultPfp} alt={user.fullName || user.username} />
                                                                <span>{user.fullName || user.username}</span>
                                                            </div>
                                                        </td>
                                                        <td>{user.email}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                                {user.roles.map(role => (
                                                                    <span key={role} className={`role-badge ${role.toLowerCase().replace('role_', '')}`}>
                                                                        {role.replace('ROLE_', '')}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className={`status-indicator ${user.isActive ? 'online' : 'offline'}`}>
                                                                <span className="dot"></span>
                                                                {user.isActive ? 'Active' : 'Inactive'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="actions-cell">
                                                                {isAdmin ? (
                                                                    <button 
                                                                        className="revoke-btn"
                                                                        onClick={() => handleRevokeAdmin(user.id)}
                                                                    >
                                                                        Thu hồi
                                                                    </button>
                                                                ) : (
                                                                    <button 
                                                                        className="grant-btn"
                                                                        onClick={() => handleGrantAdmin(user.id)}
                                                                    >
                                                                        Cấp quyền
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="card-footer">
                                <button className="view-all-btn">Xem tất cả người dùng</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default DashboardPage;
