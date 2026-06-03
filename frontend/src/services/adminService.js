import axiosInstance from "./axios_instance";

const getAllUsers = async () => {
    const response = await axiosInstance.get("/admin/users");
    return response.data;
};

const assignAdmin = async (userId) => {
    const response = await axiosInstance.post("/admin/assign-admin", { userId });
    return response.data;
};

const revokeAdmin = async (userId) => {
    const response = await axiosInstance.post("/admin/revoke-admin", { userId });
    return response.data;
};

const adminService = {
    getAllUsers,
    assignAdmin,
    revokeAdmin,
};

export default adminService;
