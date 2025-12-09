import React, { useEffect, useState, useCallback } from 'react';
import { SeverityBadge, HologramCard, TechTag } from '../theme/ThemeComponents';
import { rangerColors, rangerShadows } from '../../theme/rangerTheme';
import { useSocket } from '../../hooks/useSocket';
import { API_BASE_URL } from '../../config/api';

const AlertCard = ({ alert, isNew = false }) => {
  const [shake, setShake] = useState(isNew && alert.severity?.toLowerCase() === 'critical');

  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(timer);
    }
  }, [shake, isNew]);

  const getSeverityConfig = (severity) => {
    const level = severity?.toLowerCase() || 'medium';
    const configs = {
      critical: { 
        bg: 'rgba(239, 68, 68, 0.08)',
        border: '#ef4444',
        text: '#fca5a5',
        icon: '🚨',
        glow: '0 0 15px rgba(239, 68, 68, 0.3)',
        pulse: true
      },
      high: { 
        bg: 'rgba(249, 115, 22, 0.08)',
        border: '#f97316',
        text: '#fdba74',
        icon: '⚠️',
        glow: '0 0 12px rgba(249, 115, 22, 0.2)',
        pulse: false
      },
      medium: { 
        bg: 'rgba(234, 179, 8, 0.08)',
        border: '#eab308',
        text: '#fde047',
        icon: '⚡',
        glow: '0 0 10px rgba(234, 179, 8, 0.15)',
        pulse: false
      },
      low: { 
        bg: 'rgba(59, 130, 246, 0.08)',
        border: '#3b82f6',
        text: '#93c5fd',
        icon: 'ℹ️',
        glow: '0 0 8px rgba(59, 130, 246, 0.1)',
        pulse: false
      },
    };
    return configs[level] || configs.medium;
  };

  const config = getSeverityConfig(alert.severity);

  return (
    <div
      className={`
        relative group
        bg-black/40 backdrop-blur-md
        border rounded-lg
        p-4
        transition-all duration-300
        hover:scale-[1.02]
        ${shake ? 'animate-shake' : ''}
        ${isNew ? 'animate-slide-in-top' : ''}
      `}
      style={{
        borderColor: config.border,
        borderWidth: '1px',
        borderLeftWidth: '3px',
        boxShadow: `${config.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Corner Accents */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r opacity-40" style={{ borderColor: config.border }} />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l opacity-40" style={{ borderColor: config.border }} />

      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{config.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-['Orbitron'] font-bold tracking-wide" style={{ color: config.text }}>
                {alert.rule_name || 'SECURITY ALERT'}
              </span>
              {isNew && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-['Roboto_Mono'] animate-pulse"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                  }}
                >
                  NEW
                </span>
              )}
            </div>
            <div className="text-[10px] font-['Roboto_Mono'] text-gray-500 uppercase tracking-wider mt-1">
              {alert.event_type || alert.attack_type || 'Unknown Event'}
            </div>
          </div>
        </div>

        {/* Severity Badge */}
        <div
          className="shrink-0 px-3 py-1 rounded font-['Orbitron'] font-bold text-xs uppercase tracking-wider"
          style={{
            background: config.bg,
            border: `1px solid ${config.border}`,
            color: config.text,
            boxShadow: config.glow,
          }}
        >
          {alert.severity || 'MED'}
          {config.pulse && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 ml-2 animate-pulse" 
              style={{ boxShadow: '0 0 6px #ef4444' }}
            />
          )}
        </div>
      </div>

      {/* Alert Message */}
      {alert.message && (
        <p className="text-sm text-gray-300 mb-3 leading-relaxed border-l-2 pl-3 py-1" style={{ borderColor: config.border + '40' }}>
          {alert.message}
        </p>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-black/30 rounded p-2 border border-white/5">
          <div className="text-[10px] font-['Orbitron'] text-gray-500 uppercase tracking-wider mb-1">Source IP</div>
          <div className="font-['Roboto_Mono'] text-sm text-cyan-400 font-medium">
            {alert.source_ip || 'N/A'}
          </div>
        </div>
        <div className="bg-black/30 rounded p-2 border border-white/5">
          <div className="text-[10px] font-['Orbitron'] text-gray-500 uppercase tracking-wider mb-1">Timestamp</div>
          <div className="font-['Roboto_Mono'] text-xs text-gray-300">
            {alert.created_at || alert.timestamp 
              ? new Date(alert.created_at || alert.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {(alert.target_system || alert.threat_score) && (
        <div className="flex items-center justify-between text-xs mb-3 pt-2 border-t border-white/5">
          {alert.target_system && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Target:</span>
              <span className="font-['Roboto_Mono'] text-purple-400">{alert.target_system}</span>
            </div>
          )}
          {alert.threat_score && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Threat Score:</span>
              <span 
                className="font-['Orbitron'] font-bold px-2 py-0.5 rounded"
                style={{
                  background: config.bg,
                  color: config.text,
                }}
              >
                {Math.round(alert.threat_score)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* MITRE Tags */}
      {alert.mitre_tags && alert.mitre_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {alert.mitre_tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2 py-1 rounded font-['Roboto_Mono'] bg-purple-500/10 border border-purple-500/30 text-purple-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Status Indicator */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full" 
        style={{
          background: config.border,
          boxShadow: config.glow,
          animation: config.pulse ? 'pulse 2s ease-in-out infinite' : 'none'
        }}
      />
    </div>
  );
};

export function RangerAlertsPanel({ initialAlerts = [] }) {
  const socket = useSocket();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // Update alerts when initialAlerts prop changes
  useEffect(() => {
    if (initialAlerts.length > 0) {
      setAlerts(initialAlerts);
      setLoading(false);
    }
  }, [initialAlerts]);

  const fetchAlerts = useCallback(async () => {
    // Only fetch if we don't have initialAlerts
    if (initialAlerts.length > 0) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/alerts/recent?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [initialAlerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Listen for new alerts via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (alert) => {
      setAlerts((prev) => [{ ...alert, isNew: true }, ...prev].slice(0, 20));
    };

    const handleCriticalAlert = (alert) => {
      setAlerts((prev) => [{ ...alert, isNew: true, isCritical: true }, ...prev].slice(0, 20));
      // Trigger flash animation
      document.body.style.animation = 'screen-flash 0.3s ease-out';
      setTimeout(() => {
        document.body.style.animation = '';
      }, 300);
    };

    socket.on('alert:new', handleNewAlert);
    socket.on('alert:critical', handleCriticalAlert);

    return () => {
      if (socket && socket.off) {
        socket.off('alert:new', handleNewAlert);
        socket.off('alert:critical', handleCriticalAlert);
      }
    };
  }, [socket]);

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter((a) => a.severity?.toLowerCase() === filter);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header with Filter Buttons */}
      <div className="shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-['Roboto_Mono'] text-red-400 tracking-wider">ACTIVE ALERTS</span>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {socket?.connected ? (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span>LIVE</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  <span>OFFLINE</span>
                </>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-400 font-['Roboto_Mono']">{filteredAlerts.length} ACTIVE</span>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'critical', 'high', 'medium'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2 py-1 text-xs rounded-md font-['Orbitron'] font-bold transition-all"
              style={{
                background: filter === f ? rangerColors.rangerRed : 'rgba(212, 0, 0, 0.1)',
                border: `1px solid ${filter === f ? rangerColors.morphinNeonRed : rangerColors.rangerRed}`,
                color: filter === f ? rangerColors.neonWhite : rangerColors.rangerRed,
                boxShadow: filter === f ? rangerShadows.glowRed : 'none',
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto">
        {loading && alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm opacity-60">
            ⟳ Loading alerts...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm opacity-60">
            ✓ No alerts
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => (
            <AlertCard key={`${alert._id}-${idx}`} alert={alert} isNew={alert.isNew} />
          ))
        )}
      </div>
    </div>
  );
}

export default RangerAlertsPanel;
