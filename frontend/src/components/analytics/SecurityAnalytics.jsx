import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { API_BASE_URL } from '../../config/api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Analytics Data Transformation Utilities
const aggregateByAttackType = (logs) => {
  const counts = {};
  logs.forEach((log) => {
    const type = log.event_type || log.attack_type || 'unknown';
    counts[type] = (counts[type] || 0) + 1;
  });
  
  return Object.entries(counts).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').toUpperCase(),
    value,
    percentage: ((value / logs.length) * 100).toFixed(1),
  }));
};

const aggregateBySeverity = (logs) => {
  const severities = { low: 0, medium: 0, high: 0, critical: 0 };
  logs.forEach((log) => {
    const sev = (log.severity || 'low').toLowerCase();
    if (severities[sev] !== undefined) severities[sev]++;
  });
  
  return [
    { name: 'Low', value: severities.low, color: '#3b82f6' },
    { name: 'Medium', value: severities.medium, color: '#eab308' },
    { name: 'High', value: severities.high, color: '#f97316' },
    { name: 'Critical', value: severities.critical, color: '#ef4444' },
  ];
};

const aggregateTimeline = (logs, bucketMinutes = 5) => {
  const buckets = {};
  const bucketMs = bucketMinutes * 60 * 1000;
  
  logs.forEach((log) => {
    const timestamp = new Date(log.timestamp || log.created_at).getTime();
    const bucketKey = Math.floor(timestamp / bucketMs) * bucketMs;
    
    if (!buckets[bucketKey]) {
      buckets[bucketKey] = { timestamp: bucketKey, total: 0, critical: 0, high: 0 };
    }
    buckets[bucketKey].total++;
    if (log.severity === 'critical') buckets[bucketKey].critical++;
    if (log.severity === 'high') buckets[bucketKey].high++;
  });
  
  return Object.values(buckets)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-20)
    .map((bucket) => ({
      time: new Date(bucket.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      total: bucket.total,
      critical: bucket.critical,
      high: bucket.high,
    }));
};

