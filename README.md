Real-Time Distributed Tic-Tac-Toe
This project implements a real-time, two-player Tic-Tac-Toe game with a distributed backend architecture. The game can be played between two command-line clients, each potentially connected to a different server instance.

Architecture and Communication Design
The backend is composed of two distinct Node.js servers that work together to manage and synchronize the game state.

Primary Server (server1.js): This is the authoritative source of truth for the game. It manages the game board, player turns, win/loss/draw logic, and player assignments ('X' and 'O'). It accepts connections from clients directly or from the secondary server.

Secondary Server (server2.js): This server acts as a proxy. When a client connects to it, it establishes a new, dedicated connection to the Primary Server on behalf of that client. It then pipes all communication between the client and the primary server, ensuring that each player is seen as a unique entity by the primary server.

Communication Flow
The communication is handled in real-time using Socket.IO. The flow for a player connected to the secondary server is as follows:

Client B connects to Server 2.

Server 2 creates a new, dedicated socket connection to Server 1.

Client B makes a move. The event is sent to Server 2.

Server 2 forwards the move event to Server 1 through the dedicated connection.

Server 1 validates the move, updates the game state, and broadcasts the new state to all connected clients (including those connected directly and those connected via Server 2).

Client A (connected to Server 1) and Client B (via Server 2) receive the updated game state and re-render their boards.

How to Run the Application
Prerequisites
Node.js (v14 or later)

npm (comes with Node.js)

1. Installation
Clone the repository or place all the files (server1.js, server2.js, cli-client.js) in a single directory. Open a terminal in that directory and install the required dependencies:

npm install express socket.io socket.io-client

2. Run the Servers
You must start both servers in separate terminal windows for the system to work correctly.

Terminal 1: Start the Primary Server

node server1.js
# Expected Output: Primary Tic-Tac-Toe server running on http://localhost:3001

Terminal 2: Start the Secondary Server

node server2.js
# Expected Output: Secondary Tic-Tac-Toe proxy server running on http://localhost:3002

3. Run the CLI Client(s)
The client script (cli-client.js) can connect to either server. You will need to open a new terminal for each player.

To connect to the Primary Server (Port 3001):

node cli-client.js

This is the default behavior.

To connect to the Secondary Server (Port 3002):

node cli-client.js http://localhost:3002

Provide the server URL as a command-line argument.

How to Test a 2-Player Game
Follow these steps to simulate a game between two players connected to different servers.

Start Both Servers: Make sure server1.js and server2.js are running in their own terminals as described above.

Open Player 1's Terminal (Player X): Open a new terminal and connect to the primary server. This player will be assigned the 'X' role.

node cli-client.js

Open Player 2's Terminal (Player O): Open a fourth terminal and connect to the secondary server. This player will be assigned the 'O' role.

node cli-client.js http://localhost:3002

Play the Game: You can now start playing. Make a move in Player X's terminal (e.g., 1,1). The board will update instantly in both terminals. Then, make a move in Player O's terminal. The game will proceed in real-time, with the state perfectly synchronized across both clients and servers.

summary of prompts:
Here is a summary of all the prompts from our session, in chronological order:

You started by asking to create a real-time, two-server Tic-Tac-Toe game with a Node.js backend.

You specified that server A should be on port 3001 and server B on 3002.

You asked for the code for the secondary server (server2.js).

You changed the client requirement to be a CLI-based WebSocket client instead of a browser-based one.

You requested that the CLI client accept user input as a row,col pair.

You asked to add a client-side check to see if a board position is free before making a move.

You reported a bug where a single client could play for both 'X' and 'O'.

You asked for the updated CLI client code after the bug fix.

You pointed out another bug where the client on port 3001 wasn't guaranteed to be player 'X'.

You reported a ReferenceError: winner is not defined bug in the client script.

You found the final major bug where the second client connecting wasn't being assigned the 'O' role.

You asked me to write a README.md file detailing the project's architecture and setup instructions.

Finally, you asked for this summary of all the prompts used.

NOTE: This is my first time working with Node.js and thus, all code was written using AI.
Code was monitored and tested manually and adjusted by pointing issues when found (several iterations were required as can be seen in the above summary).
For real applications, I would have added a set of tests but this seems out of the scope for this assignment.