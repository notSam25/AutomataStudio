const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const setupRoutes = require("./routes/automataRoutes");
const requestLogger = require("./middleware/logger");

const app = express();

// Always set basic CORS headers early to cover any early/fast responses
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

// Middleware
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
// Use CORS middleware to ensure CORS headers are set for all responses
app.use(cors({ origin: "*" }));

// Connect to MongoDB
connectDB();

// Setup routes
setupRoutes(app);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Backend is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal Server Error", message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Create HTTP server
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Global error handlers to capture unexpected crashes and log them
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err && err.stack ? err.stack : err);
  // give log a moment to flush then exit
  setTimeout(() => process.exit(1), 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason && reason.stack ? reason.stack : reason);
  setTimeout(() => process.exit(1), 1000);
});
