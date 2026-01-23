require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require("./config/db");
const authRoutes = require("./modules/auth/auth.routes");
const eventRoutes = require("./modules/events/event.routes");
const bookingRoutes = require("./modules/bookings/booking.routes");
const verifyToken = require("./middlewares/verifyToken");
const checkRole = require("./middlewares/checkRole");



const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);
app.use("/bookings", bookingRoutes);
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



const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`VENUE backend running on port ${PORT}`);
});
