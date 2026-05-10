const Automata = require("../models/Automata");
const crypto = require("crypto");

const normalizeStateName = (state) => {
  if (typeof state === "string") {
    return state;
  }

  if (state && typeof state === "object") {
    return state.name || state.id;
  }

  return null;
};

const normalizeAutomataPayload = (payload) => {
  const normalizedStates = (payload.states || [])
    .map(normalizeStateName)
    .filter(Boolean);

  const normalizedTransitions = (payload.transitions || []).map((t) => ({
    from: normalizeStateName(t.from) || t.from,
    to: normalizeStateName(t.to) || t.to,
    symbol: t.symbol,
    writeSymbol: t.writeSymbol || null,
    move: t.move || null,
    stackSymbol: t.stackSymbol || null,
    pushSymbol: t.pushSymbol || null,
  }));

  return {
    ...payload,
    states: normalizedStates,
    transitions: normalizedTransitions,
    initialState: normalizeStateName(payload.initialState) || payload.initialState,
    acceptStates: (payload.acceptStates || [])
      .map(normalizeStateName)
      .filter(Boolean),
    stackAlphabet: Array.isArray(payload.stackAlphabet)
      ? payload.stackAlphabet.filter(Boolean)
      : [],
    initialStackSymbol: payload.initialStackSymbol || "Z",
    tape: payload.tape || null,
  };
};

const canAccessAutomata = (automata, user) => {
  if (!automata) {
    return false;
  }

  if (automata.isPublic) {
    return true;
  }

  if (!automata.ownerId) {
    return true;
  }

  if (!user || !automata.ownerId) {
    return false;
  }

  return String(automata.ownerId) === String(user._id);
};

// Create a new automata
exports.createAutomata = async (req, res) => {
  try {
    const normalized = normalizeAutomataPayload(req.body);
    const {
      name,
      type,
      states,
      alphabet,
      initialState,
      acceptStates,
      transitions,
      stackAlphabet,
      initialStackSymbol,
      tape,
      description,
    } = normalized;

    if (
      !name ||
      !type ||
      !states ||
      !alphabet ||
      !initialState ||
      !acceptStates
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const automata = new Automata({
      ownerId: req.user._id,
      name,
      type,
      states,
      alphabet,
      initialState,
      acceptStates,
      transitions: transitions || [],
      stackAlphabet: stackAlphabet || [],
      initialStackSymbol,
      tape,
      description,
    });

    const savedAutomata = await automata.save();
    res.status(201).json(savedAutomata);
  } catch (error) {
    console.error("Error in createAutomata:", error && error.stack ? error.stack : error);
    res.status(500).json({ error: error.message });
  }
};

// Get all automata
exports.getAllAutomata = async (req, res) => {
  try {
    let automata = [];
    if (req.user) {
      automata = await Automata.find({ ownerId: req.user._id });
    } else {
      automata = await Automata.find({
        $or: [{ isPublic: true }, { ownerId: null }],
      });
    }

    res.status(200).json(automata);
  } catch (error) {
    console.error("Error in getAllAutomata:", error && error.stack ? error.stack : error);
    res.status(500).json({ error: error.message });
  }
};

// Get automata by ID
exports.getAutomataById = async (req, res) => {
  try {
    const { id } = req.params;
    const automata = await Automata.findById(id);

    if (!canAccessAutomata(automata, req.user)) {
      return res.status(404).json({ error: "Automata not found" });
    }

    res.status(200).json(automata);
  } catch (error) {
    console.error("Error in getAutomataById:", error && error.stack ? error.stack : error);
    res.status(500).json({ error: error.message });
  }
};

// Update automata
exports.updateAutomata = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = normalizeAutomataPayload(req.body);

    const existing = await Automata.findById(id);
    if (!existing || String(existing.ownerId) !== String(req.user._id)) {
      return res.status(404).json({ error: "Automata not found" });
    }

    const automata = await Automata.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!automata) {
      return res.status(404).json({ error: "Automata not found" });
    }

    res.status(200).json(automata);
  } catch (error) {
    console.error("Error in updateAutomata:", error && error.stack ? error.stack : error);
    res.status(500).json({ error: error.message });
  }
};

// Delete automata
exports.deleteAutomata = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Automata.findById(id);
    if (!existing || String(existing.ownerId) !== String(req.user._id)) {
      return res.status(404).json({ error: "Automata not found" });
    }

    const automata = await Automata.findByIdAndDelete(id);

    if (!automata) {
      return res.status(404).json({ error: "Automata not found" });
    }

    res
      .status(200)
      .json({ message: "Automata deleted successfully", automata });
  } catch (error) {
    console.error("Error in deleteAutomata:", error && error.stack ? error.stack : error);
    res.status(500).json({ error: error.message });
  }
};

exports.createShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const automata = await Automata.findById(id);

    if (!automata || String(automata.ownerId) !== String(req.user._id)) {
      return res.status(404).json({ error: "Automata not found" });
    }

    const shareId = automata.shareId || crypto.randomBytes(8).toString("hex");
    automata.isPublic = true;
    automata.shareId = shareId;
    await automata.save();

    return res.status(200).json({
      shareId,
      shareUrl: `/#!/shared/${shareId}`,
    });
  } catch (error) {
    console.error("Error in createShareLink:", error && error.stack ? error.stack : error);
    return res.status(500).json({ error: error.message });
  }
};

exports.revokeShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const automata = await Automata.findById(id);

    if (!automata || String(automata.ownerId) !== String(req.user._id)) {
      return res.status(404).json({ error: "Automata not found" });
    }

    automata.isPublic = false;
    automata.shareId = null;
    await automata.save();

    return res.status(200).json({ message: "Sharing disabled" });
  } catch (error) {
    console.error("Error in revokeShareLink:", error && error.stack ? error.stack : error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getAutomataByShareId = async (req, res) => {
  try {
    const { shareId } = req.params;
    const automata = await Automata.findOne({ shareId, isPublic: true });

    if (!automata) {
      return res.status(404).json({ error: "Shared automata not found" });
    }

    return res.status(200).json(automata);
  } catch (error) {
    console.error("Error in getAutomataByShareId:", error && error.stack ? error.stack : error);
    return res.status(500).json({ error: error.message });
  }
};

exports.exportAutomata = async (req, res) => {
  try {
    const { id } = req.params;
    const automata = await Automata.findById(id);

    if (!canAccessAutomata(automata, req.user)) {
      return res.status(404).json({ error: "Automata not found" });
    }

    const fileName = `${automata.name.replace(/[^a-z0-9]/gi, "_") || "automata"}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(JSON.stringify(automata, null, 2));
  } catch (error) {
    console.error("Error in exportAutomata:", error && error.stack ? error.stack : error);
    return res.status(500).json({ error: error.message });
  }
};
