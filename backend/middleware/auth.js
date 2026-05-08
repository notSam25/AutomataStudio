const User = require("../models/User");

const getToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7);
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const user = await User.findOne({ authToken: token }).select("_id username email");
    req.user = user || null;
    return next();
  } catch (error) {
    return res.status(500).json({ error: "Authentication check failed" });
  }
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await User.findOne({ authToken: token }).select("_id username email");
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(500).json({ error: "Authentication failed" });
  }
};

module.exports = {
  optionalAuth,
  requireAuth,
};
