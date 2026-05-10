const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    id: String,
    x: Number,
    y: Number,
  },
  { _id: false },
);

const transitionSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    writeSymbol: {
      type: String,
      default: null, // For Turing machines
    },
    move: {
      type: String,
      default: null, // For Turing machines
    },
    stackSymbol: {
      type: String,
      default: null, // For PDA
    },
    pushSymbol: {
      type: String,
      default: null, // For PDA
    },
  },
  { _id: false },
);

const automataSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["DFA", "NFA", "PDA", "TURING"],
      required: true,
    },
    states: {
      type: [stateSchema],
      required: true,
    },
    alphabet: {
      type: [String],
      required: true,
    },
    initialState: {
      type: String,
      required: true,
    },
    acceptStates: {
      type: [String],
      required: true,
    },
    transitions: [transitionSchema],
    stackAlphabet: {
      type: [String],
      default: [], // For PDA
    },
    initialStackSymbol: {
      type: String,
      default: "Z", // For PDA
    },
    tape: {
      type: String,
      default: null, // For Turing Machine
    },
    description: {
      type: String,
      default: "",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Automata", automataSchema);
