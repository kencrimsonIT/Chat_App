import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axios_instance";

const useResetPassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const resetPassword = async (token, newPassword, confirmNewPassword) => {
        setLoading(true);
        setError(null);
        setMessage(null);

        if (newPassword !== confirmNewPassword) {
            setError("Mật khẩu không khớp");
            setLoading(false);
            return;
        }

        try {
            const response = await axiosInstance.post("/auth/reset-password", {
                token,
                newPassword,
                confirmNewPassword
            });
            setMessage(response.data);
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            const message = err.response?.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return { resetPassword, loading, error, message };
};

export default useResetPassword;
