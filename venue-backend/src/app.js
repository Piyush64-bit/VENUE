require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const connectDB = require("./config/db");
const { apiLimiter, publicLimiter } = require("./middlewares/rateLimiter");

const authRoutes = require("./modules/auth/auth.routes");
const eventRoutes = require("./modules/events/event.routes");
const bookingRoutes = require("./modules/bookings/booking.routes");
const movieRoutes = require("./modules/movies/movie.routes");
const userRoutes = require("./modules/users/user.routes");

const verifyToken = require("./middlewares/verifyToken");
const checkRole = require("./middlewares/checkRole");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const AppError = require("./utils/AppError");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();

/* ======================================================
   SECURITY & CORE MIDDLEWARE
====================================================== */

app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://venueapp.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  mongoSanitize({
    replaceWith: "_"
  })
);

app.use(xss());

/* ======================================================
   DATABASE
====================================================== */

connectDB();

/* ======================================================
   HEALTH CHECK
====================================================== */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/* ======================================================
   API V1 ROUTER
====================================================== */

const apiV1 = express.Router();

apiV1.use("/auth", apiLimiter, authRoutes);
apiV1.use("/events", publicLimiter, eventRoutes);
apiV1.use("/movies", publicLimiter, movieRoutes);
apiV1.use("/bookings", apiLimiter, bookingRoutes);
console.log("Mounting User Routes...");
apiV1.use("/users", apiLimiter, userRoutes);

app.use("/api/v1", apiV1);

/* ======================================================
   DOCUMENTATION
====================================================== */

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ======================================================
   TEST PROTECTED ROUTE
====================================================== */

app.get(
  "/protected",
  verifyToken,
  checkRole(["USER", "ADMIN", "ORGANIZER"]),
  (req, res) => {
    res.status(200).json({
      message: "Protected route accessed successfully",
      user: req.user
    });
  }
);

/* ======================================================
   ROOT ROUTE
====================================================== */

app.get("/", (req, res) => {
  res.send("VENUE API [UPDATED] 🚀");
});

/* ======================================================
   404 HANDLER
====================================================== */

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

/* ======================================================
   GLOBAL ERROR HANDLER
====================================================== */

app.use(globalErrorHandler);

module.exports = app;
