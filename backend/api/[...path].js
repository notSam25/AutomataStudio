const connectDB = require("../config/db");
const app = require("../app");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const app = require("../app");
const mongoose = require("mongoose");

let readyPromise = null;

const waitForDatabase = async (timeoutMs = 16000) => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (!readyPromise) {
    readyPromise = connectDB();
  }

  await Promise.race([
    readyPromise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("MongoDB connection did not become ready within the timeout window")), timeoutMs);
    }),
  ]);

  return mongoose.connection.readyState === 1;
};

module.exports = async (req, res) => {
  try {
    if (req && typeof req.url === "string" && !req.url.startsWith("/api")) {
      req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }

    await waitForDatabase();
    return app(req, res);
  } catch (error) {
    console.error("Vercel API bootstrap failed:", error && error.stack ? error.stack : error);
    res.status(503).json({
      error: "Database unavailable",
      message: error.message,
    });
  }
};
