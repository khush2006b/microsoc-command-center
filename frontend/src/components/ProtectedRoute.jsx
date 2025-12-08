import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false, requiredPermission = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05080F] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-red-400 mb-4 animate-pulse">⚡</div>
          <div className="text-cyan-400 font-['Orbitron']">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.status !== 'active') {
    return (
      <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/40 border border-yellow-500/50 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-['Orbitron'] text-yellow-400 mb-4">
            Account Pending
          </h2>
          <p className="text-gray-400 font-['Roboto_Mono'] text-sm">
            Your account is awaiting admin approval. You will be notified once approved.
          </p>
        </div>
      </div>
    );
  }

  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/40 border border-red-500/50 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-['Orbitron'] text-red-400 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-400 font-['Roboto_Mono'] text-sm">
            Admin privileges required to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (requiredPermission && user.role !== 'admin' && !user.permissions?.[requiredPermission]) {
    return (
      <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/40 border border-red-500/50 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-['Orbitron'] text-red-400 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-400 font-['Roboto_Mono'] text-sm mb-2">
            You do not have the required permission:
          </p>
          <p className="text-red-400 font-['Orbitron'] font-bold">
            {requiredPermission}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
