const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth'); 

// --- Mock Smart Device State & Data Store (In-Memory) ---
let smartOfficeState = {
  // MonitoringTab state
  smartLight: {
    autoMode: true,
    lightOn: false,
    ldrValue: 450,
  },
  airQuality: {
    airQualityIndex: 85,
    temperature: 24, // °C
  },
  // AlertsTab history (initial data)
  alertHistory: [
    { id: '1', timestamp: '2025-11-18 14:32:15', type: 'Motion Detected', status: 'Resolved' },
    { id: '2', timestamp: '2025-11-18 13:45:22', type: 'Unauthorized Movement', status: 'Resolved' },
    { id: '3', timestamp: '2025-11-18 12:18:09', type: 'Motion Detected', status: 'Resolved' },
  ],
  // AccessSafetyTab state and attendance
  accessSafety: {
    gateOpen: false,
    fireSystemOn: true,
    fireDetected: false,
    attendance: [
      { id: '1', employeeId: 'A1234', name: 'John Smith', time: '08:30 AM' },
      { id: '2', employeeId: 'A2345', name: 'Sarah Johnson', time: '08:45 AM' },
      { id: '3', employeeId: 'A3456', name: 'Mike Davis', time: '09:30 AM' },
    ],
  }
};

// Helper function (matches frontend logic)
const getAirStatus = (value) => {
  if (value < 100) return { label: 'Good', color: 'green' };
  if (value < 200) return { label: 'Moderate', color: 'yellow' };
  return { label: 'Poor', color: 'red' };
};

// Apply authentication middleware to all routes in this file
router.use(authenticateToken); 

// ------------------------------------
// MONITORING ROUTES - /api/data/monitoring
// ------------------------------------

// GET /api/data/monitoring - Get current sensor readings
router.get('/monitoring', (req, res) => {
  const { smartLight, airQuality } = smartOfficeState;
  const responseData = {
    smartLight,
    airQuality,
    airQualityStatus: getAirStatus(airQuality.airQualityIndex)
  };
  res.json(responseData);
});

// POST /api/data/monitoring/light-control - Control Smart Light 
router.post('/monitoring/light-control', (req, res) => {
  const { autoMode, lightOn } = req.body;
  
  if (typeof autoMode === 'boolean') smartOfficeState.smartLight.autoMode = autoMode;
  
  // Manual control check 
  if (typeof lightOn === 'boolean' && !smartOfficeState.smartLight.autoMode) {
    smartOfficeState.smartLight.lightOn = lightOn;
  }
  
  // Apply auto-mode logic if it's active
  if (smartOfficeState.smartLight.autoMode) {
     // NOTE: This logic simulates the frontend's effect hook logic (LDR < 500 = ON)
     smartOfficeState.smartLight.lightOn = smartOfficeState.smartLight.ldrValue < 500;
  }

  res.json({ message: 'Light state updated', smartLight: smartOfficeState.smartLight });
});


// ------------------------------------
// ALERTS ROUTES - /api/data/alerts
// ------------------------------------

// GET /api/data/alerts - Get Alert History and current system state
router.get('/alerts', (req, res) => {
  res.json({ 
    alertMode: smartOfficeState.alertMode || true, // Default to true if not explicitly set
    motionDetected: smartOfficeState.accessSafety.motionDetected,
    alertHistory: smartOfficeState.alertHistory 
  });
});

// POST /api/data/alerts/toggle-mode - Toggle Security Alert Mode
router.post('/alerts/toggle-mode', (req, res) => {
  const { alertMode } = req.body;
  if (typeof alertMode === 'boolean') {
    // NOTE: In a simulation, we just acknowledge the change.
    res.json({ message: `Security alert mode acknowledged as ${alertMode ? 'ON' : 'OFF'}` });
  } else {
    res.status(400).json({ message: 'Invalid parameter for alertMode' });
  }
});

// POST /api/data/alerts/log-motion - Endpoint to manually log an alert (for simulation/frontend use)
router.post('/alerts/log-motion', (req, res) => {
  const newAlert = {
    id: Date.now().toString(),
    timestamp: new Date().toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(',', ''),
    type: req.body.type || 'Motion Detected',
    status: req.body.status || 'Active'
  };
  smartOfficeState.alertHistory.unshift(newAlert);
  // Keep history size manageable
  if (smartOfficeState.alertHistory.length > 20) smartOfficeState.alertHistory.pop();
  
  res.json({ message: 'Alert logged', newAlert });
});


// ------------------------------------
// ACCESS & SAFETY ROUTES - /api/data/access-safety
// ------------------------------------

// GET /api/data/access-safety - Get initial Access and Safety data
router.get('/access-safety', (req, res) => {
  const { attendance, fireSystemOn, fireDetected, gateOpen } = smartOfficeState.accessSafety;
  res.json({ attendance, fireSystemOn, fireDetected, gateOpen });
});

// POST /api/data/access-safety/rfid-scan - Simulate an RFID scan 
router.post('/access-safety/rfid-scan', (req, res) => {
  // Simulate a new, random entry (from frontend logic)
  const names = ['Emma Wilson', 'David Brown', 'Lisa Chen'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const newId = `A${Math.floor(1000 + Math.random() * 9000)}`;
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const newRecord = { id: Date.now().toString(), employeeId: newId, name: randomName, time };
  smartOfficeState.accessSafety.attendance.unshift(newRecord); 
  
  // Simulate gate open instantly
  smartOfficeState.accessSafety.gateOpen = true;
  
  // And close it after 3 seconds (simulated timer from frontend)
  setTimeout(() => {
    smartOfficeState.accessSafety.gateOpen = false;
  }, 3000); 

  res.json({ 
    message: `Access granted for ${randomName}.`,
    newRecord,
    gateOpen: true
  });
});

// POST /api/data/access-safety/fire-test - Simulate a fire test detection
router.post('/access-safety/fire-test', (req, res) => {
  if (!smartOfficeState.accessSafety.fireSystemOn) {
    return res.status(400).json({ message: 'Fire system is inactive.' });
  }

  smartOfficeState.accessSafety.fireDetected = true;
  
  // Simulate the fire alert clearing after a delay
  setTimeout(() => {
    smartOfficeState.accessSafety.fireDetected = false;
  }, 5000);

  res.json({ message: 'Fire detection simulated. Alerting!' });
});

// POST /api/data/access-safety/fire-system-toggle - Toggle Fire System status
router.post('/access-safety/fire-system-toggle', (req, res) => {
  const { fireSystemOn } = req.body;
  if (typeof fireSystemOn === 'boolean') {
    smartOfficeState.accessSafety.fireSystemOn = fireSystemOn;
    res.json({ message: `Fire system set to ${fireSystemOn ? 'Active' : 'Inactive'}`, fireSystemOn });
  } else {
    res.status(400).json({ message: 'Invalid parameter for fireSystemOn' });
  }
});


module.exports = router;