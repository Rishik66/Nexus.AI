import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { DashboardLayout } from './layouts/DashboardLayout.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';

// Pages
import { Landing } from './pages/Landing.js';
import { Login } from './pages/Login.js';
import { CommandCenter } from './pages/CommandCenter.js';
import { Dashboard } from './pages/Dashboard.js';
import { Inventory } from './pages/Inventory.js';
import { Finance } from './pages/Finance.js';
import { Customers } from './pages/Customers.js';
import { Suppliers } from './pages/Suppliers.js';
import { Workflows } from './pages/Workflows.js';
import { Approvals } from './pages/Approvals.js';
import { DocumentIntelligence } from './pages/DocumentIntelligence.js';
import { AgentActivity } from './pages/AgentActivity.js';
import { AuditLogs } from './pages/AuditLogs.js';
import { Settings } from './pages/Settings.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes: Landing Page (all features showcased) & Login/Signup */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes (Everyone must log in first to use any application feature) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/command-center" element={<CommandCenter />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/sales" element={<Finance />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/documents" element={<DocumentIntelligence />} />
              <Route path="/agents" element={<AgentActivity />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/workspace" element={<Navigate to="/command-center" replace />} />
            </Route>
          </Route>

          {/* Catch-all redirect to public landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
