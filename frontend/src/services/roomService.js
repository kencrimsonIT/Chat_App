import axiosInstance from "./axios_instance";

const createGroupRoom = async (name, memberIds) => {
    const response = await axiosInstance.post("/rooms/group", { name, memberIds });
    return response.data;
};

const getRoomDetails = async (roomId) => {
    const response = await axiosInstance.get(`/rooms/${roomId}`);
    return response.data;
};

const updateRoomInfo = async (roomId, name) => {
    const response = await axiosInstance.put(`/rooms/${roomId}`, { name });
    return response.data;
};

const getRoomMembers = async (roomId) => {
    const response = await axiosInstance.get(`/rooms/${roomId}/members`);
    return response.data;
};

const addMember = async (roomId, userId) => {
    const response = await axiosInstance.post(`/rooms/${roomId}/members`, { userId });
    return response.data;
};

const removeMember = async (roomId, userId) => {
    const response = await axiosInstance.delete(`/rooms/${roomId}/members/${userId}`);
    return response.data;
};

const changeMemberRole = async (roomId, userId, role) => {
    const response = await axiosInstance.put(`/rooms/${roomId}/members/${userId}/role`, { role });
    return response.data;
};

const leaveGroup = async (roomId) => {
    const response = await axiosInstance.post(`/rooms/${roomId}/leave`);
    return response.data;
};

const roomService = {
    createGroupRoom,
    getRoomDetails,
    updateRoomInfo,
    getRoomMembers,
    addMember,
    removeMember,
    changeMemberRole,
    leaveGroup,
};

export default roomService;
