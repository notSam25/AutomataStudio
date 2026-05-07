const mongoose = require('mongoose');

const transitionSchema = new mongoose.Schema({
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
  stackSymbol: {
    type: String,
    default: null, // For PDA
  },
  pushSymbol: {
    type: String,
    default: null, // For PDA
  },
}, { _id: false });

const automataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['DFA', 'NFA', 'PDA', 'TURING'],
      required: true,
    },
    states: {
      type: [String],
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
      default: 'Z', // For PDA
    },
    tape: {
      type: String,
      default: null, // For Turing Machine
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Automata', automataSchema);
