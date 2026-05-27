import { useState } from "react";
import axiosInstance from "../services/axios_instance";

const useChangePassword = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const response = await axiosInstance.post("/auth/change-password", {
                currentPassword,
                newPassword,
                confirmNewPassword
            });
            setMessage(response.data);
            setLoading(false);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || "Đã xảy ra lỗi khi đổi mật khẩu.");
            setLoading(false);
            return false;
        }
    };

    return { changePassword, loading, error, message };
};

export default useChangePassword;
