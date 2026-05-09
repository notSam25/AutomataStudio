const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const setupRoutes = require("./routes/automataRoutes");
const requestLogger = require("./middleware/logger");

const app = express();

// Middleware
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
// Use CORS middleware to ensure CORS headers are set for all responses
app.use(cors({ origin: "*" }));

// Ensure preflight requests are handled
app.options("*", cors());

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
