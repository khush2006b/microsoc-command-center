// frontend/src/components/incidents/IncidentDetails.jsx
// Enterprise Incident Details View with Tabs

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AIRemediation from './AIRemediation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [analysts, setAnalysts] = useState([]);
  const [selectedAnalyst, setSelectedAnalyst] = useState('');

  const fetchIncident = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/incidents/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (data.success) {
        setIncident(data.incident);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching incident:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  // Fetch analysts for assignment (admin only)
  useEffect(() => {
    const fetchAnalysts = async () => {
      if (user?.role !== 'admin') return;
      
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/admin/users?role=analyst&status=active`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        
        if (data.success) {
          setAnalysts(data.users || []);
        }
      } catch (err) {
        console.error('Error fetching analysts:', err);
      }
    };

    fetchAnalysts();
  }, [user]);

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/incidents/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (data.success) {
        setIncident(data.incident);
        alert('Status updated successfully');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/incidents/${id}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: newComment })
      });
      const data = await res.json();

      if (data.success) {
        setIncident(data.incident);
        setNewComment('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignIncident = async () => {
    if (!selectedAnalyst) {
      alert('Please select an analyst');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/incidents/${id}/assign`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assigned_to: selectedAnalyst })
      });
      const data = await res.json();

      if (data.success) {
        setIncident(data.incident);
        setSelectedAnalyst('');
        alert('Incident assigned successfully');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Loading incident...</div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="bg-red-500/20 border border-red-500 rounded p-4 text-red-400">
          Error: {error || 'Incident not found'}
        </div>
        <button
          onClick={() => navigate('/incidents')}
          className="mt-4 px-4 py-2 bg-gray-600/20 border border-gray-500 text-gray-400 rounded"
        >
          Back to Incidents
        </button>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'text-red-400',
      high: 'text-orange-400',
      medium: 'text-yellow-400',
      low: 'text-blue-400'
    };
    return colors[severity] || colors.low;
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'text-purple-400',
      in_progress: 'text-cyan-400',
      mitigated: 'text-yellow-400',
      resolved: 'text-green-400',
      closed: 'text-gray-400'
    };
    return colors[status] || colors.open;
  };

  const getActionColor = (action) => {
    const colors = {
      created: 'text-green-400',
      assigned: 'text-cyan-400',
      status_changed: 'text-yellow-400',
      comment_added: 'text-blue-400',
      evidence_added: 'text-purple-400',
      auto_generated: 'text-red-400'
    };
    return colors[action] || 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/incidents')}
          className="mb-4 text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2"
        >
          ← Back to Incidents
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-purple-400 font-['Roboto_Mono'] text-lg font-bold">
                {incident.incident_id}
              </span>
              <span className={`text-2xl font-bold ${getSeverityColor(incident.severity)}`}>
                {incident.severity.toUpperCase()}
              </span>
              <span className={`text-lg ${getStatusColor(incident.status)}`}>
                {incident.status.replace('_', ' ').toUpperCase()}
              </span>
              {incident.metadata?.creation_type && (
                <span className={`text-sm px-2 py-1 rounded ${
                  incident.metadata.creation_type === 'auto' 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                }`}>
                  {incident.metadata.creation_type === 'auto' ? '🤖 AUTO' : '👤 MANUAL'}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-['Orbitron'] font-bold text-white mb-2">
              {incident.title}
            </h1>
            <p className="text-gray-400 text-sm">
              Created by {incident.created_by?.fullName || 'System'} on{' '}
              {new Date(incident.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-white/10">
        <div className="flex gap-1">
          {['summary', 'remediation', 'timeline', 'comments', 'actions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-['Orbitron'] font-bold tracking-wider transition-colors ${
                activeTab === tab
                  ? 'text-red-400 border-b-2 border-red-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-['Orbitron'] text-cyan-400 mb-2">DESCRIPTION</h3>
              <p className="text-gray-300">{incident.description || 'No description provided'}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-['Orbitron'] text-cyan-400 mb-2">ATTACK TYPE</h3>
                <p className="text-gray-300">{incident.attack_type?.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div>
                <h3 className="text-sm font-['Orbitron'] text-cyan-400 mb-2">ASSIGNED TO</h3>
                <p className="text-gray-300">{incident.assigned_to?.fullName || 'Unassigned'}</p>
              </div>
            </div>

            {incident.metadata && (
              <div>
                <h3 className="text-sm font-['Orbitron'] text-cyan-400 mb-2">METADATA</h3>
                <div className="bg-black/40 rounded p-3 space-y-2 text-sm">
                  {incident.metadata.src_ip && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Source IP:</span>
                      <span className="text-gray-300 font-['Roboto_Mono']">{incident.metadata.src_ip}</span>
                    </div>
                  )}
                  {incident.metadata.dest_system && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dest System:</span>
                      <span className="text-gray-300">{incident.metadata.dest_system}</span>
                    </div>
                  )}
                  {incident.metadata.geo && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="text-gray-300">
                        {incident.metadata.geo.city}, {incident.metadata.geo.country}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-['Orbitron'] text-cyan-400 mb-2">LINKED ALERTS ({incident.related_alert_ids?.length || 0})</h3>
              <div className="text-gray-500 text-sm">
                {incident.related_alert_ids?.length > 0 ? 'Alert details will be shown here' : 'No alerts linked'}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-['Orbitron'] text-cyan-400 mb-2">LINKED LOGS ({incident.related_logs?.length || 0})</h3>
              <div className="text-gray-500 text-sm">
                {incident.related_logs?.length > 0 ? 'Log details will be shown here' : 'No logs linked'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'remediation' && (
          <div>
            <h3 className="text-lg font-['Orbitron'] text-cyan-400 mb-6">AI-POWERED REMEDIATION</h3>
            <AIRemediation incidentId={id} />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <h3 className="text-lg font-['Orbitron'] text-cyan-400 mb-4">FORENSIC TIMELINE</h3>
            {incident.timeline && incident.timeline.length > 0 ? (
              <div className="space-y-3">
                {[...incident.timeline].reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="border-l-2 border-cyan-500/30 pl-4 py-2 hover:border-cyan-500 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold font-['Orbitron'] ${getActionColor(entry.action)}`}>
                        {entry.action.toUpperCase().replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500 font-['Roboto_Mono']">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{entry.message}</p>
                    {entry.updated_by && (
                      <p className="text-xs text-gray-600 mt-1">
                        by {entry.updated_by.fullName || 'System'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No timeline entries</p>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-6">
            <h3 className="text-lg font-['Orbitron'] text-cyan-400 mb-4">DISCUSSION THREAD</h3>
            
            {/* Comment Form */}
            {user && (user.role === 'analyst' || user.role === 'admin') && (
              <form onSubmit={handleAddComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-black/50 border border-white/10 rounded p-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500 min-h-24"
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="mt-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded font-['Orbitron'] hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'POSTING...' : 'POST COMMENT'}
                </button>
              </form>
            )}

            {/* Comments List */}
            {incident.comments && incident.comments.length > 0 ? (
              <div className="space-y-4">
                {[...incident.comments].reverse().map((comment, idx) => (
                  <div key={idx} className="bg-black/40 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-cyan-400">
                        {comment.user?.fullName || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {comment.user?.role && `[${comment.user.role}]`}
                      </span>
                      <span className="text-xs text-gray-600 ml-auto font-['Roboto_Mono']">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{comment.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No comments yet</p>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-6">
            <h3 className="text-lg font-['Orbitron'] text-cyan-400 mb-4">INCIDENT ACTIONS</h3>
            
            {/* Assign Incident (Admin Only) */}
            {user && user.role === 'admin' && (
              <div>
                <h4 className="text-sm font-['Orbitron'] text-white mb-2">ASSIGN INCIDENT</h4>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">
                      Currently Assigned: {incident.assigned_to?.fullName || 'Unassigned'}
                    </label>
                    <select
                      value={selectedAnalyst}
                      onChange={(e) => setSelectedAnalyst(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded p-2 text-gray-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Select Analyst --</option>
                      {analysts.map((analyst) => (
                        <option key={analyst._id} value={analyst._id}>
                          {analyst.fullName} ({analyst.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAssignIncident}
                    disabled={!selectedAnalyst}
                    className="px-4 py-2 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded font-['Orbitron'] hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ASSIGN
                  </button>
                </div>
              </div>
            )}
            
            {/* Status Change */}
            {user && (user.role === 'analyst' || user.role === 'admin') && (
              <div>
                <h4 className="text-sm font-['Orbitron'] text-white mb-2">CHANGE STATUS</h4>
                <div className="flex gap-2 flex-wrap">
                  {['open', 'in_progress', 'mitigated', 'resolved', 'closed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={incident.status === status}
                      className={`px-3 py-2 rounded text-xs font-['Orbitron'] font-bold border transition-colors ${
                        incident.status === status
                          ? 'bg-gray-600/20 border-gray-500 text-gray-600 cursor-not-allowed'
                          : 'bg-cyan-500/20 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30'
                      }`}
                    >
                      {status.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
                {user.role === 'analyst' && (
                  <p className="text-xs text-gray-600 mt-2">
                    * Analysts can only follow workflow: OPEN → IN_PROGRESS → MITIGATED → RESOLVED
                  </p>
                )}
              </div>
            )}

            {/* Additional Actions */}
            <div>
              <h4 className="text-sm font-['Orbitron'] text-white mb-2">OTHER ACTIONS</h4>
              <p className="text-gray-500 text-sm">Additional incident actions will be available here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
