// server2.js - The Secondary/Proxy Server
// This server creates a dedicated connection to the primary server for EACH client.

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { io: Client } = require("socket.io-client");

const PORT = 3002;
const PRIMARY_SERVER_URL = "http://localhost:3001";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// This server no longer needs a single client. It will create one per user.

io.on('connection', (clientSocket) => {
    console.log(`[Server 2] Client connected: ${clientSocket.id}`);

    // Create a new, dedicated client connection to the primary server for this user.
    const primaryServerClient = Client(PRIMARY_SERVER_URL);

    // --- Pipe events from Server 1 back to the specific client ---
    primaryServerClient.on('connect', () => {
        console.log(`[Server 2] Established a dedicated connection to Server 1 for ${clientSocket.id}`);
    });

    primaryServerClient.on('gameState', (state) => {
        clientSocket.emit('gameState', state);
    });

    primaryServerClient.on('assignPlayer', (data) => {
        clientSocket.emit('assignPlayer', data);
    });
    
    primaryServerClient.on('disconnect', () => {
        console.log(`[Server 2] Dedicated connection for ${clientSocket.id} to Server 1 was closed.`);
    });


    // --- Pipe events from the client on to Server 1 ---
    clientSocket.on('makeMove', (index) => {
        primaryServerClient.emit('makeMove', index);
    });

    clientSocket.on('resetGame', () => {
        primaryServerClient.emit('resetGame');
    });

    // When the client disconnects from this server, disconnect their dedicated connection to server 1.
    clientSocket.on('disconnect', () => {
        console.log(`[Server 2] Client disconnected: ${clientSocket.id}. Closing their connection to Server 1.`);
        primaryServerClient.disconnect();
    });
});

server.listen(PORT, () => {
    console.log(`Secondary Tic-Tac-Toe proxy server running on http://localhost:${PORT}`);
});
