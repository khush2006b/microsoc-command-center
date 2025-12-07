/**
 * Ranger Theme Dashboard Layout
 * Premium Command Center interface with cinematic effects
 */

import React, { useState } from 'react';
import RangerSidebar from '../layout/RangerSidebar';
import CommandNavBar from '../layout/CommandNavBar';
import RangerLogsTable from '../logs/RangerLogsTable';
import RangerAlertsPanel from '../alerts/RangerAlertsPanel';
import { StatCard, HologramCard, StatusDot, TechDivider } from '../theme/ThemeComponents';

export function RangerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'logs':
        return <LogsView />;
      case 'alerts':
        return <AlertsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'incidents':
        return <IncidentsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black">
      {/* Command Navigation Bar */}
      <CommandNavBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <RangerSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6 animate-entrance">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-8">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: SECURITY OVERVIEW HEADER */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="border-l-4 border-red-600 pl-4">
        <h2 className="text-header-lg text-neon-red">
          🛡️ SECURITY OVERVIEW
        </h2>
        <p className="text-xs opacity-60 mt-2">Real-time threat intelligence and system status</p>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: KEY METRICS - 4 STAT CARDS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card animated">
            <div className="stat-label">📊 Total Events</div>
            <div className="stat-value">2,847</div>
            <div className="stat-unit">logs analyzed</div>
            <div className="stat-trend">↑ +12%</div>
          </div>
          <div className="stat-card animated">
            <div className="stat-label">🚨 Critical Alerts</div>
            <div className="stat-value">23</div>
            <div className="stat-unit">active</div>
            <div className="stat-trend negative">↑ -5%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">🛡️ Threats Blocked</div>
            <div className="stat-value">156</div>
            <div className="stat-unit">today</div>
            <div className="stat-trend">↑ +8%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">💚 System Health</div>
            <div className="stat-value">98.5%</div>
            <div className="stat-unit">uptime</div>
            <div className="stat-trend">↑ +2%</div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: LOGS & ALERTS - TWO COLUMN LAYOUT */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section>
        <h3 className="text-header-md text-neon-red mb-4">
          📊 REAL-TIME DATA STREAMS
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: LOGS TABLE (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="text-xs font-mono mb-2 opacity-70 uppercase tracking-widest border-b border-red-900/30 pb-2">
              🖥️ Live Event Logs
            </div>
            <div className="command-panel p-0 max-h-96 overflow-hidden flex flex-col">
              <RangerLogsTable />
            </div>
          </div>

          {/* RIGHT: ALERTS PANEL (1/3 width) */}
          <div>
            <div className="text-xs font-mono mb-2 opacity-70 uppercase tracking-widest border-b border-red-900/30 pb-2">
              ⚠️ Critical Alerts
            </div>
            <div className="command-panel p-0 max-h-96 overflow-hidden flex flex-col">
              <RangerAlertsPanel />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: ACTIVITY TIMELINE */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section>
        <h3 className="text-header-md text-neon-red mb-4">
          ⏱️ ACTIVITY TIMELINE
        </h3>
        <div className="hologram-card glow-blue animated max-h-64 overflow-y-auto">
          <div className="space-y-3">
            {[
              { time: '14:23:45', event: 'Critical: Unauthorized file modification detected', severity: 'critical', icon: '🚨' },
              { time: '14:18:12', event: 'Port scan detected from 192.168.1.42', severity: 'high', icon: '⚠️' },
              { time: '14:15:33', event: 'Failed login attempts (5 consecutive)', severity: 'medium', icon: '❌' },
              { time: '14:10:22', event: 'Suspicious process execution blocked', severity: 'high', icon: '⚠️' },
              { time: '14:05:10', event: 'System health check: All systems operational', severity: 'low', icon: '✅' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-3 rounded border-l-3 hover:bg-gray-900/50 transition-colors"
                style={{
                  borderColor:
                    item.severity === 'critical' ? '#ff1c1c' :
                    item.severity === 'high' ? '#f97316' :
                    item.severity === 'medium' ? '#eab308' :
                    '#0ea5e9',
                }}
              >
                <div className="text-xl flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs font-mono opacity-60">{item.time}</div>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wide"
                      style={{
                        background: item.severity === 'critical' ? 'rgba(255, 28, 28, 0.2)' :
                                  item.severity === 'high' ? 'rgba(249, 115, 22, 0.2)' :
                                  item.severity === 'medium' ? 'rgba(234, 179, 8, 0.2)' :
                                  'rgba(14, 165, 233, 0.2)',
                        color: item.severity === 'critical' ? '#ff2a2a' :
                              item.severity === 'high' ? '#f97316' :
                              item.severity === 'medium' ? '#eab308' :
                              '#0ea5e9',
                      }}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <div className="text-sm">{item.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: THREAT INTELLIGENCE */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Attack Distribution */}
        <div className="lg:col-span-2">
          <h3 className="text-header-md text-neon-red mb-4">
            🗺️ GLOBAL THREAT MAP
          </h3>
          <div className="hologram-card glow-red animated">
            <div
              className="w-full rounded-lg flex flex-col items-center justify-center p-8 text-center"
              style={{
                background: 'radial-gradient(circle, rgba(255, 28, 28, 0.1), rgba(20, 20, 20, 0.8))',
                border: '1px dashed rgba(255, 28, 28, 0.3)',
                minHeight: '250px',
              }}
            >
              <div className="text-5xl mb-4">🌍</div>
              <div className="text-sm font-mono uppercase tracking-wide opacity-70 mb-2">Global Attack Distribution</div>
              <div className="text-xs opacity-50">Interactive world map visualization • Coming soon</div>
            </div>
          </div>
        </div>

        {/* Right: Top Threats */}
        <div>
          <h3 className="text-header-md text-neon-red mb-4">
            ⚡ TOP THREATS
          </h3>
          <div className="hologram-card glow-orange animated space-y-4">
            {[
              { threat: 'SQL Injection', count: 45, width: 100 },
              { threat: 'XSS Attacks', count: 38, width: 84 },
              { threat: 'DDoS Attempts', count: 12, width: 27 },
              { threat: 'Brute Force', count: 28, width: 62 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-mono">{item.threat}</span>
                  <span className="text-neon-red font-bold">{item.count}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.width}%`,
                      background: 'linear-gradient(90deg, #ff1c1c, rgba(255, 28, 28, 0.3))',
                      boxShadow: '0 0 8px rgba(255, 28, 28, 0.5)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: SYSTEM STATUS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-red-900/30 pt-6">
        <h3 className="text-header-md text-neon-red mb-4">
          ⚙️ SYSTEM STATUS
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'API Server', status: 'active', time: 'uptime 45d' },
            { label: 'Database', status: 'active', time: 'connected' },
            { label: 'Queue Workers', status: 'active', time: '3 active' },
            { label: 'Socket.IO', status: 'active', time: '12 clients' },
          ].map((item, idx) => (
            <div key={idx} className="command-panel text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
                }} />
                <div className="text-xs font-mono">{item.label}</div>
              </div>
              <div className="text-xs opacity-60">{item.time}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LogsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-header-lg text-neon-red">🖥️ LIVE EVENT LOGS</h2>
      <div className="command-panel p-6 max-h-screen overflow-auto">
        <RangerLogsTable />
      </div>
    </div>
  );
}

function AlertsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-header-lg text-neon-red">🚨 CRITICAL ALERTS</h2>
      <div className="command-panel p-6 max-h-screen overflow-auto">
        <RangerAlertsPanel />
      </div>
    </div>
  );
}

function AnalyticsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-header-lg text-neon-red">📈 SECURITY ANALYTICS</h2>
      <div className="hologram-card glow-blue animated p-8">
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📊</div>
          <div className="font-mono opacity-70">Advanced analytics module</div>
          <div className="text-xs opacity-50 mt-2">Coming soon with Recharts integration</div>
        </div>
      </div>
    </div>
  );
}

function IncidentsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-header-lg text-neon-red">🛡️ INCIDENT MANAGEMENT</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { id: 'INC-001', title: 'Unauthorized Access Attempt', status: 'open', severity: 'critical' },
          { id: 'INC-002', title: 'Database Query Anomaly', status: 'in-progress', severity: 'high' },
          { id: 'INC-003', title: 'Failed Authentication Spike', status: 'resolved', severity: 'medium' },
        ].map((incident) => (
          <div key={incident.id} className="alert-card critical">
            <div className="alert-title">{incident.id}: {incident.title}</div>
            <div className="text-xs mt-3">
              <div className="mb-2">Status: <span className="font-mono">{incident.status}</span></div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: incident.status === 'resolved' ? '100%' : incident.status === 'in-progress' ? '50%' : '0%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-header-lg text-neon-red">⚙️ COMMAND CENTER SETTINGS</h2>
      <div className="command-panel p-6 space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-red-900/20">
          <div>
            <div className="text-sm font-mono">Alert Notifications</div>
            <div className="text-xs opacity-60 mt-1">Receive real-time alert notifications</div>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-red-900/20">
          <div>
            <div className="text-sm font-mono">Dark Mode</div>
            <div className="text-xs opacity-60 mt-1">Always active (Ranger aesthetic)</div>
          </div>
          <input type="checkbox" defaultChecked disabled className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-mono">Sound Effects</div>
            <div className="text-xs opacity-60 mt-1">Enable tactical alert sounds</div>
          </div>
          <input type="checkbox" className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default RangerDashboard;
