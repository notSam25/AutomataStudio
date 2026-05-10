const { ensureConnection } = require("../config/sharedConnection");
const automataController = require("../controllers/automataController");

module.exports = async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    await ensureConnection();

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
