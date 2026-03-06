import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import LoginPage from "./pages/login/LoginPage";
import RegisterPage from "./pages/register/RegisterPage";
import ForgotPasswordPage from "./pages/password-recovery/ForgotPasswordPage";
import RecoveryPasswordPage from "./pages/password-recovery/RecoveryPasswordPage";

const App = () => {
  return (
    <Router>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<RecoveryPasswordPage />} />
        </Routes>
    </Router>
  );
}

export default App;
