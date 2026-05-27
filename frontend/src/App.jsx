import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import LoginPage from "./pages/login/LoginPage";
import RegisterPage from "./pages/register/RegisterPage";
import ForgotPasswordPage from "./pages/password-recovery/ForgotPasswordPage";
import RecoveryPasswordPage from "./pages/password-recovery/RecoveryPasswordPage";
import ProfilePage from "./pages/profile/ProfilePage";
import ChatPage from "./pages/chat/ChatPage";
import DashboardPage from "./pages/admin/dashboard/DashboardPage";
import "./App.scss";
import ChangePasswordPage from "./pages/change-password/ChangePasswordPage";
import HomePage from "./pages/home/HomePage";

const App = () => {
  const darkMode = useSelector((state) => state.theme.darkMode);

  return (
    <div className={`app-container ${darkMode ? "dark" : "light"}`}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/recovery-password" element={<RecoveryPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/" element={<HomePage />} />

          {/*Client side*/}
          <Route path="/chat" element={<ChatPage />} />

          {/*Admin side*/}
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
