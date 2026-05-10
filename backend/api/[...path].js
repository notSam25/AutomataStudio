const connectDB = require("../config/db");
const app = require("../app");
const mongoose = require("mongoose");

const { ensureConnection } = require("../config/sharedConnection");
const app = require("../app");

module.exports = async (req, res) => {
  try {
    if (req && typeof req.url === "string" && !req.url.startsWith("/api")) {
      req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }

    await ensureConnection();
    return app(req, res);
  } catch (error) {
    console.error("Vercel API bootstrap failed:", error && error.stack ? error.stack : error);
    res.status(503).json({
      error: "Database unavailable",
      message: error.message,
    });
  }
};
