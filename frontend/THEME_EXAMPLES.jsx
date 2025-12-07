/**
 * Power Rangers Theme - Example Usage Patterns
 * Copy-paste ready code snippets for common use cases
 */

// Consolidated imports
import React, { useState, useEffect } from 'react';
import { 
  StatCard, 
  HologramCard, 
  AlertBanner, 
  GlowButton, 
  SeverityBadge,
  SeverityIndicator,
  StatusDot,
  TechDivider,
  TechTag
} from './components/theme/ThemeComponents';
import { rangerColors } from './src/theme/rangerTheme';
import useSocket from './hooks/useSocket';

// ============================================
// EXAMPLE 1: Simple Dashboard with Stats
// ============================================

export function StatsView() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Events"
          value="2,847"
          unit="logs"
          trend={12}
          color="red"
          icon="📊"
        />
        <StatCard
          label="Critical Alerts"
          value="23"
          unit="active"
          trend={-5}
          color="red"
          icon="🚨"
          animated={true}
        />
        <StatCard
          label="Threats Blocked"
          value="156"
          unit="today"
          trend={8}
          color="orange"
          icon="🛡️"
        />
        <StatCard
          label="System Health"
          value="98.5%"
          unit="uptime"
          color="blue"
          icon="💚"
        />
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Alert Management Interface
// ============================================

export function AlertManagement() {
  const [alerts, setAlerts] = useState([
    { id: 1, title: 'Brute Force Attack', severity: 'critical', dismissed: false },
    { id: 2, title: 'Port Scanning Detected', severity: 'high', dismissed: false },
    { id: 3, title: 'Unusual Login Pattern', severity: 'medium', dismissed: false },
  ]);

  const handleDismiss = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  return (
    <div className="p-6 space-y-4">
      {alerts.filter(a => !a.dismissed).map(alert => (
        <AlertBanner
          key={alert.id}
          severity={alert.severity}
          title={alert.title}
          icon={alert.severity === 'critical' ? '🚨' : '⚠️'}
          animated
          onClose={() => handleDismiss(alert.id)}
        />
      ))}
    </div>
  );
}

// ============================================
// EXAMPLE 3: Real-Time Log Stream
// ============================================

export function LogStream() {
  const socket = useSocket();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleNewLog = (log) => {
      setLogs(prev => [log, ...prev].slice(0, 50));
    };

    socket.on('log:new', handleNewLog);
    return () => socket.off('log:new', handleNewLog);
  }, [socket]);

  return (
    <HologramCard title="📝 Live Log Stream" glow="red" className="h-96">
      <div className="space-y-2 overflow-y-auto max-h-80">
        {logs.map((log, idx) => (
          <div key={idx} className="flex items-start gap-2 p-2 rounded hover:bg-gray-700 transition">
            <SeverityIndicator severity={log.severity} animated />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{log.event_type}</span>
                <SeverityBadge severity={log.severity} />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {log.source_ip} → {log.target_system}
              </div>
            </div>
          </div>
        ))}
      </div>
    </HologramCard>
  );
}

// ============================================
// EXAMPLE 4: Custom Button Group
// ============================================

export function ActionBar() {
  return (
    <div className="flex gap-2 p-4">
      <GlowButton variant="primary" size="md" onClick={() => console.log('Scan')}>
        🔍 Start Scan
      </GlowButton>
      <GlowButton variant="primary" size="md" onClick={() => console.log('Quarantine')}>
        🔒 Quarantine
      </GlowButton>
      <GlowButton variant="secondary" size="sm" onClick={() => console.log('More')}>
        ⋯ More Options
      </GlowButton>
    </div>
  );
}

// ============================================
// EXAMPLE 5: Status Dashboard
// ============================================

export function SystemStatus() {
  const systems = [
    { name: 'Backend API', status: 'active' },
    { name: 'Database', status: 'active' },
    { name: 'WebSocket', status: 'active' },
    { name: 'Cache Layer', status: 'active' },
    { name: 'Threat Detection', status: 'critical' },
  ];

  return (
    <HologramCard title="⚙️ System Status" glow="blue">
      <div className="space-y-3">
        {systems.map((sys, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">{sys.name}</span>
              <StatusDot status={sys.status} />
            </div>
            {idx < systems.length - 1 && <TechDivider color="blue" />}
          </div>
        ))}
      </div>
    </HologramCard>
  );
}

// ============================================
// EXAMPLE 6: MITRE ATT&CK Tags
// ============================================

export function ThreatIntelligence() {
  const techniques = [
    'T1046 - Network Service Scanning',
    'T1078 - Valid Accounts',
    'T1021 - Remote Services',
    'T1547 - Boot or Logon Autostart Execution',
  ];

  return (
    <HologramCard title="🎯 MITRE ATT&CK Techniques" glow="orange">
      <div className="flex flex-wrap gap-2">
        {techniques.map((tech, idx) => (
          <TechTag key={idx} variant="mitre">
            {tech}
          </TechTag>
        ))}
      </div>
    </HologramCard>
  );
}

