import axiosInstance from "./axios_instance";

const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post("/users/upload-avatar", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

const uploadCover = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post("/users/upload-cover", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

const getCurrentUser = async () => {
    const response = await axiosInstance.get("/users/me");
    return response.data;
};

const updateProfile = async (profileData) => {
    const response = await axiosInstance.put("/users/profile", profileData);
    return response.data;
};

const searchUsers = async (keyword) => {
    const response = await axiosInstance.get(`/users/search?keyword=${keyword}`);
    return response.data;
};

const userService = {
    uploadAvatar,
    uploadCover,
    getCurrentUser,
    updateProfile,
    searchUsers,
};

export default userService;
