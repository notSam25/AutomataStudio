const connectDB = require("../backend/config/db");
const app = require("../backend/app");

let readyPromise = null;

module.exports = async (req, res) => {
  try {
    if (!readyPromise) {
      readyPromise = connectDB();
    }

    await readyPromise;
    return app(req, res);
  } catch (error) {
    console.error("Vercel API bootstrap failed:", error && error.stack ? error.stack : error);
    res.status(500).json({
      error: "Failed to initialize API",
      message: error.message,
    });
  }
};
