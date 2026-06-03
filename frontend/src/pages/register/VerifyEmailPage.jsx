import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import axiosInstance from "../../services/axios_instance";
import "./VerifyEmailPage.scss";

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [message, setMessage] = useState("Đang xác nhận email của bạn...");

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus("error");
                setMessage("Mã xác nhận không hợp lệ hoặc đã hết hạn.");
                return;
            }

            try {
                const response = await axiosInstance.get(`/auth/verify-email?token=${token}`);
                setStatus("success");
                setMessage(response.data || "Email của bạn đã được xác nhận thành công!");
            } catch (error) {
                setStatus("error");
                setMessage(error.response?.data?.message || "Xác nhận email thất bại. Vui lòng thử lại sau.");
            }
        };

        verify();
    }, [token]);

    return (
        <div className="verify-container">
            <div className="verify-card">
                {status === "verifying" && (
                    <div className="status-content">
                        <Loader2 className="icon loading animate-spin" size={64} />
                        <h1>Đang xác thực</h1>
                        <p>{message}</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="status-content success">
                        <CheckCircle className="icon" size={64} />
                        <h1>Thành công!</h1>
                        <p>{message}</p>
                        <button className="btn-primary" onClick={() => navigate("/login")}>
                            Đăng nhập ngay <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div className="status-content error">
                        <XCircle className="icon" size={64} />
                        <h1>Thất bại</h1>
                        <p>{message}</p>
                        <button className="btn-outline" onClick={() => navigate("/register")}>
                            Quay lại đăng ký
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
