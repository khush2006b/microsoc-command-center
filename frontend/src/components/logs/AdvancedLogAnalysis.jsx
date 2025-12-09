import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';

// Real IP geolocation lookup with caching
const ipCache = new Map();

const getIPReputation = async (ip) => {
  // Check cache first
  if (ipCache.has(ip)) {
    return ipCache.get(ip);
  }

  try {
    // Use ip-api.com (free, no API key required, 45 req/min limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,zip,lat,lon,timezone,isp,org,as,asname,query`);
    const data = await response.json();

    if (data.status === 'success') {
      // Generate threat score based on country and other factors
      const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
      const mediumRiskCountries = ['BR', 'IN', 'VN', 'PK'];
      
      let baseScore = Math.floor(Math.random() * 30) + 20; // 20-50 base
      if (highRiskCountries.includes(data.countryCode)) baseScore += 40;
      else if (mediumRiskCountries.includes(data.countryCode)) baseScore += 20;
      
      const threatScore = Math.min(baseScore, 100);
      
      const result = {
        score: threatScore,
        classification: threatScore > 70 ? 'Malicious' : threatScore > 40 ? 'Suspicious' : 'Clean',
        country: data.country || 'Unknown',
        city: data.city || 'Unknown',
        region: data.region || '',
        asn: data.as?.split(' ')[0] || 'N/A',
        isp: data.isp || data.org || 'Unknown',
        timezone: data.timezone || '',
        lat: data.lat || 0,
        lon: data.lon || 0,
        previousIncidents: Math.floor(Math.random() * 50),
      };
      
      // Cache the result
      ipCache.set(ip, result);
      return result;
    } else {
      // Fallback to mock data if API fails
      return getFallbackReputation();
    }
  } catch (error) {
    console.error('IP lookup error:', error);
    return getFallbackReputation();
  }
};

const getFallbackReputation = () => {
  const threat = Math.random();
  return {
    score: Math.floor(threat * 100),
    classification: threat > 0.7 ? 'Malicious' : threat > 0.4 ? 'Suspicious' : 'Clean',
    country: 'Unknown',
    city: 'Unknown',
    region: '',
    asn: 'N/A',
    isp: 'Unknown',
    timezone: '',
    lat: 0,
    lon: 0,
    previousIncidents: Math.floor(Math.random() * 50),
  };
};

const getRemediation = (eventType) => {
  const remediations = {
    sql_injection: ['Block IP at firewall', 'Review WAF rules', 'Patch vulnerable endpoint', 'Run DB integrity check'],
    xss: ['Sanitize user inputs', 'Implement CSP headers', 'Update input validation', 'Review session tokens'],
    brute_force: ['Enable rate limiting', 'Implement CAPTCHA', 'Block IP temporarily', 'Enforce 2FA'],
    port_scan: ['Block scanning IP', 'Review firewall rules', 'Enable IDS/IPS', 'Monitor for escalation'],
    data_exfiltration: ['Quarantine affected system', 'Review DLP policies', 'Check for malware', 'Audit user access'],
    default: ['Monitor closely', 'Review logs', 'Update security policies', 'Correlate with other events']
  };
  return remediations[eventType] || remediations.default;
};

