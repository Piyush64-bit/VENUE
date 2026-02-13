const http = require("http");
const { Server } = require("socket.io");
const logger = require("./src/config/logger");
const app = require("./src/app");
const mongoose = require("mongoose");
const redisService = require("./src/services/redis.service");

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
      : ["http://localhost:5173"],
    credentials: true,
  },
});

// Make io accessible in controllers
app.set("io", io);

// Socket connection logic
io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // User joins their own room (userId)
  socket.on("join", (userId) => {
    socket.join(userId);
    logger.info(`User ${userId} joined socket room`);
  });

  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // 1. Stop HTTP server from accepting new requests
  server.close(async () => {
    logger.info("HTTP server closed.");

    try {
      // 2. Close MongoDB connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed.");
      }

      // 3. Close Redis connection
      await redisService.disconnect();

      logger.info("Graceful shutdown completed. Exiting process.");
      process.exit(0);
    } catch (err) {
      logger.error("Error during graceful shutdown:", err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if not closed
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

// Process signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Process Safety
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥', { message: err.message, stack: err.stack });
  process.exit(1);
});

// Start server
server.listen(PORT, () => {
  logger.info(`VENUE backend running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥', { message: err.message, stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});
