const mongoose = require("mongoose");

let cachedConnectionPromise = null;

const maskCredentials = (uri) => {
  try {
    // simple masking: hide user:pass@ segment
    return uri.replace(/:\/\/.*@/, '://***:***@');
  } catch (e) {
    return uri;
  }
};

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || "mongodb://mongo:27017/automata-studio";

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  console.log("Attempting MongoDB connection to:", maskCredentials(mongoURI));

  // Use sensible timeouts so the process doesn't wait indefinitely
  const connectOptions = {
    // Mongoose 6+ uses these by default, but we include them for clarity
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  };

  // Attach connection event listeners for better observability
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connection established");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error event:", err && err.stack ? err.stack : err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  // Attempt connection and let caller handle failures
  cachedConnectionPromise = mongoose.connect(mongoURI, connectOptions);

  try {
    await cachedConnectionPromise;
    return mongoose.connection;
  } catch (error) {
    cachedConnectionPromise = null;
    throw error;
  }
};

module.exports = connectDB;
