import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;
let connectionPromise = null;

export const connectWebSocket = (onConnected) => {
    // Nếu đã đang kết nối, không kết nối lại
    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = new Promise((resolve) => {
        // Create a new STOMP client
        stompClient = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (str) => {
                console.log(str);
            },
        });

        stompClient.onConnect = (frame) => {
            console.log('Connected: ' + frame);
            if (onConnected) onConnected();
            resolve();
        };

        stompClient.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        stompClient.activate();
    });

    return connectionPromise;
};

export const isWebSocketConnected = () => {
    return stompClient && stompClient.connected;
};

export const subscribeToFriendshipNotifications = (userId, onNotificationReceived) => {
    if (!stompClient || !stompClient.connected) return null;

    return stompClient.subscribe(`/topic/friendship/${userId}`, (message) => {
        if (message.body) {
            onNotificationReceived(JSON.parse(message.body));
        }
    });
};

export const subscribeToUserStatus = (userId, callback) => {
    if (!stompClient || !stompClient.connected) {
        console.warn("WebSocket not connected yet");
        return null;
    }

    return stompClient.subscribe(
        `/user/${userId}/status`,
        (message) => {
            const status = JSON.parse(message.body);
            callback(status);
        }
    );
};

export const subscribeToUserPresence = (callback) => {
    if (!stompClient || !stompClient.connected) {
        console.warn("WebSocket not connected yet");
        return null;
    }

    return stompClient.subscribe(
        `/topic/presence`,
        (message) => {
            const userPresence = JSON.parse(message.body);
            callback(userPresence);
        }
    );
};

// Gửi status khi user online/offline
export const sendUserStatus = (userId, status) => {
    if (!stompClient || !stompClient.connected) {
        console.warn("WebSocket not connected, cannot send user status");
        return;
    }

    try {
        stompClient.publish({
            destination: '/app/user-status',
            body: JSON.stringify({
                userId: userId,
                status: status, // 'ONLINE' hoặc 'OFFLINE'
                timestamp: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error("Error sending user status:", error);
    }
};

export const subscribeToRoom = (roomId, onMessageReceived) => {
    if (!stompClient || !stompClient.connected) return null;
    
    return stompClient.subscribe(`/topic/room/${roomId}`, (message) => {
        if (message.body) {
            onMessageReceived(JSON.parse(message.body));
        }
    });
};

export const sendChatMessage = (messageDTO) => {
    if (stompClient && stompClient.connected) {
        stompClient.publish({
            destination: "/app/chat.sendMessage",
            body: JSON.stringify(messageDTO)
        });
    } else {
        console.error("Cannot send message: WebSocket not connected");
    }
};

export const disconnectWebSocket = () => {
    if (stompClient !== null) {
        stompClient.deactivate();
    }
    stompClient = null;
    connectionPromise = null;
    console.log("Disconnected");
};
