const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Make io accessible in controllers
app.set("io", io);

// Socket connection logic
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // User joins their own room (userId)
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined socket room`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`VENUE backend running on port ${PORT}`);
});
