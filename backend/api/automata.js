const connectDB = require("../config/db");
const automataController = require("../controllers/automataController");

let readyPromise = null;

const ensureDatabase = async (timeoutMs = 3000) => {
  if (!readyPromise) {
    readyPromise = connectDB();
  }

  await Promise.race([
    readyPromise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("MongoDB connection did not become ready within the timeout window")), timeoutMs);
    }),
  ]);
};

module.exports = async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    await ensureDatabase();

    if (req.method === "GET") {
      return automataController.getAllAutomata(req, res);
    }

    if (req.method === "POST") {
      return automataController.createAutomata(req, res);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error in /api/automata handler:", error && error.stack ? error.stack : error);
    return res.status(503).json({ error: "Database unavailable", message: error.message });
  }
};
