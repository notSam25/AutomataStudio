const Automata = require('../models/Automata');

// Create a new automata
exports.createAutomata = async (req, res) => {
  try {
    const { name, type, states, alphabet, initialState, acceptStates, transitions, description } = req.body;

    if (!name || !type || !states || !alphabet || !initialState || !acceptStates) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const automata = new Automata({
      name,
      type,
      states,
      alphabet,
      initialState,
      acceptStates,
      transitions: transitions || [],
      description,
    });

    const savedAutomata = await automata.save();
    res.status(201).json(savedAutomata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all automata
exports.getAllAutomata = async (req, res) => {
  try {
    const automata = await Automata.find();
    res.status(200).json(automata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get automata by ID
exports.getAutomataById = async (req, res) => {
  try {
    const { id } = req.params;
    const automata = await Automata.findById(id);

    if (!automata) {
      return res.status(404).json({ error: 'Automata not found' });
    }

    res.status(200).json(automata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update automata
exports.updateAutomata = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const automata = await Automata.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!automata) {
      return res.status(404).json({ error: 'Automata not found' });
    }

    res.status(200).json(automata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete automata
exports.deleteAutomata = async (req, res) => {
  try {
    const { id } = req.params;
    const automata = await Automata.findByIdAndDelete(id);

    if (!automata) {
      return res.status(404).json({ error: 'Automata not found' });
    }

    res.status(200).json({ message: 'Automata deleted successfully', automata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
