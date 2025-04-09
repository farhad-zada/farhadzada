import express from "express";
import session from "express-session";
import ai from "./routes/ai.js";
import { config } from "dotenv";
import rateLimit from "express-rate-limit";
config();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: false,
    message: "Too many requests, please try again later.",
  },
  headers: true, // Include rate limit headers in the response
  standardHeaders: true, // Send `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: {
    trustProxy: false,
  }
});

const app = express();

app.set('trust proxy', "loopback");

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Replace with a strong secret
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 48 * 60 * 60 * 1000, // Session expires after 48 hours
    },
  })
);

app.use(limiter);

app.use(express.static(`./static`));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/session", ai);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
