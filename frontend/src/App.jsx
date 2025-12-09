import './theme/cleanCommandTheme.css';
import './theme/holographicEffects.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { RangerDashboard } from './components/layout/CleanDashboard';
import PendingUsersPanel from './components/admin/PendingUsersPanel';
import { IncidentList } from './components/incidents/IncidentList';
import { IncidentDetails } from './components/incidents/IncidentDetails';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RangerDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/incidents"
            element={
              <ProtectedRoute requiredPermission="viewIncidents">
                <IncidentList />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/incidents/:id"
            element={
              <ProtectedRoute requiredPermission="viewIncidents">
                <IncidentDetails />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/pending-users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <div className="min-h-screen bg-[#05080F] p-8">
                  <PendingUsersPanel />
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;