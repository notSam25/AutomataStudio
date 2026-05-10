const http = require("http");
const connectDB = require("./config/db");
const app = require("./app");

const start = async () => {
  try {
    // Connect to MongoDB for the local server entrypoint
    await connectDB();

    // Create HTTP server
    const PORT = process.env.PORT || 8080;
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB connection error:", err && err.stack ? err.stack : err);
    // Exit with non-zero so hosting platform marks deployment as failed
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

// Global error handlers to capture unexpected crashes and log them
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err && err.stack ? err.stack : err);
  // give log a moment to flush then exit
  setTimeout(() => process.exit(1), 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason && reason.stack ? reason.stack : reason);
  setTimeout(() => process.exit(1), 1000);
});

module.exports = { app, start };
