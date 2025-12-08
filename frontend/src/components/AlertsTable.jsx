// frontend/src/components/AlertsTable.jsx
// Real-time alerts table with live updates

import { useEffect, useState, useCallback } from 'react';
import useSocket from '../hooks/useSocket';
import './AlertsTable.css';

export function AlertsTable() {
  const socket = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ severity: '' });
  const [selectedAlert, setSelectedAlert] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.severity) params.append('severity', filter.severity);

      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/alerts/recent?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (data.success) {
        setAlerts(data.alerts || []);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [filter.severity]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (newAlert) => {
      console.log('🚨 New alert:', newAlert);
      setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep last 50
    };

    socket.on('alert:new', handleNewAlert);
    return () => {
      if (socket && socket.off) {
        socket.off('alert:new', handleNewAlert);
      }
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleCriticalAlert = (criticalData) => {
      console.log('⚠️ CRITICAL ALERT:', criticalData);
      showCriticalBanner(criticalData);
    };

    socket.on('alert:critical', handleCriticalAlert);
    return () => {
      if (socket && socket.off) {
        socket.off('alert:critical', handleCriticalAlert);
      }
    };
  }, [socket]);

  const showCriticalBanner = (criticalData) => {
    // TODO: Implement toast notification
    console.warn(`🔴 CRITICAL: ${criticalData.count} critical alert(s) detected!`);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#eab308',
      low: '#84cc16'
    };
    return colors[severity?.toLowerCase()] || '#6b7280';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const updateAlertStatus = async (alertId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Update local state
        setAlerts(prev => prev.map(a =>
          a.alert_id === alertId ? { ...a, status: newStatus } : a
        ));
        setSelectedAlert(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating alert:', err);
    }
  };

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="alerts-table-container">
      <div className="table-header">
        <h2>🚨 Recent Alerts</h2>
        <div className="ws-status">
          {socket?.connected ? (
            <span className="status-badge connected">● Connected</span>
          ) : (
            <span className="status-badge disconnected">● Disconnected</span>
          )}
        </div>
      </div>

      <div className="filters">
        <select
          value={filter.severity}
          onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <button onClick={fetchAlerts} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="table-wrapper">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>Rule Name</th>
              <th>Severity</th>
              <th>Source IP</th>
              <th>Timestamp</th>
              <th>MITRE ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  {loading ? 'Loading alerts...' : 'No alerts found'}
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr
                  key={alert.alert_id || alert._id}
                  className="alert-row"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <td className="rule-name">{alert.rule_name}</td>
                  <td>
                    <span
                      className="severity-badge"
                      style={{ backgroundColor: getSeverityColor(alert.severity) }}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="source-ip">{alert.source_ip}</td>
                  <td className="timestamp">{formatTime(alert.timestamp)}</td>
                  <td className="mitre-id">{alert.mitre_id || '-'}</td>
                  <td className="status">{alert.status || 'open'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedAlert.rule_name}</h3>
              <button className="close-btn" onClick={() => setSelectedAlert(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="alert-detail">
                <label>Severity:</label>
                <span style={{ color: getSeverityColor(selectedAlert.severity) }}>
                  {selectedAlert.severity}
                </span>
              </div>

              <div className="alert-detail">
                <label>Source IP:</label>
                <span>{selectedAlert.source_ip}</span>
              </div>

              <div className="alert-detail">
                <label>Timestamp:</label>
                <span>{new Date(selectedAlert.timestamp).toLocaleString()}</span>
              </div>

              <div className="alert-detail">
                <label>MITRE ATT&CK ID:</label>
                <span>{selectedAlert.mitre_id || 'N/A'}</span>
              </div>

              {selectedAlert.evidence && (
                <div className="alert-detail">
                  <label>Evidence:</label>
                  <pre>{JSON.stringify(selectedAlert.evidence, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-status"
                onClick={() => updateAlertStatus(selectedAlert.alert_id, 'in-progress')}
              >
                In Progress
              </button>
              <button
                className="btn-status"
                onClick={() => updateAlertStatus(selectedAlert.alert_id, 'resolved')}
              >
                Resolved
              </button>
              <button
                className="btn-status btn-close"
                onClick={() => updateAlertStatus(selectedAlert.alert_id, 'closed')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-footer">
        <p>Total: {alerts.length} alerts</p>
      </div>
    </div>
  );
}

export default AlertsTable;
