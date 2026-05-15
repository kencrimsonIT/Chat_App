import {useState} from "react";
import {useNavigate} from "react-router-dom";
import axiosInstance from "../services/axios_instance";

const useRegister = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const register = async (username, email, password, confirmPassword) => {
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Mật khẩu không khớp");
            setLoading(false);
            return;
        }

        try {
            const {data} = await axiosInstance.post("/auth/register", {
                username,
                email,
                password,
                confirmPassword
            });

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("username", data.username);
            localStorage.setItem("email", data.email);

            navigate("/chat");
        } catch (err) {
            const message = err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại."
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return {register, loading, error};
};

export default useRegister;