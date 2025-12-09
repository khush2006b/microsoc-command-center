/**
 * Ranger Command Center - Futuristic Logs Display
 * Clean 2-column grid with holographic elements
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { NeonButton } from '../ui/NeonButton';
import { FuturisticDropdown } from '../ui/FuturisticDropdown';

// Compact Holographic Log Row Component
const CompactLogRow = ({ log, isNew = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setShowNewBadge(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // Defensive check - don't render if log is invalid
  if (!log || (!log._id && !log.id && !log.log_id)) {
    return null;
  }

  // Severity configuration with neon accent colors
  const getSeverityConfig = (severity) => {
    const level = severity?.toLowerCase() || 'low';
    const configs = {
      critical: { 
        bg: 'bg-red-600/15', 
        border: 'border-red-500/40', 
        text: 'text-red-400',
        glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
        label: 'CRIT'
      },
      high: { 
        bg: 'bg-orange-600/15', 
        border: 'border-orange-500/40', 
        text: 'text-orange-400',
        glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]',
        label: 'HIGH'
      },
      medium: { 
        bg: 'bg-yellow-600/15', 
        border: 'border-yellow-500/40', 
        text: 'text-yellow-400',
        glow: 'shadow-[0_0_12px_rgba(234,179,8,0.3)]',
        label: 'MED'
      },
      low: { 
        bg: 'bg-blue-600/15', 
        border: 'border-blue-500/40', 
        text: 'text-blue-400',
        glow: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]',
        label: 'LOW'
      },
    };
    return configs[level] || configs.low;
  };

  const config = getSeverityConfig(log.severity);
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="group w-full">
      {/* Compact Log Row - Clean with bottom border */}
      <div 
        className={`
          relative
          bg-black/10 backdrop-blur-sm
          px-3 py-3
          transition-all duration-300
          cursor-pointer
          hover:bg-black/20
          border-b border-white/5
          ${showNewBadge ? 'animate-pulse-soft' : ''}
        `}
        onClick={() => setExpanded(!expanded)}
        style={{
          borderLeftWidth: '2px',
          borderLeftColor: config.border,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          {/* LEFT: Severity + Attack Type */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.bg} ${config.text} font-bold tracking-wider font-['Orbitron']`}>
              {config.label}
            </span>
            
            <span className="text-xs text-gray-300 font-['Roboto_Mono'] truncate">
              {log.event_type?.toUpperCase() || 'UNKNOWN'}
            </span>

            {showNewBadge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 animate-pulse font-bold">
                NEW
              </span>
            )}
          </div>

          {/* MIDDLE: IP + Time */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-cyan-400 font-['Roboto_Mono']">{log.source_ip}</span>
            <span className="text-gray-500 font-['Roboto_Mono'] text-[10px]">{formatTime(log.timestamp)}</span>
          </div>

          {/* RIGHT: Chevron Icon */}
          <svg 
            className={`w-4 h-4 shrink-0 ${config.text} transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            fill="none" 
            strokeWidth="2" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ minWidth: '16px', maxWidth: '16px', minHeight: '16px', maxHeight: '16px' }}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expandable Metadata Panel - Clean Style */}
      {expanded && (
        <div className="bg-black/20 border-b border-white/5 px-3 pb-3 pt-2 animate-slide-down" 
          style={{
            borderLeftWidth: '2px',
            borderLeftColor: config.border,
          }}
        >
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            {/* Target + Metadata */}
            <div className="space-y-1.5">
              <div className="text-cyan-400 font-semibold font-['Orbitron'] text-[10px] tracking-wider">TARGET</div>
              <div className="text-gray-300 font-['Roboto_Mono']">{log.target_system || 'N/A'}</div>
              
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <>
                  <div className="text-cyan-400 font-semibold font-['Orbitron'] text-[10px] tracking-wider mt-2">DATA</div>
                  <div className="space-y-0.5">
                    {Object.entries(log.metadata).slice(0, 3).map(([key, val]) => (
                      <div key={key} className="flex gap-2 text-[10px]">
                        <span className="text-gray-500">{key}:</span>
                        <span className="text-gray-400 font-['Roboto_Mono'] truncate">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Status + Rule */}
            <div className="space-y-1.5">
              <div className="text-cyan-400 font-semibold font-['Orbitron'] text-[10px] tracking-wider">STATUS</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={log.processed ? 'text-green-400' : 'text-yellow-400'}>
                    {log.processed ? '✓' : '⏳'}
                  </span>
                  <span className="text-gray-400">{log.processed ? 'Processed' : 'Pending'}</span>
                </div>
                {log.alert_generated && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-red-400">⚠</span>
                    <span className="text-red-400">Alert Generated</span>
                  </div>
                )}
                {log.rule_name && (
                  <div className="mt-2">
                    <div className="text-cyan-400 font-semibold font-['Orbitron'] text-[10px] tracking-wider">RULE</div>
                    <div className="text-purple-400 font-['Roboto_Mono'] text-[10px] mt-0.5">{log.rule_name}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Last Updated Timestamp Component
const LastUpdated = ({ timestamp }) => {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - timestamp) / 1000);
      setSecondsAgo(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <div className="text-xs text-gray-500 flex items-center gap-2">
      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      Last updated {secondsAgo}s ago
    </div>
  );
};

export function RangerLogsTable() {
  const socket = useSocket();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ severity: '', attackType: '' });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Debug: Log socket status
  useEffect(() => {
    console.log('🔌 RangerLogsTable - Socket status:', socket ? 'Connected' : 'Not connected');
    if (socket) {
      console.log('🔌 Socket object:', socket);
      console.log('🔌 Socket connected:', socket.connected);
    }
  }, [socket]);

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
        // Accept all valid logs with any type of ID
        const validLogs = data.logs.filter(log => log && (log._id || log.id || log.log_id));
        // Normalize IDs
        const normalizedLogs = validLogs.map(log => ({
          ...log,
          _id: log._id || log.id || log.log_id
        }));
        setLogs(normalizedLogs);
        setLastUpdate(Date.now());
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

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Listen for new logs via WebSocket
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ No socket connection for logs');
      return;
    }

    console.log('✅ Setting up log:new listener');

    const handleNewLog = (newLog) => {
      console.log('📥 Received new log:', newLog);
      // Accept logs with _id, id, or log_id
      if (newLog && (newLog._id || newLog.id || newLog.log_id)) {
        console.log('✅ Adding valid log to state');
        setLogs((prev) => [{ ...newLog, _id: newLog._id || newLog.id || newLog.log_id, isNew: true }, ...prev].slice(0, 100));
        setLastUpdate(Date.now());
      } else {
        console.warn('⚠️ Invalid log received (missing ID):', newLog);
      }
    };

    socket.on('log:new', handleNewLog);
    
    return () => {
      console.log('🧹 Cleaning up log:new listener');
      if (socket && socket.off) {
        socket.off('log:new', handleNewLog);
      }
    };
  }, [socket]);

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          Loading logs...
        </div>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="text-center py-8 text-red-400 flex items-center justify-center gap-2">
        <span>⚠️</span>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header with Filters and Last Updated */}
      <div className="flex flex-col gap-3 pb-3 border-b border-cyan-500/20 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-['Roboto_Mono'] text-cyan-400 tracking-wider">LIVE LOG STREAM</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">CONNECTED • {logs.length} logs</span>
          </div>
          <LastUpdated timestamp={lastUpdate} />
        </div>

        <div className="flex items-center gap-3">
          <FuturisticDropdown
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
            options={[
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' }
            ]}
            placeholder="All Severities"
          />

          <FuturisticDropdown
            value={filter.attackType}
            onChange={(e) => setFilter({ ...filter, attackType: e.target.value })}
            options={[
              { value: 'brute_force', label: 'Brute Force' },
              { value: 'port_scan', label: 'Port Scan' },
              { value: 'sql_injection', label: 'SQL Injection' },
              { value: 'xss', label: 'XSS' },
              { value: 'file_download', label: 'File Download' }
            ]}
            placeholder="All Types"
          />

          <NeonButton
            onClick={fetchLogs}
            variant="primary"
            size="sm"
          >
            🔄 REFRESH
          </NeonButton>
        </div>
      </div>

      {/* 2-Column Responsive Log Grid */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-3 opacity-40">📭</div>
            <div className="text-sm font-['Exo_2']">No logs detected</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pr-2">
            {logs.map((log, idx) => (
              <CompactLogRow key={log._id || log.id || log.log_id || idx} log={log} isNew={log.isNew} />
            ))}
          </div>
        )}
      </div>

      {/* Log Count Footer */}
      <div className="pt-3 border-t border-cyan-500/20 text-xs flex items-center justify-between shrink-0">
        <span className="text-gray-400 font-['Roboto_Mono']">
          {logs.length} LOG{logs.length !== 1 ? 'S' : ''} ACTIVE
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
          <span className="text-green-400 font-['Exo_2'] text-[11px] tracking-wide">LIVE MONITORING</span>
        </span>
      </div>
    </div>
  );
}

// Add custom CSS animations
if (typeof document !== 'undefined' && !document.getElementById('ranger-logs-styles')) {
  const style = document.createElement('style');
  style.id = 'ranger-logs-styles';
  style.textContent = `
    @keyframes pulse-soft {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    @keyframes slide-down {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-pulse-soft {
      animation: pulse-soft 2s ease-in-out;
    }
    
    .animate-slide-down {
      animation: slide-down 0.2s ease-out;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 26, 26, 0.3);
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 26, 26, 0.5);
    }
  `;
  document.head.appendChild(style);
}

export default RangerLogsTable;
