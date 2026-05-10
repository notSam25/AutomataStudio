const connectDB = require("./db");
const mongoose = require("mongoose");

// Start connection immediately on module load (during cold start)
// This gives the connection time to establish before requests arrive
let connectionPromise = connectDB().catch((err) => {
  console.error("Initial connection attempt failed on module load, will retry on next request:", err.message);
  // Don't throw - allow the module to load
});

/**
 * Ensure database connection is established.
 * Called by all API handlers. Connection starts immediately on module load,
 * so this usually just waits for an already-in-progress connection.
 */
const ensureConnection = async (timeoutMs = 8000) => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // If no promise exists (module just loaded or previous attempt failed), start a new attempt
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((err) => {
      // Clear on error so next request retries
      connectionPromise = null;
      throw err;
    });
  }

  // Wait for connection with timeout (shorter since it should already be in progress)
  try {
    await Promise.race([
      connectionPromise,
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Connection timeout - MongoDB still initializing")),
          timeoutMs,
        );
      }),
    ]);
  } catch (err) {
    // If already connected despite the error, allow it
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    throw err;
  }

  return mongoose.connection.readyState === 1;
};

module.exports = { ensureConnection };
