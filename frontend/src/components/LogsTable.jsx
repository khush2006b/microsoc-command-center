// frontend/src/components/LogsTable.jsx
// Real-time logs table with live updates

import { useEffect, useState, useCallback } from 'react';
import useSocket from '../hooks/useSocket';
import './LogsTable.css';

export function LogsTable() {
  const socket = useSocket();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ severity: '', attackType: '' });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.severity) params.append('severity', filter.severity);
      if (filter.attackType) params.append('event_type', filter.attackType);

      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/logs/recent?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filter.severity, filter.attackType]);

  // Fetch on mount and filter change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!socket) {
      console.log('⚠️ Socket not available in LogsTable');
      return;
    }

    console.log('✅ LogsTable: Setting up log:new listener');

    const handleNewLog = (newLog) => {
      console.log('📥 LogsTable: New log received:', newLog);
      setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100
    };

    socket.on('log:new', handleNewLog);
    
    return () => {
      console.log('🧹 LogsTable: Cleaning up log:new listener');
      if (socket && socket.off) {
        socket.off('log:new', handleNewLog);
      }
    };
  }, [socket]);

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

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="logs-table-container">
      <div className="table-header">
        <h2>📝 Recent Logs</h2>
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

        <select
          value={filter.attackType}
          onChange={(e) => setFilter({ ...filter, attackType: e.target.value })}
        >
          <option value="">All Attack Types</option>
          <option value="brute_force">Brute Force</option>
          <option value="port_scan">Port Scan</option>
          <option value="sql_injection">SQL Injection</option>
          <option value="xss">XSS</option>
          <option value="file_download">File Download</option>
        </select>

        <button onClick={fetchLogs} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Attack Type</th>
              <th>Source IP</th>
              <th>Target</th>
              <th>Severity</th>
              <th>Alert</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  {loading ? 'Loading logs...' : 'No logs found'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.log_id || log._id} className="log-row">
                  <td className="timestamp">{formatTime(log.timestamp)}</td>
                  <td className="attack-type">{log.event_type || log.attack_type}</td>
                  <td className="source-ip">{log.source_ip}</td>
                  <td className="target">{log.target_system}</td>
                  <td>
                    <span
                      className="severity-badge"
                      style={{ backgroundColor: getSeverityColor(log.severity) }}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="alert-status">
                    {log.alert_generated ? (
                      <span className="alert-badge">🚨 Alert</span>
                    ) : (
                      <span className="no-alert">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p>Total: {logs.length} logs</p>
      </div>
    </div>
  );
}

export default LogsTable;
