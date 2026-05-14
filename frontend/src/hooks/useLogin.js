import {useState} from "react";
import {useNavigate} from "react-router-dom";
import axiosInstance from "../services/axios_instance";

const useLogin = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (username, password) => {
        setLoading(true);
        setError(null);

        try {
            const {data} = await axiosInstance.post("/auth/login", {
                username,
                password,
            });

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("username", data.username);
            localStorage.setItem("email", data.email);

            navigate("/");
        } catch (err) {
            const message = err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return {login, loading, error};
};

export default useLogin;