require('dotenv').config(); // Load environment variables first
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const mongoose = require('mongoose'); // Import Mongoose

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const { getAlertsUnprotected } = require('./routes/dashboard'); 

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
app.use(bodyParser.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Base Route
app.get('/', (req, res) => {
  res.send('Smart Office Backend Running!');
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Unprotected Routes (Fixes)
app.get('/api/data/monitoring', (req, res, next) => {
    dashboardRoutes(req, res, next);
});

app.get('/api/data/alerts', (req, res, next) => {
    getAlertsUnprotected(req, res, next);
});

// Dashboard Data/Control Routes (PROTECTED)
app.use('/api/data', dashboardRoutes); 

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});