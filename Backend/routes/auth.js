const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // For password hashing
const User = require('../models/User'); // Import User model

// Get secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Middleware to protect dashboard routes by checking for a valid JWT.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).send({ message: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).send({ message: 'This email is already in use.' });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create new user in MongoDB
    const newUser = await User.create({
      email,
      password: hashedPassword
    });

    // 4. Generate Token
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '1h' });
    
    res.status(201).send({ 
      message: 'User created successfully',
      token: token,
      user: { email: newUser.email, id: newUser._id }
    });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send({ message: 'Invalid email or password.' });
    }

    // 2. Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({ message: 'Invalid email or password.' });
    }

    // 3. Generate Token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    
    res.send({ 
      message: 'Login successful',
      token: token,
      user: { email: user.email, id: user._id }
    });

  } catch (error) {
    console.error("Signin Error:", error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// POST /api/auth/signout
router.post('/signout', (req, res) => {
  res.send({ message: 'Signout complete.' });
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;