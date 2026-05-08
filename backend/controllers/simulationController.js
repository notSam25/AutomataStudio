const Automata = require("../models/Automata");
const Simulation = require("../models/Simulation");

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

const getType = (automata) => String(automata.type || "DFA").toUpperCase();

const getStepState = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(",") : "∅";
  }

  return value;
};

const buildStep = (state, symbol, extra = {}) => ({
  state: getStepState(state),
  symbol: symbol === undefined ? null : symbol,
  stackContent: extra.stackContent || "",
  tapePosition: extra.tapePosition === undefined ? 0 : extra.tapePosition,
});

const simulateDfaLike = (automata, input) => {
  let currentState = automata.initialState;
  const steps = [buildStep(currentState, null)];
  let rejected = false;

  for (const symbol of input.split("")) {
    const transition = (automata.transitions || []).find(
      (t) => t.from === currentState && t.symbol === symbol,
    );

    if (!transition) {
      rejected = true;
      steps.push(
        buildStep(currentState, symbol, {
          stackContent: "",
          tapePosition: 0,
        }),
      );
      break;
    }

    currentState = transition.to;
    steps.push(buildStep(currentState, symbol));
  }

  return {
    finalState: currentState,
    accepted: !rejected && (automata.acceptStates || []).includes(currentState),
    steps,
  };
};

const simulateNfa = (automata, input) => {
  let currentStates = new Set([automata.initialState]);
  const steps = [buildStep([automata.initialState], null)];
  let rejected = false;

  for (const symbol of input.split("")) {
    const nextStates = new Set();

    currentStates.forEach((state) => {
      (automata.transitions || [])
        .filter((t) => t.from === state && t.symbol === symbol)
        .forEach((transition) => nextStates.add(transition.to));
    });

    if (nextStates.size === 0) {
      rejected = true;
      steps.push(
        buildStep(Array.from(currentStates), symbol, {
          stackContent: "",
          tapePosition: 0,
        }),
      );
      break;
    }

    currentStates = nextStates;
    steps.push(buildStep(Array.from(currentStates), symbol));
  }

  const accepted =
    !rejected &&
    Array.from(currentStates).some((state) =>
      (automata.acceptStates || []).includes(state),
    );

  return {
    finalState: getStepState(Array.from(currentStates)),
    accepted,
    steps,
  };
};

const applyPdaTransition = (stack, transition) => {
  const nextStack = stack.slice();

  if (transition.stackSymbol && nextStack[nextStack.length - 1] === transition.stackSymbol) {
    nextStack.pop();
  }

  if (transition.pushSymbol) {
    const pushSymbols = String(transition.pushSymbol).split("");
    for (let index = pushSymbols.length - 1; index >= 0; index -= 1) {
      nextStack.push(pushSymbols[index]);
    }
  }

  return nextStack;
};

const simulatePda = (automata, input) => {
  let currentState = automata.initialState;
  let stack = automata.initialStackSymbol ? [automata.initialStackSymbol] : [];
  const steps = [buildStep(currentState, null, { stackContent: stack.join("") })];
  let rejected = false;

  for (const symbol of input.split("")) {
    const transition = (automata.transitions || []).find((t) => {
      if (t.from !== currentState || t.symbol !== symbol) {
        return false;
      }

      if (!t.stackSymbol) {
        return true;
      }

      return stack[stack.length - 1] === t.stackSymbol;
    });

    if (!transition) {
      rejected = true;
      steps.push(
        buildStep(currentState, symbol, {
          stackContent: stack.join(""),
          tapePosition: 0,
        }),
      );
      break;
    }

    stack = applyPdaTransition(stack, transition);
    currentState = transition.to;
    steps.push(buildStep(currentState, symbol, { stackContent: stack.join("") }));
  }

  return {
    finalState: currentState,
    accepted: !rejected && (automata.acceptStates || []).includes(currentState),
    steps,
  };
};

const simulateTuring = (automata, input) => {
  let currentState = automata.initialState;
  const tape = input.length > 0 ? input.split("") : ["_"];
  let head = 0;
  const steps = [buildStep(currentState, null, { tapePosition: head, stackContent: tape.join("") })];
  let rejected = false;
  const maxSteps = Math.max(100, tape.length * 20);

  for (let stepCount = 0; stepCount < maxSteps; stepCount += 1) {
    const symbol = tape[head] || "_";
    const transition = (automata.transitions || []).find(
      (t) => t.from === currentState && t.symbol === symbol,
    );

    if (!transition) {
      break;
    }

    const writeSymbol = transition.writeSymbol || symbol;
    tape[head] = writeSymbol;

    const move = String(transition.move || "S").toUpperCase();
    if (move === "L") {
      if (head === 0) {
        tape.unshift("_");
      } else {
        head -= 1;
      }
    } else if (move === "R") {
      head += 1;
      if (head >= tape.length) {
        tape.push("_");
      }
    }

    currentState = transition.to;
    steps.push(
      buildStep(currentState, symbol, {
        tapePosition: head,
        stackContent: tape.join(""),
      }),
    );
  }

  return {
    finalState: currentState,
    accepted: !rejected && (automata.acceptStates || []).includes(currentState),
    steps,
  };
};

// Simulate automata with input string
exports.simulateAutomata = async (req, res) => {
  try {
    const { automataId, input } = req.body;

    if (!automataId || input === undefined) {
      return res.status(400).json({ error: "Missing automataId or input" });
    }

    const automata = await Automata.findById(automataId);
    if (!canAccessAutomata(automata, req.user)) {
      return res.status(404).json({ error: "Automata not found" });
    }

    const type = getType(automata);
    let result;

    if (type === "NFA") {
      result = simulateNfa(automata, input);
    } else if (type === "PDA") {
      result = simulatePda(automata, input);
    } else if (type === "TURING") {
      result = simulateTuring(automata, input);
    } else {
      result = simulateDfaLike(automata, input);
    }

    const simulation = new Simulation({
      automataId,
      input,
      accepted: result.accepted,
      steps: result.steps,
      finalState: result.finalState,
    });

    const savedSimulation = await simulation.save();
    res.status(201).json({
      input,
      accepted: result.accepted,
      finalState: result.finalState,
      steps: result.steps,
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
    const automata = await Automata.findById(automataId);
    if (!canAccessAutomata(automata, req.user)) {
      return res.status(404).json({ error: "Automata not found" });
    }

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
      return res.status(404).json({ error: "Simulation not found" });
    }

    const automata = await Automata.findById(simulation.automataId);
    if (!canAccessAutomata(automata, req.user)) {
      return res.status(404).json({ error: "Simulation not found" });
    }

    res.status(200).json(simulation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
