import {useState} from "react";
import {useNavigate} from "react-router-dom";
import axiosInstance from "../services/axios_instance";

const useRegister = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const register = async (username, email, password, confirmPassword) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (password !== confirmPassword) {
            setError("Mật khẩu không khớp");
            setLoading(false);
            return;
        }

        try {
            await axiosInstance.post("/auth/register", {
                username,
                email,
                password,
                confirmPassword
            });

            setSuccess(true);
        } catch (err) {
            const message = err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại."
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return {register, loading, error, success};
};

export default useRegister;