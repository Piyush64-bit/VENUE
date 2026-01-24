require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./modules/auth/auth.routes");
const eventRoutes = require("./modules/events/event.routes");
const bookingRoutes = require("./modules/bookings/booking.routes");

const verifyToken = require("./middlewares/verifyToken");
const checkRole = require("./middlewares/checkRole");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// Routes
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);
app.use("/bookings", bookingRoutes);

// Test protected route (can remove later)
app.get(
  "/protected",
  verifyToken,
  checkRole(["USER", "ADMIN", "ORGANIZER"]),
  (req, res) => {
    res.status(200).json({
      message: "Protected route accessed successfully",
      user: req.user,
    });
  }
);

module.exports = app;
