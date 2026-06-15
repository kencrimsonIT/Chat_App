import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

export const connectWebSocket = (onConnected) => {
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
    };

    stompClient.onStompError = (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
    };

    stompClient.activate();
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
    console.log("Disconnected");
};
