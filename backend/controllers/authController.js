//authentication utilities for password hashing and tokens
const crypto = require("crypto");
const User = require("../models/User");

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

//hash password with salt using pbkdf2
const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString("hex");
  return `${salt}:${hash}`;
};

//verify password using timing safe comparison
const verifyPassword = (password, passwordHash) => {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) {
    return false;
  }

  const attempted = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(attempted));
};

//generate random auth token
const issueToken = () => crypto.randomBytes(32).toString("hex");

//return minimal user object for clients
const sanitizeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
});

//register new user and issue token
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    //validate input fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();

    //check for existing user by email or username
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existing) {
      return res.status(409).json({ error: "Email or username already exists" });
    }

    //create user and issue token
    const authToken = issueToken();
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      authToken,
    });

    //respond with sanitized user and token
    return res.status(201).json({
      user: sanitizeUser(user),
      token: authToken,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//login user and issue new token
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //validate input
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    //find user and verify password
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    //assign new token and save
    user.authToken = issueToken();
    await user.save();

    //respond with sanitized user and token
    return res.status(200).json({
      user: sanitizeUser(user),
      token: user.authToken,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//return current user profile
exports.getMe = async (req, res) => {
  return res.status(200).json({ user: sanitizeUser(req.user) });
};

//update current user's username with uniqueness check
exports.updateMe = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "username is required" });
    }

    const normalized = String(username).trim();
    const existing = await User.findOne({ username: normalized, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { username: normalized },
      { new: true },
    );

    return res.status(200).json({ user: sanitizeUser(updated) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//invalidate current user's auth token
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { authToken: null });
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
