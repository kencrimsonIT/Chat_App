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

const chatService = {
    getMyRooms,
    getChatHistory,
    getPrivateRoom,
    createPrivateRoom: getPrivateRoom
};

export default chatService;
