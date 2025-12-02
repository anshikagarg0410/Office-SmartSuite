import * as React from 'react';
import { Routes, Route } from 'react-router-dom';

import { AuthModal } from './components/Auth/AuthModal'; 
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardApp from './components/DashboardApp';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthModal />} />
      <Route path="/signup" element={<AuthModal/>} />
      {/* All other routes are protected and point to the main dashboard */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}