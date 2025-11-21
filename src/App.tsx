import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Login } from './components/Auth/Login';
import { SignUp } from './components/Auth/SignUp';
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardApp from './components/DashboardApp';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
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