// anshikagarg0410/office-smartsuite/Office-SmartSuite-e150d57d6daa8a53e31aa02e355a87cf05b046b4/Backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = 3001;

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

// --- FIX START: EXPOSE UNPROTECTED GET ROUTES ---

// Expose GET /api/data/monitoring without JWT protection
app.get('/api/data/monitoring', (req, res, next) => {
    dashboardRoutes(req, res, next);
});

// RE-FIX: Expose GET /api/data/alerts without JWT protection for initial load
app.get('/api/data/alerts', (req, res, next) => {
    dashboardRoutes(req, res, next);
});

// --- FIX END ---

// Dashboard Data/Control Routes (PROTECTED)
app.use('/api/data', dashboardRoutes); 

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});