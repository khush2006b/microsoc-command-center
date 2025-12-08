import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function PendingUsersPanel() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState({
    viewLogs: false,
    viewAlerts: false,
    viewIncidents: false,
    viewAnalytics: false,
    manageUsers: false
  });
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/pending-users`);
      if (response.data.success) {
        setPendingUsers(response.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const response = await axios.post(`${API_URL}/admin/approve/${userId}`, {
        permissions
      });
      
      if (response.data.success) {
        setPendingUsers(pendingUsers.filter(u => u._id !== userId));
        setSelectedUser(null);
        setPermissions({
          viewLogs: false,
          viewAlerts: false,
          viewIncidents: false,
          viewAnalytics: false,
          manageUsers: false
        });
      }
    } catch (error) {
      console.error('Failed to approve user:', error);
      alert(error.response?.data?.error || 'Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('Are you sure you want to reject this user request?')) return;
    
    try {
      const response = await axios.post(`${API_URL}/admin/reject/${userId}`);
      
      if (response.data.success) {
        setPendingUsers(pendingUsers.filter(u => u._id !== userId));
      }
    } catch (error) {
      console.error('Failed to reject user:', error);
      alert(error.response?.data?.error || 'Failed to reject user');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-cyan-400 font-['Orbitron']">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-['Orbitron'] text-red-400 uppercase tracking-wider">
            Pending Analyst Requests
          </h2>
          <div className="bg-red-500/20 px-4 py-2 rounded border border-red-500/50">
            <span className="text-red-400 font-['Roboto_Mono'] font-bold">{pendingUsers.length}</span>
            <span className="text-gray-400 text-sm ml-2">Pending</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-['Orbitron'] tracking-wider text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 rounded transition-all"
          >
            🏠 DASHBOARD
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-['Orbitron'] tracking-wider text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded transition-all"
          >
            🚪 LOGOUT
          </button>
        </div>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-black/30 border border-gray-700 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-gray-400 font-['Roboto_Mono']">No pending requests</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <div
              key={user._id}
              className="bg-black/40 border border-red-500/30 rounded-lg p-6 hover:border-red-500/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-['Orbitron'] text-cyan-400 mb-1">
                    {user.fullName}
                  </h3>
                  <p className="text-sm text-gray-400 font-['Roboto_Mono']">{user.email}</p>
                </div>
                <div className="text-xs text-gray-500 font-['Roboto_Mono']">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              {user.department && (
                <div className="mb-2">
                  <span className="text-xs text-gray-500">Department:</span>
                  <span className="ml-2 text-sm text-gray-300 font-['Roboto_Mono']">
                    {user.department}
                  </span>
                </div>
              )}

              {user.reasonForAccess && (
                <div className="mb-4">
                  <span className="text-xs text-gray-500">Reason:</span>
                  <p className="mt-1 text-sm text-gray-300 font-['Roboto_Mono'] bg-black/30 p-3 rounded">
                    {user.reasonForAccess}
                  </p>
                </div>
              )}

              {selectedUser === user._id ? (
                <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-['Orbitron'] text-cyan-400 uppercase mb-3">
                    Assign Permissions
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(permissions).map((perm) => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions[perm]}
                          onChange={(e) => setPermissions({
                            ...permissions,
                            [perm]: e.target.checked
                          })}
                          className="w-4 h-4 bg-black border-cyan-500 rounded focus:ring-2 focus:ring-cyan-500"
                        />
                        <span className="text-xs text-gray-300 font-['Roboto_Mono']">
                          {perm.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-3">
                {selectedUser === user._id ? (
                  <>
                    <button
                      onClick={() => handleApprove(user._id)}
                      className="flex-1 bg-green-500/20 border border-green-500 text-green-400 font-['Orbitron'] font-bold py-2 rounded uppercase tracking-wider hover:bg-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all text-sm"
                    >
                      ✓ Confirm Approve
                    </button>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="px-6 bg-gray-500/20 border border-gray-500 text-gray-400 font-['Orbitron'] py-2 rounded hover:bg-gray-500/30 transition-all text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedUser(user._id)}
                      className="flex-1 bg-green-500/20 border border-green-500 text-green-400 font-['Orbitron'] font-bold py-2 rounded uppercase tracking-wider hover:bg-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all text-sm"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(user._id)}
                      className="flex-1 bg-red-500/20 border border-red-500 text-red-400 font-['Orbitron'] font-bold py-2 rounded uppercase tracking-wider hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all text-sm"
                    >
                      ✗ Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