// ============================================
// EXAMPLE 7: Timeline View
// ============================================

export function IncidentTimeline() {
  const events = [
    { time: '14:23:45', event: 'Critical alert detected', severity: 'critical' },
    { time: '14:18:12', event: 'Port scan detected', severity: 'high' },
    { time: '14:15:33', event: 'Failed login attempt', severity: 'medium' },
    { time: '14:10:22', event: 'File accessed', severity: 'high' },
    { time: '14:05:10', event: 'System check', severity: 'low' },
  ];

  return (
    <HologramCard title="⏱️ Incident Timeline" glow="red">
      <div className="space-y-3">
        {events.map((item, idx) => (
          <div key={idx} className="flex gap-4 pb-3 border-b border-gray-700 last:border-b-0">
            <div className="text-xs font-mono text-gray-500 whitespace-nowrap">
              {item.time}
            </div>
            <div className="flex-1">
              <div className="text-sm">{item.event}</div>
              <div className="text-xs text-gray-500 mt-1">{item.severity}</div>
            </div>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 mt-1 animate-glow-pulse"
              style={{
                background: item.severity === 'critical' ? rangerColors.morphinNeonRed : rangerColors.rangerRed,
              }}
            />
          </div>
        ))}
      </div>
    </HologramCard>
  );
}

// ============================================
// EXAMPLE 8: Data Table with Severity Coloring
// ============================================

export function IncidentsTable() {
  const incidents = [
    { id: 1, name: 'Brute Force Attack', severity: 'critical', status: 'open', date: '2025-12-06' },
    { id: 2, name: 'Unauthorized Access', severity: 'high', status: 'in-progress', date: '2025-12-05' },
    { id: 3, name: 'Suspicious Login', severity: 'medium', status: 'resolved', date: '2025-12-04' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-700 font-header">
          <tr>
            <th className="text-left p-3">Incident</th>
            <th className="text-left p-3">Severity</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map(inc => (
            <tr key={inc.id} className="border-b border-gray-700 hover:bg-gray-800 transition">
              <td className="p-3 flex items-center gap-2">
                <SeverityIndicator severity={inc.severity} />
                {inc.name}
              </td>
              <td className="p-3">
                <SeverityBadge severity={inc.severity} />
              </td>
              <td className="p-3">
                <span className="px-2 py-1 rounded text-xs font-mono bg-gray-700">
                  {inc.status}
                </span>
              </td>
              <td className="p-3 text-gray-400">{inc.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// EXAMPLE 9: Custom Modal/Dialog
// ============================================

export function IncidentDetailsModal({ incident, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <HologramCard
        title={incident.name}
        glow="red"
        className="max-w-2xl w-full mx-4 animate-hologram"
      >
        <div className="space-y-4 mb-4">
          <div>
            <label className="text-xs opacity-70 uppercase">Severity</label>
            <div className="mt-2">
              <span className="text-xl">{incident.severity}</span>
            </div>
          </div>

          <div>
            <label className="text-xs opacity-70 uppercase">Description</label>
            <p className="mt-2 text-sm">{incident.description}</p>
          </div>

          <div>
            <label className="text-xs opacity-70 uppercase">Timeline</label>
            <div className="mt-2 text-sm font-mono">
              <div>Started: {incident.started}</div>
              <div>Updated: {incident.updated}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <GlowButton variant="secondary" size="sm" onClick={onClose}>
            Close
          </GlowButton>
          <GlowButton variant="primary" size="sm">
            Take Action
          </GlowButton>
        </div>
      </HologramCard>
    </div>
  );
}

// ============================================
// EXAMPLE 10: Complete Settings Panel
// ============================================

export function SettingsPanel() {
  const [settings, setSettings] = useState({
    alerts: true,
    notifications: true,
    darkMode: true,
    autoScan: false,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <HologramCard title="⚙️ Settings" glow="blue" className="max-w-md">
      <div className="space-y-4">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm capitalize font-header">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <button
                onClick={() => handleToggle(key)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  value ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    value ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <TechDivider color="blue" />
          </div>
        ))}

        <div className="flex gap-2 mt-6">
          <GlowButton variant="secondary" size="md" className="flex-1">
            Cancel
          </GlowButton>
          <GlowButton variant="primary" size="md" className="flex-1">
            Save
          </GlowButton>
        </div>
      </div>
    </HologramCard>
  );
}

export default {
  StatsView,
  AlertManagement,
  LogStream,
  ActionBar,
  SystemStatus,
  ThreatIntelligence,
  IncidentTimeline,
  IncidentsTable,
  IncidentDetailsModal,
  SettingsPanel,
};
