// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // your MySQL pool
const dotenv = require('dotenv');
dotenv.config();

// REGISTER
router.post('/register', async (req, res) => {
  const { full_name, email, password, role } = req.body;
  if (!full_name || !email || !password || !role)
    return res.status(400).json({ message: "All fields are required" });

  try {
    // Check if email already exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await pool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
      [full_name, email, hashedPassword, role]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body; // only email and password
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    // Get user by email
    const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user.length) return res.status(400).json({ message: "Invalid credentials" });

    // Compare passwords
    const valid = await bcrypt.compare(password, user[0].password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { id: user[0].id, role: user[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      role: user[0].role,
      full_name: user[0].full_name,
      email: user[0].email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
