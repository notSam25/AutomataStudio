const express = require("express");
const cors = require("cors");
const requestLogger = require("./middleware/logger");
const setupRoutes = require("./routes/automataRoutes");

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

setupRoutes(app);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;
