import React, { useState, useEffect, useCallback } from 'react';
import { HologramCard } from '../ui/HologramCard';
import RangerLogsTable from '../logs/RangerLogsTable';
import RangerAlertsPanel from '../alerts/RangerAlertsPanel';
import AttackTypeChart from '../Charts/AttackTypeChart';
import SeverityTrendChart from '../Charts/SeverityTrendChart';
import TopSourceIPsChart from '../Charts/TopSourceIPsChart';
import AlertsSeverityChart from '../Charts/AlertsSeverityChart';
import AdvancedLogAnalysis from '../logs/AdvancedLogAnalysis';
import SecurityAnalytics from '../analytics/SecurityAnalytics';
import GeoMap from '../maps/GeoMap';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

const TAB_CONFIG = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', permission: 'viewAnalytics' },
  { id: 'logs', label: 'Logs', icon: '📋', permission: 'viewLogs' },
  { id: 'alerts', label: 'Alerts', icon: '🚨', permission: 'viewAlerts' },
  { id: 'analytics', label: 'Analytics', icon: '📊', permission: 'viewLogs' }, // Analytics needs logs data
  { id: 'settings', label: 'Settings', icon: '⚙️', permission: null }, // Settings available to all
];

export function RangerDashboard() {
  const { user, logout, isAdmin, token } = useAuth();
  const navigate = useNavigate();
  
  // Get first available tab based on permissions
  const getFirstAvailableTab = () => {
    if (isAdmin()) return 'dashboard';
    
    for (const tab of TAB_CONFIG) {
      if (!tab.permission || user?.permissions?.[tab.permission]) {
        return tab.id;
      }
    }
    return 'settings'; // Fallback to settings if no permissions
  };
  
  const [activeTab, setActiveTab] = useState(getFirstAvailableTab());
  const socket = useSocket();
  const [sharedLogs, setSharedLogs] = useState([]);
  const [sharedAlerts, setSharedAlerts] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const fetchData = useCallback(async () => {
    try {
      // Get token from both context and localStorage as fallback
      const authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        console.error('No authentication token found');
        navigate('/login');
        return;
      }

      console.log('Fetching data with token:', authToken.substring(0, 20) + '...');

      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      const [logsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/logs/recent?limit=1000`, { headers }),
        fetch(`${API_BASE_URL}/api/alerts/recent?limit=10`, { headers })
      ]);

      console.log('Logs response status:', logsRes.status);
      console.log('Alerts response status:', alertsRes.status);
      
      const logsData = await logsRes.json();
      const alertsData = await alertsRes.json();
      
      if (!logsData.success) {
        console.error('Logs fetch error:', logsData.error);
      }
      
      if (!alertsData.success) {
        console.error('Alerts fetch error:', alertsData.error);
      }
      
      if (logsData.success) setSharedLogs(logsData.logs || []);
      if (alertsData.success) setSharedAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [navigate, token]);
  
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Real-time updates - shared across all views
  useEffect(() => {
    if (!socket) return;
    
    const handleNewLog = (log) => setSharedLogs((prev) => [log, ...prev].slice(0, 1000));
    const handleNewAlert = (alert) => setSharedAlerts((prev) => [alert, ...prev].slice(0, 100));
    
    socket.on('log:new', handleNewLog);
    socket.on('alert:new', handleNewAlert);
    
    return () => {
      if (socket?.off) {
        socket.off('log:new', handleNewLog);
        socket.off('alert:new', handleNewAlert);
      }
    };
  }, [socket]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'logs':
        return <AdvancedLogAnalysis />;
      case 'alerts':
        return <AlertsView alerts={sharedAlerts} />;
      case 'analytics':
        return <SecurityAnalytics />;
      case 'settings':
        return <SettingsView />;
      case 'dashboard':
      default:
        return <DashboardView logs={sharedLogs} alerts={sharedAlerts} />;
    }
  };

  return (
    <div className="h-screen bg-[#05080F] text-gray-100 relative flex flex-col overflow-hidden">
      {/* Morphin Grid Background Overlay - VERY SUBTLE */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(255,26,26,0.05) 25%, rgba(255,26,26,0.05) 26%, transparent 27%),
            linear-gradient(90deg, transparent 24%, rgba(255,26,26,0.05) 25%, rgba(255,26,26,0.05) 26%, transparent 27%)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Premium Navbar */}
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-[1600px] px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/20 border border-red-500/40 rounded flex items-center justify-center">
                <span className="text-red-400 text-xl">⚡</span>
              </div>
              <h1 className="text-xl font-['Orbitron'] font-black tracking-[0.15em] text-red-400 uppercase">
                RANGER COMMAND
              </h1>
            </div>

            {/* Tab Navigation */}
            <nav className="flex items-center gap-1">
              {TAB_CONFIG.filter(tab => {
                // Admin can see all tabs
                if (isAdmin()) return true;
                // If tab has no permission requirement, show it to everyone
                if (!tab.permission) return true;
                // Check if user has the required permission
                return user?.permissions?.[tab.permission] === true;
              }).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-5 py-2
                    text-sm font-['Orbitron'] font-medium tracking-wider uppercase
                    transition-all duration-300
                    ${activeTab === tab.id 
                      ? 'text-red-400' 
                      : 'text-gray-500 hover:text-gray-300'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{tab.icon}</span>
                    {tab.label}
                  </span>
                  
                  {/* Laser underline animation */}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-red-500 to-transparent animate-pulse" />
                  )}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400 font-['Roboto_Mono']">{user?.email}</span>
                {isAdmin() && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">ADMIN</span>
                )}
              </div>
              {isAdmin() && (
                <button
                  onClick={() => navigate('/admin/pending-users')}
                  className="px-3 py-1.5 text-xs font-['Orbitron'] tracking-wider text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 rounded transition-all"
                >
                  👥 USERS
                </button>
              )}
              {(isAdmin() || user?.permissions?.viewIncidents) && (
                <button
                  onClick={() => navigate('/incidents')}
                  className="px-3 py-1.5 text-xs font-['Orbitron'] tracking-wider text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-400/50 rounded transition-all"
                >
                  📋 INCIDENTS
                </button>
              )}
              <button
                onClick={() => navigate('/simulator')}
                className="px-3 py-1.5 text-xs font-['Orbitron'] tracking-wider text-orange-400 hover:text-orange-300 border border-orange-500/30 hover:border-orange-400/50 rounded transition-all"
              >
                ⚡ SIMULATOR
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-['Orbitron'] tracking-wider text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded transition-all"
              >
                🚪 LOGOUT
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width Utilization */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-[2000px] px-6 py-8 min-h-full">
          <div className="animate-[fadeIn_0.5s_ease-out]">
            {renderActiveView()}
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardView({ logs = [] }) {
  // Calculate real metrics from props
  const totalEvents = logs.length;
  const criticalLogs = logs.filter((l) => l.severity === 'critical').length;
  const highSeverityLogs = logs.filter((l) => l.severity === 'high' || l.severity === 'critical').length;
  const uniqueIPs = new Set(logs.map((l) => l.source_ip)).size;
  
  const metrics = [
    { 
      id: 'events', 
      label: 'Total Events', 
      value: totalEvents.toLocaleString(), 
      caption: 'logs analyzed', 
      tone: 'cyan', 
      trend: null 
    },
    { 
      id: 'critical-alerts', 
      label: 'Critical Events', 
      value: criticalLogs.toString(), 
      caption: 'critical severity', 
      tone: 'red', 
      trend: null 
    },
    { 
      id: 'threats-blocked', 
      label: 'High Threats', 
      value: highSeverityLogs.toString(), 
      caption: 'high + critical', 
      tone: 'cyan', 
      trend: null 
    },
    { 
      id: 'unique-ips', 
      label: 'Unique Sources', 
      value: uniqueIPs.toString(), 
      caption: 'IP addresses', 
      tone: 'blue', 
      trend: null 
    },
  ];

  const accentByTone = {
    red: 'text-red-400',
    cyan: 'text-cyan-400',
    blue: 'text-sky-400',
    green: 'text-emerald-400',
  };

  return (
    <div className="space-y-10">
      {/* Security Metrics - Equal Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-red-500/10">
          <h2 className="text-sm font-['Orbitron'] font-bold tracking-[0.25em] text-red-400/90 uppercase flex items-center gap-2">
            <span className="text-lg">📊</span>
            SECURITY METRICS
          </h2>
          <span className="text-xs text-gray-600 font-['Roboto_Mono'] tracking-wider">LIVE</span>
        </div>
        
        {/* Horizontal Scrolling Metric Cards */}
        <div className="flex gap-6 overflow-x-auto pb-4 px-1 snap-x snap-mandatory">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="
                relative group shrink-0 snap-start
                bg-black/30 backdrop-blur-md
                border border-red-500/20
                rounded-lg
                p-6
                min-w-[320px] w-[320px]
                transition-all duration-300
                hover:scale-105
                hover:border-red-400/40
                hover:shadow-[0_0_25px_rgba(239,68,68,0.15)]
                overflow-hidden
              "
            >
              {/* Subtle corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/30" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500/30" />
              
              <div className="flex flex-col gap-4">
                {/* Header with trend */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-['Orbitron'] tracking-[0.3em] text-gray-500 uppercase">
                    {metric.label}
                  </span>
                </div>
                
                {/* Value with breathing glow */}
                <div className="relative">
                  <span className={`text-4xl font-['Orbitron'] font-black ${accentByTone[metric.tone]} drop-shadow-[0_0_10px_currentColor] animate-pulse`}>
                    {metric.value}
                  </span>
                </div>
                
                {/* Caption with live indicator */}
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gray-600">
                  <div className={`w-1.5 h-1.5 rounded-full ${accentByTone[metric.tone]} animate-pulse`} />
                  {metric.caption}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Real-Time Streams - Horizontal Scroll */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/10">
          <h2 className="text-sm font-['Orbitron'] font-bold tracking-[0.25em] text-cyan-400/90 uppercase flex items-center gap-2">
            <span className="text-lg">⚡</span>
            REAL-TIME STREAMS
          </h2>
          <span className="text-xs text-gray-600 font-['Roboto_Mono'] tracking-wider">AUTO-REFRESH</span>
        </div>
        
        {/* Horizontal Scrolling Panels */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
          {/* Event Logs Panel - Smaller with internal scrolling */}
          <div className="
            shrink-0 snap-start
            bg-black/30 backdrop-blur-md
            rounded-lg
            p-0
            min-w-[850px] w-[850px]
            h-[550px]
            transition-all duration-300
            overflow-hidden
          ">
            <div className="h-full p-6 flex flex-col">
              <RangerLogsTable />
            </div>
          </div>
          
          {/* Critical Alerts Panel - Smaller with internal scrolling */}
          <div className="
            shrink-0 snap-start
            bg-black/30 backdrop-blur-md
            rounded-lg
            p-0
            min-w-[600px] w-[600px]
            h-[550px]
            transition-all duration-300
            overflow-hidden
          ">
            <div className="h-full p-6 flex flex-col">
              <RangerAlertsPanel />
            </div>
          </div>
        </div>
      </section>

      {/* Activity Timeline */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-blue-500/10">
          <h2 className="text-sm font-['Orbitron'] font-bold tracking-[0.25em] text-blue-400/90 uppercase flex items-center gap-2">
            <span className="text-lg">⏱️</span>
            ACTIVITY TIMELINE
          </h2>
        </div>
        
        <div className="bg-black/30 backdrop-blur-md border border-blue-500/20 rounded-lg p-6 max-h-80 overflow-y-auto">
          <div className="space-y-3">
            {logs.slice(0, 10).map((log, idx) => {
              const time = new Date(log.timestamp || log.created_at).toLocaleTimeString('en-US', { hour12: false });
              const severity = log.severity || 'low';
              const eventType = (log.event_type || log.attack_type || 'unknown').replace(/_/g, ' ');
              const sourceIP = log.source_ip || 'unknown';
              
              const getIcon = (sev) => {
                if (sev === 'critical') return '🚨';
                if (sev === 'high') return '⚠️';
                if (sev === 'medium') return '❌';
                return '✅';
              };
              
              const event = `${eventType.toUpperCase()} from ${sourceIP}`;
              
              return (
                <div
                  key={log._id || log.id || log.log_id || idx}
                  className="flex items-start gap-4 p-3 rounded border-l-2 hover:bg-gray-900/50 transition-colors"
                  style={{
                    borderColor:
                      severity === 'critical' ? '#ff1c1c' :
                      severity === 'high' ? '#f97316' :
                      severity === 'medium' ? '#eab308' :
                      '#0ea5e9',
                  }}
                >
                  <div className="text-xl shrink-0">{getIcon(severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-xs font-['Roboto_Mono'] text-gray-500">{time}</div>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-['Roboto_Mono'] uppercase tracking-wide"
                        style={{
                          background: severity === 'critical' ? 'rgba(255, 28, 28, 0.2)' :
                                    severity === 'high' ? 'rgba(249, 115, 22, 0.2)' :
                                    severity === 'medium' ? 'rgba(234, 179, 8, 0.2)' :
                                    'rgba(14, 165, 233, 0.2)',
                          color: severity === 'critical' ? '#ff2a2a' :
                                severity === 'high' ? '#f97316' :
                                severity === 'medium' ? '#eab308' :
                                '#0ea5e9',
                        }}
                      >
                        {severity}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">{event}</div>
                  </div>
                </div>
              );
            })}
            {logs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">⏳</div>
                <div>Waiting for activity...</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Threat Intelligence */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-red-500/10">
          <h2 className="text-sm font-['Orbitron'] font-bold tracking-[0.25em] text-red-400/90 uppercase flex items-center gap-2">
            <span className="text-lg">🌐</span>
            THREAT INTELLIGENCE
          </h2>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-4">
          {/* Global Threat Map */}
          <div className="shrink-0 min-w-[1000px] bg-black/30 backdrop-blur-md border border-red-500/20 rounded-lg p-6">
            <h3 className="text-xs font-['Orbitron'] font-bold tracking-[0.2em] text-red-400 uppercase mb-4">
              🗺️ GLOBAL THREAT MAP
            </h3>
            <div className="w-full h-[500px]">
              <GeoMap logs={logs} />
            </div>
          </div>

          {/* Top Threats */}
          <div className="shrink-0 min-w-[400px] bg-black/30 backdrop-blur-md border border-orange-500/20 rounded-lg p-6">
            <h3 className="text-xs font-['Orbitron'] font-bold tracking-[0.2em] text-orange-400 uppercase mb-4">
              ⚡ TOP THREATS
            </h3>
            <div className="space-y-4">
              {[
                { threat: 'SQL Injection', count: 45, width: 100 },
                { threat: 'XSS Attacks', count: 38, width: 84 },
                { threat: 'DDoS Attempts', count: 12, width: 27 },
                { threat: 'Brute Force', count: 28, width: 62 },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-['Roboto_Mono'] text-gray-300">{item.threat}</span>
                    <span className="text-red-400 font-bold">{item.count}</span>
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
        </div>
      </section>

      {/* System Status */}
      <section className="space-y-6 border-t border-red-500/10 pt-10">
        <div className="flex items-center justify-between pb-4 border-b border-green-500/10">
          <h2 className="text-sm font-['Orbitron'] font-bold tracking-[0.25em] text-green-400/90 uppercase flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            SYSTEM STATUS
          </h2>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[
            { label: 'API Server', status: 'active', time: 'uptime 45d' },
            { label: 'Database', status: 'active', time: 'connected' },
            { label: 'Queue Workers', status: 'active', time: '3 active' },
            { label: 'Socket.IO', status: 'active', time: '12 clients' },
          ].map((item, idx) => (
            <div key={idx} className="shrink-0 min-w-[200px] bg-black/30 backdrop-blur-md border border-green-500/20 rounded-lg text-center py-6 px-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
                }} />
                <div className="text-xs font-['Roboto_Mono'] text-gray-300">{item.label}</div>
              </div>
              <div className="text-xs text-gray-600">{item.time}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AlertsView({ alerts = [] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-header-lg tracking-[0.25em] text-gray-200">ALERTS</h2>
      <HologramCard variant="glass" glowColor="red" className="min-h-[calc(100vh-260px)] flex flex-col">
        <RangerAlertsPanel initialAlerts={alerts} />
      </HologramCard>
    </div>
  );
}

function AnalyticsView() {
  return (
    <div className="space-y-10">
      <h2 className="text-header-lg tracking-[0.25em] text-gray-200">ANALYTICS</h2>
      
      {/* Charts Grid - Horizontal Scrolling */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-min">
          <div className="w-[600px] shrink-0">
            <AttackTypeChart />
          </div>
          <div className="w-[600px] shrink-0">
            <AlertsSeverityChart />
          </div>
          <div className="w-[600px] shrink-0">
            <SeverityTrendChart />
          </div>
          <div className="w-[600px] shrink-0">
            <TopSourceIPsChart />
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <HologramCard variant="glass" glowColor="blue" className="py-16 text-center space-y-4">
        <div className="text-5xl opacity-30">🔮</div>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Advanced analytics coming soon: Attack path visualizations, SLA tracking, and MITRE ATT&CK coverage heatmaps.
        </p>
      </HologramCard>
    </div>
  );
}

function SettingsView() {
  const settings = [
    { id: 'alerts', label: 'Alert Notifications', description: 'Real-time analyst and exec notifications', enabled: true },
    { id: 'dark-mode', label: 'Dark Mode', description: 'Always on for the command aesthetic', enabled: true, disabled: true },
    { id: 'sound', label: 'Sound Effects', description: 'Tactical alert tones on critical events', enabled: false },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-header-lg tracking-[0.25em] text-gray-200">SETTINGS</h2>
      <HologramCard variant="glass" glowColor="purple" className="divide-y divide-white/10 p-0">
        {settings.map((setting) => (
          <label
            key={setting.id}
            className={`flex items-start justify-between gap-6 px-6 py-5 ${setting.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div>
              <div className="text-sm font-['Orbitron'] text-gray-100 uppercase tracking-[0.2em]">
                {setting.label}
              </div>
              <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={setting.enabled}
              disabled={setting.disabled}
              className="mt-1 h-5 w-5 accent-red-500"
            />
          </label>
        ))}
      </HologramCard>
    </div>
  );
}

export default RangerDashboard;
