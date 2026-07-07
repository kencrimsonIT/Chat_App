import axiosInstance from "./axios_instance";

const getMyRooms = async () => {
    const response = await axiosInstance.get("/rooms/me");
    return response.data;
};

const getChatHistory = async (roomId, page = 0, size = 20) => {
    const response = await axiosInstance.get(`/chat/history/${roomId}`, {
        params: { page, size }
    });
    return response.data;
};

const getPrivateRoom = async (targetUserId) => {
    const response = await axiosInstance.get(`/rooms/private/${targetUserId}`);
    return response.data;
};

/**
 * Upload a file attachment and send it as a message in a room.
 * @param {File} file - The file to upload
 * @param {number} roomId - The room ID
 * @param {string} [caption] - Optional text caption
 * @param {function} [onProgress] - Progress callback (0-100)
 * @returns {Promise<object>} The saved message DTO
 */
const uploadFile = async (file, roomId, caption, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", roomId);
    if (caption) {
        formData.append("caption", caption);
    }

    const response = await axiosInstance.post("/chat/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percent);
            }
        },
    });
    return response.data;
};

const chatService = {
    getMyRooms,
    getChatHistory,
    getPrivateRoom,
    createPrivateRoom: getPrivateRoom,
    uploadFile
};

export default chatService;
