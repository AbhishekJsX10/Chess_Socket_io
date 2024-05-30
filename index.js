


const express = require("express");
const socketIO = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

// Static file setup
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

// Socket.io connection
io.on("connection", (socket) => {
    console.log("A user connected");

    // Assign player roles
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("A user disconnected");
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        }
    });

    // Handle moves
    socket.on("move", (move) => {
        try {
            // Check if it's the correct player's turn
            if (chess.turn() === "w" && socket.id !== players.white) return;
            if (chess.turn() === "b" && socket.id !== players.black) return;

            // Attempt to make the move
            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid Move: ", move);
                socket.emit("invalidMove", move);
            }
        } catch (err) {
            console.error("Error handling move:", err);
            socket.emit("invalidMove", move);
        }
    });
});

server.listen(3000, (err) => {
    if (err) console.error("Server error:", err);
    else console.log("Server running on port 3000");
});