const aggregateTopIPs = (logs, limit = 10) => {
  const ipCounts = {};
  logs.forEach((log) => {
    const ip = log.source_ip || 'unknown';
    if (!ipCounts[ip]) {
      ipCounts[ip] = { ip, total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    }
    ipCounts[ip].total++;
    const sev = (log.severity || 'low').toLowerCase();
    if (ipCounts[ip][sev] !== undefined) ipCounts[ip][sev]++;
  });
  
  return Object.values(ipCounts)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
};

const aggregateTargetEndpoints = (logs) => {
  const endpoints = {};
  logs.forEach((log) => {
    const url = log.metadata?.url || log.target_system || 'unknown';
    const endpoint = url.split('?')[0]; // Remove query params
    endpoints[endpoint] = (endpoints[endpoint] || 0) + 1;
  });
  
  return Object.entries(endpoints)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
};

const aggregateUserAgents = (logs) => {
  const agents = {};
  logs.forEach((log) => {
    const ua = log.metadata?.user_agent || 'unknown';
    let category = 'Other';
    
    if (ua.includes('Mozilla') || ua.includes('Chrome') || ua.includes('Safari')) category = 'Browser';
    else if (ua.includes('bot') || ua.includes('crawl') || ua.includes('spider')) category = 'Bot';
    else if (ua.includes('sqlmap') || ua.includes('nikto') || ua.includes('nmap')) category = 'Scanner';
    else if (ua.includes('curl') || ua.includes('python') || ua.includes('wget')) category = 'CLI Tool';
    
    agents[category] = (agents[category] || 0) + 1;
  });
  
  return Object.entries(agents).map(([name, value]) => ({ name, value }));
};

// Filter Controls Component
const FilterControls = ({ filters, setFilters, onApply }) => {
  const timeWindows = [
    { label: 'Last 5 min', value: 5 },
    { label: 'Last 1 hour', value: 60 },
    { label: 'Last 24 hours', value: 1440 },
    { label: 'Last 7 days', value: 10080 },
  ];
  
  return (
    <div className="bg-black/30 backdrop-blur-md border border-red-500/20 rounded-xl p-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-['Orbitron'] uppercase">Time Window:</label>
          <select
            value={filters.timeWindow}
            onChange={(e) => setFilters({ ...filters, timeWindow: parseInt(e.target.value) })}
            className="bg-black/50 border border-white/10 rounded px-3 py-1 text-sm text-gray-300 focus:outline-none focus:border-red-500"
          >
            {timeWindows.map((tw) => (
              <option key={tw.value} value={tw.value}>
                {tw.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-['Orbitron'] uppercase">Severity:</label>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="bg-black/50 border border-white/10 rounded px-3 py-1 text-sm text-gray-300 focus:outline-none focus:border-red-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <button
          onClick={onApply}
          className="ml-auto px-4 py-1 bg-red-500/20 border border-red-500 text-red-400 rounded text-sm font-['Orbitron'] hover:bg-red-500/30 transition-colors"
        >
          REFRESH
        </button>
      </div>
    </div>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-black/90 border border-cyan-500/30 rounded p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-['Roboto_Mono']" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, subtitle, trend, icon }) => (
  <div className="bg-black/30 backdrop-blur-md border border-blue-500/20 rounded-xl p-4 hover:border-blue-500/40 transition-all">
    <div className="flex items-start justify-between mb-2">
      <span className="text-xs text-gray-500 font-['Orbitron'] uppercase tracking-wider">{title}</span>
      {icon && <span className="text-2xl">{icon}</span>}
    </div>
    <div className="text-3xl font-['Orbitron'] font-bold text-cyan-400 mb-1">{value}</div>
    <div className="text-xs text-gray-400">{subtitle}</div>
    {trend && (
      <div className={`text-xs mt-2 ${trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
      </div>
    )}
  </div>
);

export function SecurityAnalytics() {
  const socket = useSocket();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    timeWindow: 1440,
    severity: 'all',
  });
  
  const fetchLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/logs/recent?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }, []);
  
  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    
    const handleNewLog = (newLog) => {
      setLogs((prev) => [newLog, ...prev].slice(0, 1000));
    };
    
    socket.on('log:new', handleNewLog);
    return () => {
      if (socket?.off) socket.off('log:new', handleNewLog);
    };
  }, [socket]);
  
  // Apply filters
  useEffect(() => {
    let result = [...logs];
    
    // Time filter
    const cutoff = Date.now() - filters.timeWindow * 60 * 1000;
    result = result.filter((log) => new Date(log.timestamp || log.created_at).getTime() > cutoff);
    
    // Severity filter
    if (filters.severity !== 'all') {
      result = result.filter((log) => log.severity?.toLowerCase() === filters.severity);
    }
    
    setFilteredLogs(result);
  }, [logs, filters]);
  
  // Compute analytics
  const attackTypeData = aggregateByAttackType(filteredLogs);
  const severityData = aggregateBySeverity(filteredLogs);
  const timelineData = aggregateTimeline(filteredLogs, 5);
  const topIPsData = aggregateTopIPs(filteredLogs, 10);
  const endpointData = aggregateTargetEndpoints(filteredLogs);
  const userAgentData = aggregateUserAgents(filteredLogs);
  
  // Attack type colors
  const ATTACK_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-['Orbitron'] font-bold text-red-400 tracking-wider uppercase">
            Security Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real-time threat intelligence and pattern analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400 font-['Roboto_Mono']">LIVE DATA</span>
        </div>
      </div>
      
      {/* Filters */}
      <FilterControls filters={filters} setFilters={setFilters} onApply={fetchLogs} />
      
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Events"
          value={filteredLogs.length.toLocaleString()}
          subtitle="security events analyzed"
          trend={12}
          icon="📊"
        />
        <MetricCard
          title="Critical Alerts"
          value={severityData.find((s) => s.name === 'Critical')?.value || 0}
          subtitle="requiring immediate action"
          trend={-5}
          icon="🚨"
        />
        <MetricCard
          title="Unique IPs"
          value={topIPsData.length}
          subtitle="distinct attackers detected"
          trend={8}
          icon="🌐"
        />
        <MetricCard
          title="Attack Types"
          value={attackTypeData.length}
          subtitle="different threat vectors"
          trend={3}
          icon="⚔️"
        />
      </div>
      
      {/* Main Analytics Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Attack Type Distribution */}
        <div className="bg-black/30 backdrop-blur-md border border-red-500/20 rounded-xl p-6">
          <h3 className="text-sm font-['Orbitron'] font-bold text-red-400 mb-4 uppercase tracking-wider">
            Attack Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={attackTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {attackTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ATTACK_COLORS[index % ATTACK_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Severity Distribution */}
        <div className="bg-black/30 backdrop-blur-md border border-orange-500/20 rounded-xl p-6">
          <h3 className="text-sm font-['Orbitron'] font-bold text-orange-400 mb-4 uppercase tracking-wider">
            Severity Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Attacks Over Time */}
        <div className="col-span-2 bg-black/30 backdrop-blur-md border border-cyan-500/20 rounded-xl p-6">
          <h3 className="text-sm font-['Orbitron'] font-bold text-cyan-400 mb-4 uppercase tracking-wider">
            Attack Timeline (5-Minute Buckets)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '11px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#06b6d4"
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total Events"
              />
              <Area
                type="monotone"
                dataKey="critical"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorCritical)"
                name="Critical"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Top Attacker IPs */}
        <div className="bg-black/30 backdrop-blur-md border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-sm font-['Orbitron'] font-bold text-purple-400 mb-4 uppercase tracking-wider">
            Top Attacker IPs
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {topIPsData.map((item, idx) => (
              <div
                key={idx}
                className="bg-black/40 rounded p-3 border-l-2 hover:bg-black/60 transition-colors"
                style={{ borderColor: item.critical > 0 ? '#ef4444' : item.high > 0 ? '#f97316' : '#3b82f6' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-['Roboto_Mono'] text-purple-400">{item.ip}</span>
                  <span className="text-xs text-gray-500">#{idx + 1}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400">Total: <span className="text-white font-bold">{item.total}</span></span>
                  {item.critical > 0 && <span className="text-red-400">Crit: {item.critical}</span>}
                  {item.high > 0 && <span className="text-orange-400">High: {item.high}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Target Endpoints */}
        <div className="bg-black/30 backdrop-blur-md border border-yellow-500/20 rounded-xl p-6">
          <h3 className="text-sm font-['Orbitron'] font-bold text-yellow-400 mb-4 uppercase tracking-wider">
            Targeted Endpoints
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={endpointData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis type="category" dataKey="name" stroke="#9ca3af" style={{ fontSize: '10px' }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#eab308" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* User Agent Analysis */}
        <div className="bg-black/30 backdrop-blur-md border border-green-500/20 rounded-xl p-6">
          <h3 className="text-sm font-['Orbitron'] font-bold text-green-400 mb-4 uppercase tracking-wider">
            User Agent Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userAgentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {userAgentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ATTACK_COLORS[index % ATTACK_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Incident Response Metrics */}
        <div className="bg-black/30 backdrop-blur-md border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-sm font-['Orbitron'] font-bold text-blue-400 mb-4 uppercase tracking-wider">
            Incident Response Metrics
          </h3>
          <div className="space-y-4">
            <div className="bg-black/40 rounded p-4">
              <div className="text-xs text-gray-500 mb-1">Total Incidents (This Week)</div>
              <div className="text-2xl font-['Orbitron'] font-bold text-cyan-400">
                {filteredLogs.filter((l) => l.severity === 'critical' || l.severity === 'high').length}
              </div>
            </div>
            <div className="bg-black/40 rounded p-4">
              <div className="text-xs text-gray-500 mb-1">Avg Response Time</div>
              <div className="text-2xl font-['Orbitron'] font-bold text-yellow-400">2.3 min</div>
            </div>
            <div className="bg-black/40 rounded p-4">
              <div className="text-xs text-gray-500 mb-1">Resolution Rate</div>
              <div className="text-2xl font-['Orbitron'] font-bold text-green-400">87%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityAnalytics;
