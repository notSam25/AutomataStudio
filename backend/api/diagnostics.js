const mongoose = require("mongoose");
const { ensureConnection } = require("../config/sharedConnection");

module.exports = async (req, res) => {
  try {
    await ensureConnection();
    const dbState = "connected";

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
      dbState: mongoose.connection.readyState === 1 ? "connected" : "unavailable",
      error: error.message,
    });
  }
};
