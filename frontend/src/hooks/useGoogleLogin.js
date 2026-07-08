import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../services/axios_instance";

const useGoogleLogin = () => {
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const googleLogin = async (accessToken) => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await axiosInstance.post("/auth/google", {
                accessToken,
            });

            authLogin(data);

            if (data.roles?.includes("ROLE_ADMIN")) {
                navigate("/admin");
            } else {
                navigate("/chat");
            }
        } catch (err) {
            const message = err.response?.data?.message || "Đăng nhập bằng Google thất bại. Vui lòng thử lại.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return { googleLogin, loading, error };
};

export default useGoogleLogin;