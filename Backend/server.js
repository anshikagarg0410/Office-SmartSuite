const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard'); // This is now the protected router

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

// --- FIX START: EXPOSE UNPROTECTED MONITORING DATA ---
// We manually register the GET /monitoring route here,
// before the authentication middleware is applied inside dashboardRoutes.
// This allows the MonitoringTab to load data without a JWT token.
app.get('/api/data/monitoring', (req, res, next) => {
    // We pass control to the dashboard router, which will execute its routes until it finds a match.
    // Since the first route in dashboard.js is GET /monitoring, it will execute that logic.
    dashboardRoutes(req, res, next);
});
// --- FIX END ---

// Dashboard Data/Control Routes (PROTECTED)
// All routes added here (excluding the GET /monitoring route above) will still be protected
// by the router.use(authenticateToken) inside dashboard.js.
app.use('/api/data', dashboardRoutes); 

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});