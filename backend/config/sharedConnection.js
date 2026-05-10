const connectDB = require("./db");
const mongoose = require("mongoose");

// Shared across all Vercel function invocations in the same container
let connectionPromise = null;

/**
 * Ensure database connection is established.
 * This is called by all API handlers to use a shared, cached connection.
 * Timeouts are handled gracefully without breaking the underlying connection attempt.
 */
const ensureConnection = async (timeoutMs = 20000) => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // If no connection attempt in progress, start one
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((err) => {
      // Clear cache on error so next request can retry
      connectionPromise = null;
      throw err;
    });
  }

  // Wait for connection with timeout
  // Note: if timeout fires but connection succeeds later, next request will use the ready connection
  try {
    await Promise.race([
      connectionPromise,
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Connection initialization timeout - will retry on next request")),
          timeoutMs,
        );
      }),
    ]);
  } catch (timeoutErr) {
    // If timeout occurred but connection is actually ready, allow it
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    // Otherwise throw the timeout error
    throw timeoutErr;
  }

  return mongoose.connection.readyState === 1;
};

module.exports = { ensureConnection };
