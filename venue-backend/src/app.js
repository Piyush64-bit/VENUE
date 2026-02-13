require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const logger = require("./config/logger");

const connectDB = require("./config/db");
// Limiters are now imported inside API V1 section to keep scope clear

const authRoutes = require("./modules/auth/auth.routes");
const eventRoutes = require("./modules/events/event.routes");
const bookingRoutes = require("./modules/bookings/booking.routes");
const slotRoutes = require("./modules/slots/slot.routes");
const movieRoutes = require("./modules/movies/movie.routes");
const userRoutes = require("./modules/users/user.routes");
const organizerRoutes = require("./modules/organizer/organizer.routes"); // [NEW]

const verifyToken = require("./middlewares/verifyToken");
const checkRole = require("./middlewares/checkRole");
const requestIdMiddleware = require("./middlewares/requestId.middleware");
const sanitizeMiddleware = require("./middlewares/sanitize.middleware");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const AppError = require("./utils/AppError");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();

/* ======================================================
   SECURITY & CORE MIDDLEWARE
====================================================== */

app.use(helmet());
app.use(requestIdMiddleware);

// Configure Morgan to use Winston
morgan.token('id', (req) => req.id);
const morganFormat = ':remote-addr - :id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
}));

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
app.use(sanitizeMiddleware());

app.use(
  mongoSanitize({
    replaceWith: "_"
  })
);

/* ======================================================
   DATABASE
====================================================== */

if (process.env.NODE_ENV !== "test") {
  connectDB();
}

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

const {
  globalLimiter,
  authLimiter,
  publicReadLimiter,
  writeLimiter,
  userLimiter,
  bookingLimiter
} = require("./middlewares/rateLimiter");

// 1. Auth Routes (Tier 2: Brute Force Protection)
apiV1.use("/auth", authLimiter, authRoutes);

// 2. Public Data Routes (Tier 3: Scrape Protection + Tier 5: Write Throttle)
// GET requests get 3000/hr, Write requests get 100/hr (if authenticated handled by controller/middleware later)
// Note: writeLimiter requires req.user for strict user-limiting, but falls back to IP if not present.
// Since these routes might be mixed (public GET, protected POST), we apply both.
apiV1.use("/events", publicReadLimiter, writeLimiter, eventRoutes);
apiV1.use("/movies", publicReadLimiter, writeLimiter, movieRoutes);
apiV1.use("/slots", publicReadLimiter, writeLimiter, slotRoutes);

// 3. User & Booking Routes (Authenticated) - Tier 4 & 6
// Must verify token first to enable ID-based limiting
// We also apply globalLimiter (IP-based) first to protect against unauthenticated token flooding/brute-force
apiV1.use("/bookings", globalLimiter, verifyToken, userLimiter, bookingLimiter, bookingRoutes);
apiV1.use("/users", globalLimiter, verifyToken, userLimiter, writeLimiter, userRoutes);
apiV1.use("/organizer", globalLimiter, verifyToken, userLimiter, writeLimiter, organizerRoutes);

/* ======================================================
   TEST PROTECTED ROUTE
====================================================== */

apiV1.get(
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

app.use("/api/v1", apiV1);

/* ======================================================
   DOCUMENTATION
====================================================== */

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

