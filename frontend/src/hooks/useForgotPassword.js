import { useState } from "react";
import axiosInstance from "../services/axios_instance";

const useForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const forgotPassword = async (email) => {
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const response = await axiosInstance.post("/auth/forgot-password", { email });
            setMessage(response.data);
        } catch (err) {
            const message = err.response?.data?.message || "Gửi email thất bại. Vui lòng thử lại.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return { forgotPassword, loading, error, message };
};

export default useForgotPassword;
