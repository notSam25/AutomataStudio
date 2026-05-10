const mongoose = require("mongoose");
const connectDB = require("../config/db");

let readyPromise = null;

const waitForDatabase = async (timeoutMs = 16000) => {
  if (mongoose.connection.readyState === 1) {
    return "connected";
  }

  if (!readyPromise) {
    readyPromise = connectDB();
  }

  await Promise.race([
    readyPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
  ]);

  return mongoose.connection.readyState === 1 ? "connected" : `state:${mongoose.connection.readyState}`;
};

module.exports = async (req, res) => {
  try {
    const dbState = await waitForDatabase();
    return res.status(200).json({
      hasMongoUri: Boolean(process.env.MONGO_URI),
      nodeEnv: process.env.NODE_ENV || null,
      vercel: process.env.VERCEL || null,
      dbState,
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
};
