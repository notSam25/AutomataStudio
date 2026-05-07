const Automata = require('../models/Automata');
const Simulation = require('../models/Simulation');

// Simulate automata with input string
exports.simulateAutomata = async (req, res) => {
  try {
    const { automataId, input } = req.body;

    if (!automataId || input === undefined) {
      return res.status(400).json({ error: 'Missing automataId or input' });
    }

    const automata = await Automata.findById(automataId);
    if (!automata) {
      return res.status(404).json({ error: 'Automata not found' });
    }

    // Simple DFA/NFA simulation (NFA handled as DFA for simplicity)
    let currentState = automata.initialState;
    const steps = [];
    let accepted = false;

    const symbols = input.split('');

    // Add initial state as first step
    steps.push({
      state: currentState,
      symbol: null,
      stackContent: '',
      tapePosition: 0,
    });

    for (let symbol of symbols) {
      // Find transition
      const transition = automata.transitions.find(
        (t) => t.from === currentState && t.symbol === symbol
      );

      if (!transition) {
        // No valid transition - add final state and break
        steps.push({
          state: currentState,
          symbol: symbol,
          stackContent: '',
          tapePosition: 0,
          rejected: true,
        });
        break;
      }

      currentState = transition.to;
      steps.push({
        state: currentState,
        symbol: symbol,
        stackContent: '',
        tapePosition: 0,
      });
    }

    // Check if final state is accept state
    accepted = automata.acceptStates.includes(currentState);

    const simulation = new Simulation({
      automataId,
      input,
      accepted,
      steps,
      finalState: currentState,
    });

    const savedSimulation = await simulation.save();
    res.status(201).json({
      accepted,
      finalState: currentState,
      steps,
      simulation: savedSimulation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get simulation history
exports.getSimulationHistory = async (req, res) => {
  try {
    const { automataId } = req.params;

    const simulations = await Simulation.find({ automataId });

    res.status(200).json(simulations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get simulation by ID
exports.getSimulationById = async (req, res) => {
  try {
    const { id } = req.params;
    const simulation = await Simulation.findById(id);

    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    res.status(200).json(simulation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
