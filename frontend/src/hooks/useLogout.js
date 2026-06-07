import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axios_instance";

const useLogout = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const logout = async () => {
        setLoading(true);
        setError(null);

        try {
            await axiosInstance.post("/auth/logout");
        } catch (err) {
            console.error("Logout failed on server:", err);
            // Even if the server call fails, we should clear local storage and redirect
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userId");
            localStorage.removeItem("username");
            localStorage.removeItem("email");
            localStorage.removeItem("roles");
            
            setLoading(false);
            navigate("/");
        }
    };

    return { logout, loading, error };
};

export default useLogout;
