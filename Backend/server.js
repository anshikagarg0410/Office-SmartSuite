const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = 3001; // Running on port 3001 to avoid conflicts with the frontend (port 3000)

// Middleware
app.use(cors({
  // Allows the frontend to make requests. Replace '*' with 'http://localhost:3000' in production.
  origin: '*', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
app.use(bodyParser.json());

// Base Route
app.get('/', (req, res) => {
  res.send('Smart Office Backend Running! Access APIs at /api/auth and /api/data.');
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Dashboard Data/Control Routes (Protected by Auth Middleware)
app.use('/api/data', dashboardRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});