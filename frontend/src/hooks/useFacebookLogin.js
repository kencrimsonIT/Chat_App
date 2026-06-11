import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axios_instance";

const useFacebookLogin = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const facebookLogin = async (accessToken) => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await axiosInstance.post("/auth/facebook", {
                accessToken,
            });

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("username", data.username);
            localStorage.setItem("email", data.email);
            localStorage.setItem("roles", JSON.stringify(data.roles));

            if (data.roles.includes("ROLE_ADMIN")) {
                navigate("/admin");
            } else {
                navigate("/chat");
            }
        } catch (err) {
            const message = err.response?.data?.message || "Đăng nhập bằng Facebook thất bại. Vui lòng thử lại.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return { facebookLogin, loading, error };
};

export default useFacebookLogin;
