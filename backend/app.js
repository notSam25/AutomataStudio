const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const requestLogger = require("./middleware/logger");
const connectDB = require("./config/db");
const setupRoutes = require("./routes/automataRoutes");

let diagnosticsReadyPromise = null;

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Backend is running" });
});

app.get("/api/diagnostics", async (req, res) => {
  try {
    if (!diagnosticsReadyPromise && mongoose.connection.readyState !== 1) {
      diagnosticsReadyPromise = connectDB();
    }

    if (diagnosticsReadyPromise) {
      await Promise.race([
        diagnosticsReadyPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("MongoDB connection did not become ready within the timeout window")),
            2000,
          ),
        ),
      ]);
    }

    return res.status(200).json({
      hasMongoUri: Boolean(process.env.MONGO_URI),
      nodeEnv: process.env.NODE_ENV || null,
      vercel: process.env.VERCEL || null,
      dbState: mongoose.connection.readyState === 1 ? "connected" : `state:${mongoose.connection.readyState}`,
    });
  } catch (error) {
    return res.status(503).json({
      hasMongoUri: Boolean(process.env.MONGO_URI),
      nodeEnv: process.env.NODE_ENV || null,
      vercel: process.env.VERCEL || null,
      dbState: "unavailable",
      error: error.message,
    });
  }
});

setupRoutes(app);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;
