// cli-client.js - A command-line Tic-Tac-Toe client

const { io } = require("socket.io-client");
const readline = require('readline');

// --- Configuration ---
// Get server URL from command-line arguments, or default to server1
const serverUrl = process.argv[2] || 'http://localhost:3001';

// --- Setup Terminal Interface ---
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let socket;
let myTurn = false; // A simple flag to control when the user can input a move
let currentBoard = Array(9).fill(null); // Keep a local copy of the board state
let mySymbol = null; // To store this client's player symbol ('X' or 'O')

// --- Game Rendering ---
function render(state) {
    const { board, currentPlayer, winner } = state;

    // Clear the console for a clean re-draw
    console.clear();
    console.log('--- Distributed Tic-Tac-Toe ---');
    console.log(`\nConnected to: ${serverUrl}`);
    if (mySymbol) {
        console.log(`You are Player: ${mySymbol}\n`);
    }

    // Draw the board with row and column guides
    const getSymbol = (value) => value === null ? ' ' : value;
    console.log('  1   2   3'); // Column numbers
    console.log(`1 ${getSymbol(board[0])} | ${getSymbol(board[1])} | ${getSymbol(board[2])} `);
    console.log(' ---|---|---');
    console.log(`2 ${getSymbol(board[3])} | ${getSymbol(board[4])} | ${getSymbol(board[5])} `);
    console.log(' ---|---|---');
    console.log(`3 ${getSymbol(board[6])} | ${getSymbol(board[7])} | ${getSymbol(board[8])} \n`);

    // It's my turn if the current player symbol matches my symbol and there's no winner
    myTurn = (currentPlayer === mySymbol && !winner);

    // Display status and prompt for move
    if (winner) {
        if (winner === 'Draw') {
            console.log("It's a Draw!");
        } else {
            console.log(`Player ${winner} Wins!`);
        }
        console.log("Type 'reset' to play again, or Ctrl+C to exit.");
        promptForMove(winner); // Pass winner status
    } else {
        console.log(`Current Turn: Player ${currentPlayer}`);
        if (myTurn) {
            console.log("It's your turn!");
            promptForMove(winner); // Pass winner status
        } else if (mySymbol === 'spectator') {
            console.log("You are watching the game.");
        } else {
            console.log("Waiting for opponent's move...");
        }
    }
}

// --- User Input Handling ---
// --- FIXED: Function now accepts the 'winner' variable ---
function promptForMove(winner) {
    // For winners, myTurn is false, so we need a separate check to allow the 'reset' command
    const canReset = !!currentBoard.some(s => s) || !!winner;
    if (!myTurn && !canReset) return;

    const promptText = myTurn 
        ? 'Enter position as row,col (e.g., 2,3): ' 
        : 'Type "reset" to start a new game: ';

    rl.question(promptText, (input) => {
        if (input.toLowerCase() === 'reset') {
            socket.emit('resetGame');
            return;
        }

        if (!myTurn) {
            console.log("It's not your turn to make a move.");
            return;
        }

        const parts = input.split(',');
        if (parts.length !== 2) {
            console.log('Invalid format. Please use row,col (e.g., 1,3).');
            promptForMove(winner); // Re-prompt
            return;
        }

        const row = parseInt(parts[0], 10);
        const col = parseInt(parts[1], 10);

        if (isNaN(row) || isNaN(col) || row < 1 || row > 3 || col < 1 || col > 3) {
            console.log('Invalid input. Row and column must be numbers between 1 and 3.');
            promptForMove(winner); // Re-prompt
            return;
        }

        const index = (row - 1) * 3 + (col - 1);

        if (currentBoard[index] !== null) {
            console.log('That position is already taken. Please choose another.');
            promptForMove(winner);
            return;
        }
        
        socket.emit('makeMove', index);
        myTurn = false; // Prevent multiple moves before state update
    });
}

// --- Socket Connection ---
function connectToServer() {
    console.log(`--- Tic-Tac-Toe CLI Client ---`);
    console.log(`Attempting to connect to server at: ${serverUrl}`);
    console.log(`Note: Your player role ('X' or 'O') will be assigned by the server.`);
    
    socket = io(serverUrl, {
        reconnectionAttempts: 5,
        timeout: 10000,
    });

    socket.on('connect', () => {
        console.log('Successfully connected to the server!');
    });

    socket.on('connect_error', (err) => {
        console.error(`Connection failed: ${err.message}`);
        console.log('Please ensure the server is running. Exiting.');
        process.exit(1);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from the server.');
        process.exit(0);
    });
    
    socket.on('assignPlayer', (data) => {
        mySymbol = data.symbol;
        if (mySymbol === 'spectator') {
            console.log('Two players are already in the game. You are now a spectator.');
        } else {
            console.log(`You have been assigned as Player ${mySymbol}.`);
        }
    });

    socket.on('gameState', (state) => {
        currentBoard = state.board;
        render(state);
    });
}

// --- Start the client ---
connectToServer();
