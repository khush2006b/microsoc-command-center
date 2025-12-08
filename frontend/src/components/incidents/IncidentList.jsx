// frontend/src/components/incidents/IncidentList.jsx
// Enterprise Incident Management List View

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { CreateIncidentModal } from './CreateIncidentModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function IncidentList() {
  const navigate = useNavigate();
  const socket = useSocket();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ severity: '', status: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.severity) params.append('severity', filter.severity);
      if (filter.status) params.append('status', filter.status);

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/incidents?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (data.success) {
        setIncidents(data.incidents);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewIncident = (data) => {
      console.log('🆕 New incident:', data);
      fetchIncidents(); // Refresh list
    };

    const handleIncidentUpdate = (data) => {
      console.log('📝 Incident updated:', data);
      fetchIncidents(); // Refresh list
    };

    socket.on('incident:new', handleNewIncident);
    socket.on('incident:status_updated', handleIncidentUpdate);
    socket.on('incident:assigned', handleIncidentUpdate);

    return () => {
      if (socket && socket.off) {
        socket.off('incident:new', handleNewIncident);
        socket.off('incident:status_updated', handleIncidentUpdate);
        socket.off('incident:assigned', handleIncidentUpdate);
      }
    };
  }, [socket, fetchIncidents]);

  const getSeverityBadge = (severity) => {
    const configs = {
      critical: { bg: 'bg-red-600/20', text: 'text-red-400', border: 'border-red-500/40' },
      high: { bg: 'bg-orange-600/20', text: 'text-orange-400', border: 'border-orange-500/40' },
      medium: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', border: 'border-yellow-500/40' },
      low: { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-500/40' }
    };
    const config = configs[severity] || configs.low;
    return (
      <span className={`px-2 py-1 rounded text-xs font-['Orbitron'] font-bold tracking-wider border ${config.bg} ${config.text} ${config.border}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const configs = {
      open: { bg: 'bg-purple-600/20', text: 'text-purple-400', border: 'border-purple-500/40', label: 'OPEN' },
      in_progress: { bg: 'bg-cyan-600/20', text: 'text-cyan-400', border: 'border-cyan-500/40', label: 'IN PROGRESS' },
      mitigated: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', border: 'border-yellow-500/40', label: 'MITIGATED' },
      resolved: { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-500/40', label: 'RESOLVED' },
      closed: { bg: 'bg-gray-600/20', text: 'text-gray-400', border: 'border-gray-500/40', label: 'CLOSED' }
    };
    const config = configs[status] || configs.open;
    return (
      <span className={`px-2 py-1 rounded text-xs font-['Roboto_Mono'] border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Loading incidents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-['Orbitron'] font-bold text-red-400 tracking-wider">
            INCIDENT MANAGEMENT
          </h1>
          <p className="text-gray-400 text-sm">Enterprise Security Incident Tracking</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400 rounded-lg font-['Orbitron'] font-bold text-sm tracking-wider hover:bg-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
          >
            ← DASHBOARD
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-red-500/20 border-2 border-red-500 text-red-400 rounded-lg font-['Orbitron'] font-bold text-sm tracking-wider hover:bg-red-500/40 hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300"
          >
            + CREATE INCIDENT
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-5">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 font-['Orbitron']">SEVERITY:</label>
            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              className="bg-black/50 border border-white/10 rounded px-3 py-1 text-sm text-gray-300 focus:outline-none focus:border-red-500"
            >
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 font-['Orbitron']">STATUS:</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="bg-black/50 border border-white/10 rounded px-3 py-1 text-sm text-gray-300 focus:outline-none focus:border-red-500"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="mitigated">Mitigated</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="text-sm text-gray-500 ml-auto">
            {incidents.length} incidents
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500 rounded p-4 text-red-400">
          Error: {error}
        </div>
      )}

      {/* Incidents Table */}
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/50 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-['Orbitron'] font-bold text-cyan-400 tracking-wider">ID</th>
              <th className="px-6 py-4 text-left text-xs font-['Orbitron'] font-bold text-cyan-400 tracking-wider">TITLE</th>
              <th className="px-6 py-4 text-left text-xs font-['Orbitron'] font-bold text-cyan-400 tracking-wider">SEVERITY</th>
              <th className="px-6 py-4 text-left text-xs font-['Orbitron'] font-bold text-cyan-400 tracking-wider">STATUS</th>
              <th className="px-6 py-4 text-left text-xs font-['Orbitron'] font-bold text-cyan-400 tracking-wider">ASSIGNED TO</th>
              <th className="px-6 py-4 text-left text-xs font-['Orbitron'] font-bold text-cyan-400 tracking-wider">CREATED</th>
              <th className="px-6 py-4 text-left text-xs font-['Orbitron'] font-bold text-cyan-400 tracking-wider">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No incidents found
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr
                  key={incident._id}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => navigate(`/incidents/${incident._id}`)}
                >
                  <td className="px-6 py-5">
                    <span className="text-purple-400 font-['Roboto_Mono'] text-sm font-bold">
                      {incident.incident_id}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-gray-300 text-sm font-medium max-w-md truncate mb-1">
                      {incident.title}
                    </div>
                    <div className="text-gray-500 text-xs mt-1.5">
                      {incident.attack_type?.replace('_', ' ').toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {getSeverityBadge(incident.severity)}
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(incident.status)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm text-gray-300">
                      {incident.assigned_to?.fullName || (
                        <span className="text-gray-600 italic">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm text-gray-400 font-['Roboto_Mono']">
                      {formatDate(incident.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/incidents/${incident._id}`);
                      }}
                      className="px-3 py-1 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded text-xs font-['Orbitron'] hover:bg-cyan-500/30 transition-colors"
                    >
                      VIEW
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <CreateIncidentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newIncident) => {
            console.log('✅ Incident created:', newIncident);
            fetchIncidents();
          }}
        />
      )}
    </div>
  );
}
