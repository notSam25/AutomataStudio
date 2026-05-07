const mongoose = require('mongoose');
const Automata = require('./models/Automata');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://mongo:27017/automata-studio';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    // Clear existing data
    await Automata.deleteMany({});

    // Sample DFA: Accept strings ending with "01"
    const dfa = new Automata({
      name: 'Accept Strings Ending with 01',
      type: 'DFA',
      states: ['q0', 'q1', 'q2', 'q3'],
      alphabet: ['0', '1'],
      initialState: 'q0',
      acceptStates: ['q3'],
      transitions: [
        { from: 'q0', to: 'q0', symbol: '0' },
        { from: 'q0', to: 'q1', symbol: '1' },
        { from: 'q1', to: 'q2', symbol: '0' },
        { from: 'q1', to: 'q1', symbol: '1' },
        { from: 'q2', to: 'q3', symbol: '1' },
        { from: 'q2', to: 'q2', symbol: '0' },
        { from: 'q3', to: 'q2', symbol: '0' },
        { from: 'q3', to: 'q1', symbol: '1' },
      ],
      description: 'A DFA that accepts binary strings ending with 01',
    });

    // Sample DFA: Accept even number of 0s
    const dfa2 = new Automata({
      name: 'Accept Even Number of 0s',
      type: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0', '1'],
      initialState: 'q0',
      acceptStates: ['q0'],
      transitions: [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q0', symbol: '1' },
        { from: 'q1', to: 'q0', symbol: '0' },
        { from: 'q1', to: 'q1', symbol: '1' },
      ],
      description: 'A DFA that accepts binary strings with even number of 0s',
    });

    await Automata.insertMany([dfa, dfa2]);
    console.log('Seed data inserted successfully');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

connectDB().then(() => seedDatabase());
