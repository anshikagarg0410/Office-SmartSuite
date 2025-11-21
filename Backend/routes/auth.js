const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// --- Mock Database and Secret Key ---
const USERS = [];
const JWT_SECRET = 'your_super_secret_key'; // ⚠️ IMPORTANT: Change this and use environment variables!

/**
 * Middleware to protect dashboard routes by checking for a valid JWT.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expected format: Bearer TOKEN

  if (token == null) return res.status(401).send({ message: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    // If the token is invalid or expired
    if (err) return res.status(403).send({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ------------------------------------

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { email, password } = req.body;

  if (USERS.find(u => u.email === email)) {
    return res.status(409).send({ message: 'This email is already in use.' });
  }

  // NOTE: In a real app, hash the password (e.g., using bcrypt)
  const newUser = { id: USERS.length + 1, email, password };
  USERS.push(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '1h' });
  
  res.status(201).send({ 
    message: 'User created successfully',
    token: token,
    user: { email: newUser.email, id: newUser.id }
  });
});

// POST /api/auth/signin
router.post('/signin', (req, res) => {
  const { email, password } = req.body;

  // NOTE: In a real app, compare with the hashed password
  const user = USERS.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).send({ message: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  
  res.send({ 
    message: 'Login successful',
    token: token,
    user: { email: user.email, id: user.id }
  });
});

// POST /api/auth/signout
router.post('/signout', (req, res) => {
  // Signout is primarily client-side (deleting the token).
  res.send({ message: 'Signout complete (client must remove JWT).' });
});

module.exports = router;
module.exports.authenticateToken = authenticateToken; // Export middleware for dashboard routes