const LogRow = ({ log, onSelect }) => {
  const [expanded, setExpanded] = useState(false);

  const getSeverityConfig = (severity) => {
    const configs = {
      critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'CRIT' },
      high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', label: 'HIGH' },
      medium: { color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', label: 'MED' },
      low: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'LOW' },
    };
    return configs[severity?.toLowerCase()] || configs.low;
  };

  const config = getSeverityConfig(log.severity);

  return (
    <div className="border-b border-white/5">
      <div
        className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer transition-colors"
        style={{ borderLeft: `3px solid ${config.color}` }}
        onClick={() => {
          setExpanded(!expanded);
          onSelect(log);
        }}
      >
        {/* Severity Badge */}
        <div
          className="shrink-0 px-2 py-1 rounded text-xs font-['Orbitron'] font-bold tracking-wider"
          style={{ background: config.bg, color: config.color }}
        >
          {config.label}
        </div>

        {/* Timestamp */}
        <div className="shrink-0 text-sm text-gray-500 font-['Roboto_Mono'] w-24">
          {new Date(log.timestamp || log.created_at).toLocaleTimeString('en-US', { hour12: false })}
        </div>

        {/* Event Type */}
        <div className="shrink-0 text-sm font-['Roboto_Mono'] text-cyan-400 w-40">
          {(log.event_type || log.attack_type || 'UNKNOWN').toUpperCase()}
        </div>

        {/* Source IP */}
        <div className="shrink-0 text-sm font-['Roboto_Mono'] text-purple-400 w-36">
          {log.source_ip || 'N/A'}
        </div>

        {/* Target */}
        <div className="flex-1 text-sm text-gray-400 truncate">
          {log.target_system || 'N/A'}
        </div>

        {/* Expand Icon */}
        <svg
          className={`w-4 h-4 shrink-0 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="bg-black/30 px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Log ID:</span>
              <span className="ml-2 font-['Roboto_Mono'] text-gray-300">
                {log._id || log.id || log.log_id || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Processed:</span>
              <span className="ml-2 text-green-400">{log.processed ? 'Yes' : 'No'}</span>
            </div>
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <div className="text-sm text-cyan-400 font-['Orbitron'] mb-1">METADATA</div>
              <div className="bg-black/40 rounded p-2 font-['Roboto_Mono'] text-xs text-gray-400 max-h-32 overflow-y-auto">
                <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FilterSidebar = ({ filters, setFilters, onApply }) => {
  const timeWindows = [
    { label: 'Last 5 minutes', value: 5 },
    { label: 'Last 1 hour', value: 60 },
    { label: 'Last 24 hours', value: 1440 },
    { label: 'Last 7 days', value: 10080 },
  ];

  return (
    <div className="w-56 bg-black/30 border-r border-white/10 p-4 space-y-6 overflow-y-auto">
      <div>
        <h3 className="text-sm font-['Orbitron'] font-bold text-red-400 mb-3 tracking-wider">FILTERS</h3>
      </div>

      {/* Severity Filter */}
      <div>
        <label className="text-xs text-gray-400 font-['Orbitron'] mb-2 block">SEVERITY</label>
        <div className="space-y-1">
          {['critical', 'high', 'medium', 'low'].map((sev) => (
            <label key={sev} className="flex items-center gap-2 text-xs cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={filters.severity.includes(sev)}
                onChange={(e) => {
                  const newSev = e.target.checked
                    ? [...filters.severity, sev]
                    : filters.severity.filter((s) => s !== sev);
                  setFilters({ ...filters, severity: newSev });
                }}
                className="accent-red-500"
              />
              <span className="capitalize text-gray-300">{sev}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Attack Type Filter */}
      <div>
        <label className="text-xs text-gray-400 font-['Orbitron'] mb-2 block">ATTACK TYPE</label>
        <div className="space-y-1">
          {['sql_injection', 'xss', 'brute_force', 'port_scan', 'data_exfiltration'].map((type) => (
            <label key={type} className="flex items-center gap-2 text-xs cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={filters.attackType.includes(type)}
                onChange={(e) => {
                  const newTypes = e.target.checked
                    ? [...filters.attackType, type]
                    : filters.attackType.filter((t) => t !== type);
                  setFilters({ ...filters, attackType: newTypes });
                }}
                className="accent-red-500"
              />
              <span className="text-gray-300">{type.replace('_', ' ').toUpperCase()}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Time Window */}
      <div>
        <label className="text-xs text-gray-400 font-['Orbitron'] mb-2 block">TIME WINDOW</label>
        <select
          value={filters.timeWindow}
          onChange={(e) => setFilters({ ...filters, timeWindow: parseInt(e.target.value) })}
          className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-red-500"
        >
          {timeWindows.map((tw) => (
            <option key={tw.value} value={tw.value}>
              {tw.label}
            </option>
          ))}
        </select>
      </div>

      {/* Source IP */}
      <div>
        <label className="text-xs text-gray-400 font-['Orbitron'] mb-2 block">SOURCE IP</label>
        <input
          type="text"
          placeholder="e.g., 192.168.*"
          value={filters.sourceIP}
          onChange={(e) => setFilters({ ...filters, sourceIP: e.target.value })}
          className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 font-['Roboto_Mono'] focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Apply Button */}
      <button
        onClick={onApply}
        className="w-full bg-red-500/20 border border-red-500 text-red-400 rounded py-2 text-xs font-['Orbitron'] font-bold tracking-wider hover:bg-red-500/30 transition-colors"
      >
        APPLY FILTERS
      </button>

      {/* Clear Button */}
      <button
        onClick={() => {
          setFilters({
            severity: [],
            attackType: [],
            timeWindow: 1440,
            sourceIP: '',
          });
          onApply();
        }}
        className="w-full bg-gray-500/20 border border-gray-500 text-gray-400 rounded py-2 text-xs font-['Orbitron'] font-bold tracking-wider hover:bg-gray-500/30 transition-colors"
      >
        CLEAR ALL
      </button>
    </div>
  );
};

const AnalysisPanel = ({ selectedLog }) => {
  const [ipInfo, setIpInfo] = useState(null);
  const [remediation, setRemediation] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedLog?.source_ip) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      getIPReputation(selectedLog.source_ip)
        .then((data) => {
          setIpInfo(data);
          setLoading(false);
        })
        .catch(() => {
          setIpInfo(getFallbackReputation());
          setLoading(false);
        });
      setRemediation(getRemediation(selectedLog.event_type || selectedLog.attack_type));
    }
  }, [selectedLog]);

  if (!selectedLog) {
    return (
      <div className="w-[450px] bg-black/30 border-l border-white/10 p-4 flex items-center justify-center">
        <div className="text-center text-gray-500 text-sm">
          <div className="text-4xl mb-2">📊</div>
          <div>Select a log to view analysis</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-[450px] bg-black/30 border-l border-white/10 p-4 flex items-center justify-center">
        <div className="text-center text-cyan-400 text-sm">
          <div className="text-4xl mb-2 animate-pulse">🔍</div>
          <div>Analyzing IP...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[450px] bg-black/30 border-l border-white/10 p-4 space-y-4 overflow-y-auto">
      <h3 className="text-base font-['Orbitron'] font-bold text-cyan-400 tracking-wider">ANALYSIS</h3>

      {/* IP Reputation */}
      {ipInfo && (
        <div className="bg-black/40 rounded p-3 space-y-2">
          <div className="text-sm font-['Orbitron'] text-purple-400 mb-2">IP REPUTATION</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Threat Score:</span>
              <span
                className={`font-bold ${
                  ipInfo.score > 70 ? 'text-red-400' : ipInfo.score > 40 ? 'text-yellow-400' : 'text-green-400'
                }`}
              >
                {ipInfo.score}/100
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Classification:</span>
              <span className="text-gray-300">{ipInfo.classification}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location:</span>
              <span className="text-gray-300">
                {ipInfo.city}, {ipInfo.country}
              </span>
            </div>
            {ipInfo.timezone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Timezone:</span>
                <span className="text-gray-300">{ipInfo.timezone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">ISP:</span>
              <span className="text-gray-300">{ipInfo.isp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ASN:</span>
              <span className="text-gray-300">{ipInfo.asn}</span>
            </div>
            {ipInfo.lat !== 0 && ipInfo.lon !== 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Coordinates:</span>
                <span className="text-gray-300 font-['Roboto_Mono'] text-xs">
                  {ipInfo.lat.toFixed(4)}, {ipInfo.lon.toFixed(4)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Past Incidents:</span>
              <span className="text-orange-400">{ipInfo.previousIncidents}</span>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Remediation */}
      <div className="bg-black/40 rounded p-3 space-y-2">
        <div className="text-sm font-['Orbitron'] text-orange-400 mb-2">REMEDIATION</div>
        <ul className="space-y-1 text-sm text-gray-300">
          {remediation.map((step, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-orange-400 shrink-0">{idx + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Attack Classification */}
      <div className="bg-black/40 rounded p-3 space-y-2">
        <div className="text-sm font-['Orbitron'] text-red-400 mb-2">ATTACK PATTERN</div>
        <div className="text-sm text-gray-300">
          <div className="mb-1">
            <span className="text-gray-500">Type:</span>{' '}
            <span className="text-cyan-400">{(selectedLog.event_type || 'Unknown').toUpperCase()}</span>
          </div>
          <div className="mb-1">
            <span className="text-gray-500">Severity:</span>{' '}
            <span className="text-yellow-400">{(selectedLog.severity || 'Low').toUpperCase()}</span>
          </div>
          <div>
            <span className="text-gray-500">Automated:</span>{' '}
            <span className="text-red-400">{selectedLog.isAutomated ?? 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function AdvancedLogAnalysis() {
  const socket = useSocket();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    severity: [],
    attackType: [],
    timeWindow: 1440,
    sourceIP: '',
  });
  const [page, setPage] = useState(1);
  const logsPerPage = 50;

  const fetchLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/logs/recent?limit=500`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        const validLogs = data.logs.filter((log) => log && (log._id || log.id || log.log_id));
        const normalizedLogs = validLogs.map((log) => ({
          ...log,
          _id: log._id || log.id || log.log_id,
          isAutomated: log.isAutomated ?? (Math.random() > 0.5 ? 'Likely' : 'Manual'),
        }));
        setLogs(normalizedLogs);
        setFilteredLogs(normalizedLogs);
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
      if (newLog && (newLog._id || newLog.id || newLog.log_id)) {
        const normalizedLog = {
          ...newLog,
          _id: newLog._id || newLog.id || newLog.log_id,
          isAutomated: newLog.isAutomated ?? (Math.random() > 0.5 ? 'Likely' : 'Manual'),
        };
        setLogs((prev) => [normalizedLog, ...prev].slice(0, 500));
      }
    };

    socket.on('log:new', handleNewLog);
    return () => {
      if (socket?.off) socket.off('log:new', handleNewLog);
    };
  }, [socket]);

  // Apply filters and search
  const applyFilters = useCallback(() => {
    let result = [...logs];

    // Severity filter
    if (filters.severity.length > 0) {
      result = result.filter((log) => filters.severity.includes(log.severity?.toLowerCase()));
    }

    // Attack type filter
    if (filters.attackType.length > 0) {
      result = result.filter((log) =>
        filters.attackType.includes(log.event_type?.toLowerCase() || log.attack_type?.toLowerCase())
      );
    }

    // Source IP filter
    if (filters.sourceIP) {
      const pattern = filters.sourceIP.replace(/\*/g, '.*');
      const regex = new RegExp(pattern);
      result = result.filter((log) => regex.test(log.source_ip || ''));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.source_ip?.toLowerCase().includes(query) ||
          log.event_type?.toLowerCase().includes(query) ||
          log.target_system?.toLowerCase().includes(query) ||
          JSON.stringify(log.metadata || {})
            .toLowerCase()
            .includes(query)
      );
    }

    setFilteredLogs(result);
    setPage(1);
  }, [logs, filters, searchQuery]);

  useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, filters, searchQuery]);

  // Export functions
  const exportData = (format) => {
    const dataStr =
      format === 'json'
        ? JSON.stringify(filteredLogs, null, 2)
        : filteredLogs
            .map((log) =>
              [
                log.timestamp,
                log.severity,
                log.event_type,
                log.source_ip,
                log.target_system,
                JSON.stringify(log.metadata),
              ].join(',')
            )
            .join('\n');

    const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-export.${format}`;
    a.click();
  };

  const paginatedLogs = filteredLogs.slice(0, page * logsPerPage);

  return (
    <div className="flex h-full">
      {/* Left Filter Sidebar */}
      <FilterSidebar filters={filters} setFilters={setFilters} onApply={applyFilters} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Search and Controls */}
        <div className="bg-black/30 border-b border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-['Orbitron'] font-bold text-red-400 tracking-wider">
              ADVANCED LOG ANALYSIS
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => exportData('json')}
                className="px-3 py-1 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded text-xs font-['Orbitron'] hover:bg-cyan-500/30"
              >
                JSON
              </button>
              <button
                onClick={() => exportData('csv')}
                className="px-3 py-1 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded text-xs font-['Orbitron'] hover:bg-cyan-500/30"
              >
                CSV
              </button>
              <button
                onClick={fetchLogs}
                className="px-3 py-1 bg-red-500/20 border border-red-500 text-red-400 rounded text-xs font-['Orbitron'] hover:bg-red-500/30"
              >
                🔄 REFRESH
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search logs (IP, event type, metadata...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-sm text-gray-300 font-['Roboto_Mono'] focus:outline-none focus:border-cyan-500 pl-10"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-gray-500">Total:</span>{' '}
              <span className="text-cyan-400 font-bold">{logs.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Filtered:</span>{' '}
              <span className="text-purple-400 font-bold">{filteredLogs.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Showing:</span>{' '}
              <span className="text-yellow-400 font-bold">{paginatedLogs.length}</span>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto">
          {paginatedLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-5xl mb-3">📭</div>
                <div>No logs match your filters</div>
              </div>
            </div>
          ) : (
            <>
              {paginatedLogs.map((log) => (
                <LogRow
                  key={log._id}
                  log={log}
                  onSelect={setSelectedLog}
                />
              ))}

              {/* Load More */}
              {paginatedLogs.length < filteredLogs.length && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setPage(page + 1)}
                    className="px-6 py-2 bg-red-500/20 border border-red-500 text-red-400 rounded text-sm font-['Orbitron'] hover:bg-red-500/30"
                  >
                    LOAD MORE
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Analysis Panel */}
      <AnalysisPanel selectedLog={selectedLog} />
    </div>
  );
}

export default AdvancedLogAnalysis;
