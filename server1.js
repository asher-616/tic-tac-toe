// server1.js - The Primary Game Server
// This server holds the authoritative game state.

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const PORT = 3001; // Port for this server

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- Game State ---
let board = Array(9).fill(null);
let currentPlayer = 'X';
let winner = null;
let secondaryServerSocket = null;

// --- Player Management ---
let players = { X: null, O: null };

// --- Helper Functions ---
function calculateWinner(squares) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    if (squares.every(square => square !== null)) {
        return 'Draw';
    }
    return null;
}

function getGameState() {
    return { board, currentPlayer, winner };
}

function broadcastGameState() {
    const gameState = getGameState();
    console.log('Broadcasting state:', gameState);
    io.emit('gameState', gameState);
    if (secondaryServerSocket) {
        secondaryServerSocket.emit('gameState', gameState);
    }
}

function resetGame() {
    console.log('Game is being reset.');
    board = Array(9).fill(null);
    currentPlayer = 'X';
    winner = null;
    broadcastGameState();
}

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // Assign player symbol on connection
    if (players.X === null) {
        players.X = socket.id;
        socket.emit('assignPlayer', { symbol: 'X' });
        console.log(`Player X assigned to ${socket.id}`);
    } else if (players.O === null) {
        players.O = socket.id;
        socket.emit('assignPlayer', { symbol: 'O' });
        console.log(`Player O assigned to ${socket.id}`);
    } else {
        socket.emit('assignPlayer', { symbol: 'spectator' });
        console.log(`Spectator joined: ${socket.id}`);
    }

    // --- THIS IS THE FIX ---
    // If this connection identifies as a server, revoke its player role.
    socket.on('registerServer', () => {
        console.log(`Secondary server registered: ${socket.id}`);
        secondaryServerSocket = socket;

        if (players.X === socket.id) {
            players.X = null; // Free up the 'X' slot
            console.log('Revoked Player X role from secondary server. Slot is open again.');
        } else if (players.O === socket.id) {
            players.O = null; // Free up the 'O' slot
            console.log('Revoked Player O role from secondary server. Slot is open again.');
        }
        
        socket.emit('gameState', getGameState());
    });

    socket.emit('gameState', getGameState());

    socket.on('makeMove', (index) => {
        console.log(`Move received for index: ${index} from ${socket.id}`);
        
        if (players[currentPlayer] !== socket.id) {
            console.log(`Invalid move: Not player ${currentPlayer}'s turn.`);
            return;
        }

        if (winner || board[index]) {
            return;
        }

        board[index] = currentPlayer;
        winner = calculateWinner(board);
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        broadcastGameState();
    });

    socket.on('resetGame', () => {
        resetGame();
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (players.X === socket.id) {
            players.X = null;
            console.log('Player X disconnected, slot is now open.');
        } else if (players.O === socket.id) {
            players.O = null;
            console.log('Player O disconnected, slot is now open.');
        }

        if (secondaryServerSocket && socket.id === secondaryServerSocket.id) {
            console.log('Secondary server disconnected.');
            secondaryServerSocket = null;
        }
    });
});

server.listen(PORT, () => {
    console.log(`Primary Tic-Tac-Toe server running on http://localhost:${PORT}`);
});
