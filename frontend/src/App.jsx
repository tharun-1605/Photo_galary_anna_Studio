import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardCollections from './pages/DashboardCollections';
import DashboardCollectionDetail from './pages/DashboardCollectionDetail';
import DashboardActivity from './pages/DashboardActivity';
import DashboardSettings from './pages/DashboardSettings';
import ClientGallery from './pages/ClientGallery';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Portfolio Route */}
        <Route path="/" element={<Home />} />
        
        {/* Public Client Gallery Route */}
        <Route path="/gallery/:slug" element={<ClientGallery />} />

        {/* Admin Authentication Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/register" element={<Register />} />

        {/* Admin Dashboard Protected Routes */}
        <Route path="/admin" element={<Navigate to="/admin/collections" replace />} />
        <Route path="/admin/collections" element={<DashboardCollections />} />
        <Route path="/admin/collections/:id" element={<DashboardCollectionDetail />} />
        <Route path="/admin/activities" element={<DashboardActivity />} />
        <Route path="/admin/settings" element={<DashboardSettings />} />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
