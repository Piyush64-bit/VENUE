require("dotenv").config();
const express = require("express");
const cors = require("cors");

const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { apiLimiter, publicLimiter } = require("./middlewares/rateLimiter");
const connectDB = require("./config/db");

const authRoutes = require("./modules/auth/auth.routes");
const eventRoutes = require("./modules/events/event.routes");
const bookingRoutes = require("./modules/bookings/booking.routes");
const movieRoutes = require("./modules/movies/movie.routes");

const verifyToken = require("./middlewares/verifyToken");
const checkRole = require("./middlewares/checkRole");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const AppError = require("./utils/AppError");

const app = express();

// Security Middleware
app.use(helmet());
app.use(helmet());
// mongoSanitize and xss moved after body parsers

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Dynamic origin
    credentials: true, // Allow cookies
  })
);
app.use(express.json());
app.use(cookieParser());

// Data Sanitization against NoSQL query injection
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);


// Data Sanitization against XSS
app.use(xss());

// Rate Limiting
// Rate Limiting
app.use("/auth", apiLimiter);
app.use("/events", publicLimiter); // Public viewing
app.use("/movies", publicLimiter);
app.use("/bookings", apiLimiter); // Protect booking logic

// Database
connectDB();

// Connection Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date(), uptime: process.uptime() });
});

// Routes
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// API V1 Router
const apiV1 = express.Router();

apiV1.use("/auth", apiLimiter, authRoutes); // Auth Rate Limit logic checked inside or here? authRoutes uses apiLimiter now? No, authRoutes has authLimiter inside. 
// Wait, I applied `app.use("/auth", apiLimiter)` previously. Now I should clean that up.
// Better: apiV1.use("/auth", authRoutes); // authLimiter is inside authRoutes via router.use
apiV1.use("/events", publicLimiter, eventRoutes);
apiV1.use("/movies", publicLimiter, movieRoutes);
apiV1.use("/bookings", apiLimiter, bookingRoutes);

// Mount V1
app.use("/api/v1", apiV1);

// Documentation Route
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

// 404 Handler for undefined routes
app.all(/(.*)/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
