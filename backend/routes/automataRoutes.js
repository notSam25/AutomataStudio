const automataController = require("../controllers/automataController");
const simulationController = require("../controllers/simulationController");
const authController = require("../controllers/authController");
const { optionalAuth, requireAuth } = require("../middleware/auth");

const setupRoutes = (app) => {
  // Auth endpoints
  app.post("/api/auth/register", authController.register);
  app.post("/api/auth/login", authController.login);
  app.get("/api/auth/me", requireAuth, authController.getMe);
  app.put("/api/auth/me", requireAuth, authController.updateMe);
  app.post("/api/auth/logout", requireAuth, authController.logout);

  // Automata endpoints
  app.post("/api/automata", requireAuth, automataController.createAutomata);
  app.get("/api/automata", optionalAuth, automataController.getAllAutomata);
  app.get("/api/automata/:id", optionalAuth, automataController.getAutomataById);
  app.put("/api/automata/:id", requireAuth, automataController.updateAutomata);
  app.delete("/api/automata/:id", requireAuth, automataController.deleteAutomata);
  app.post("/api/automata/:id/share", requireAuth, automataController.createShareLink);
  app.delete("/api/automata/:id/share", requireAuth, automataController.revokeShareLink);
  app.get("/api/share/:shareId", automataController.getAutomataByShareId);
  app.get("/api/automata/:id/export", optionalAuth, automataController.exportAutomata);

  // Simulation endpoints
  app.post("/api/simulate", optionalAuth, simulationController.simulateAutomata);
  app.get(
    "/api/simulations/:automataId",
    optionalAuth,
    simulationController.getSimulationHistory,
  );
  app.get(
    "/api/simulations/result/:id",
    optionalAuth,
    simulationController.getSimulationById,
  );
};

module.exports = setupRoutes;
