// server.js
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// This object will keep track of connected users by socket id
const connectedUsers = {};

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Attach Socket.io to the HTTP server
  const io = new Server(httpServer, {
    path: "/socket_io", // Custom path for Socket.io
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // Listen for a user joining with their username
    socket.on("userJoined", (username) => {
      console.log(`User joined: ${username} (${socket.id})`);
      // Save the username using the socket id as key
      connectedUsers[socket.id] = username;
      // Broadcast updated user list
      io.emit("updateUsers", Object.values(connectedUsers));
    });

    // Listen for messages
    socket.on("sendMessage", (msgData) => {
      console.log("📩 Received message:", msgData);
      // Broadcast the message to all clients
      io.emit("receiveMessage", msgData);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
      // Remove the user from our connected users object
      delete connectedUsers[socket.id];
      // Broadcast updated user list
      io.emit("updateUsers", Object.values(connectedUsers));
    });
  });

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
});
