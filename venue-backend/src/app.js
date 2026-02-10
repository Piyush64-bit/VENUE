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
const slotRoutes = require("./modules/slots/slot.routes");
const movieRoutes = require("./modules/movies/movie.routes");
const userRoutes = require("./modules/users/user.routes");
const organizerRoutes = require("./modules/organizer/organizer.routes"); // [NEW]

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

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {

      // allow server-to-server / curl / mobile requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
apiV1.use("/slots", publicLimiter, slotRoutes);

// Serve uploaded files with proper CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}, express.static('uploads'));

apiV1.use("/organizer", organizerRoutes);
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
  res.send("VENUE API HERE");
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
