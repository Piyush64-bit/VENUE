const { io } = require("socket.io-client");

const USER_ID = "69746f3a89f685fe89617a70";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connected to socket:", socket.id);

  // Join personal room
  socket.emit("join", USER_ID);
  console.log("➡️ Joined room for user:", USER_ID);
});

socket.on("waitlist:added", (data) => {
  console.log("🔔 WAITLIST ADDED EVENT:", data);
});

socket.on("waitlist:promoted", (data) => {
  console.log("🎉 WAITLIST PROMOTED EVENT:", data);
});

socket.on("disconnect", () => {
  console.log("❌ Socket disconnected");
});
