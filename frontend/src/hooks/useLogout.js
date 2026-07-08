import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../services/axios_instance";

const useLogout = () => {
    const navigate = useNavigate();
    const { logout: authLogout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const logout = async () => {
        setLoading(true);
        setError(null);

        try {
            await axiosInstance.post("/auth/logout");
        } catch (err) {
            console.error("Logout failed on server:", err);
            // Even if the server call fails, we should clear session storage and redirect
        } finally {
            authLogout();
            setLoading(false);
            navigate("/");
        }
    };

    return { logout, loading, error };
};

export default useLogout;