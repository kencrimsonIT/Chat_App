import axiosInstance from "./axios_instance";

// Send friend request
const sendFriendRequest = async (receiverId) => {
    const response = await axiosInstance.post("/friendships/send", { receiverId });
    return response.data;
};

// Accept friend request
const acceptFriendRequest = async (id) => {
    const response = await axiosInstance.put(`/friendships/${id}/accept`);
    return response.data;
};

// Decline friend request
const declineFriendRequest = async (id) => {
    const response = await axiosInstance.put(`/friendships/${id}/decline`);
    return response.data;
};

// Get accepted contacts
const getFriends = async () => {
    const response = await axiosInstance.get("/friendships/friends");
    return response.data;
};

// Get pending requests
const getPendingRequests = async () => {
    const response = await axiosInstance.get("/friendships/pending");
    return response.data;
};

// Get sent requests
const getSentRequests = async () => {
    const response = await axiosInstance.get("/friendships/sent");
    return response.data;
};

const friendshipService = {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getFriends,
    getPendingRequests,
    getSentRequests,
};

export default friendshipService;