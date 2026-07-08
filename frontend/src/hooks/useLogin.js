import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../services/axios_instance";

const useLogin = () => {
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (username, password) => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await axiosInstance.post("/auth/login", {
                username,
                password,
            });

            authLogin(data);

            if (data.roles?.includes("ROLE_ADMIN")) {
                navigate("/admin");
            } else {
                navigate("/chat");
            }
        } catch (err) {
            const message = err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return { login, loading, error };
};

export default useLogin;