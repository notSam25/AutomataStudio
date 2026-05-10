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
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const mongoURI = process.env.MONGO_URI || (isProduction ? "" : "mongodb://mongo:27017/automata-studio");

  if (!mongoURI) {
    throw new Error("MONGO_URI is not set. Configure the Atlas connection string in Vercel environment variables.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  console.log("Attempting MongoDB connection to:", maskCredentials(mongoURI));

  // Use sensible timeouts so the process doesn't wait indefinitely
  const connectOptions = {
    // serverSelectionTimeoutMS: Time to select a server (14s allows cloud latency + cold start)
    // connectTimeoutMS: Time for initial TCP connection (10s)
    // socketTimeoutMS: Time for individual socket operations (30s)
    // These are longer because Vercel cold start + Atlas negotiation can take time
    serverSelectionTimeoutMS: isProduction ? 14000 : 5000,
    connectTimeoutMS: isProduction ? 10000 : 5000,
    socketTimeoutMS: isProduction ? 30000 : 10000,
    // Retry connection a few times with exponential backoff
    retryWrites: true,
    maxPoolSize: isProduction ? 1 : 10, // Vercel serverless: limit pool size
    minPoolSize: 0, // Don't maintain idle connections
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
