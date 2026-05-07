const automataController = require('../controllers/automataController');
const simulationController = require('../controllers/simulationController');

const setupRoutes = (app) => {
  // Automata endpoints
  app.post('/api/automata', automataController.createAutomata);
  app.get('/api/automata', automataController.getAllAutomata);
  app.get('/api/automata/:id', automataController.getAutomataById);
  app.put('/api/automata/:id', automataController.updateAutomata);
  app.delete('/api/automata/:id', automataController.deleteAutomata);

  // Simulation endpoints
  app.post('/api/simulate', simulationController.simulateAutomata);
  app.get('/api/simulations/:automataId', simulationController.getSimulationHistory);
  app.get('/api/simulations/result/:id', simulationController.getSimulationById);
};

module.exports = setupRoutes;
