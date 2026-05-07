const mongoose = require("mongoose");

const simulationSchema = new mongoose.Schema(
  {
    automataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Automata",
      required: true,
    },
    input: {
      type: String,
      required: true,
    },
    accepted: {
      type: Boolean,
      required: true,
    },
    steps: [
      {
        state: String,
        symbol: String,
        stackContent: String,
        tapePosition: Number,
      },
    ],
    finalState: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Simulation", simulationSchema);
