import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  PlayIcon,
  StopIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BoltIcon,
  GlobeAltIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api`;

const SCENARIOS = {
  random: { name: 'Random Attack Mix', icon: '🎲', color: 'cyan' },
  sql_burst: { name: 'SQL Injection Burst', icon: '💉', color: 'red' },
  brute_force_wave: { name: 'Brute Force Wave', icon: '🔨', color: 'orange' },
  port_scan_sweep: { name: 'Port Scan Sweep', icon: '🔍', color: 'blue' },
  xss_spray: { name: 'XSS Spray', icon: '⚡', color: 'yellow' },
  kill_chain: { name: 'Multi-Stage Kill Chain', icon: '⛓️', color: 'purple' },
  data_exfil: { name: 'Data Exfiltration Attempt', icon: '📤', color: 'pink' }
};

const AttackSimulator = () => {
  const [scenario, setScenario] = useState('random');
  const [frequency, setFrequency] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({
    totalLogs: 0,
    logsPerSecond: 0,
    logsPerMinute: 0,
    uniqueIPs: [],
    currentStage: 0,
    recentLogs: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch status periodically
  const fetchStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/simulator/status`);
      if (response.data.success) {
        setIsRunning(response.data.state.running);
        setStats(response.data.stats);
        if (response.data.state.scenario) {
          setScenario(response.data.state.scenario);
        }
        if (response.data.state.frequency) {
          setFrequency(response.data.state.frequency);
        }
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/simulator/start`, {
        scenario,
        frequency
      });
      if (response.data.success) {
        setIsRunning(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start simulator');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/simulator/stop`);
      if (response.data.success) {
        setIsRunning(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to stop simulator');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = async (newScenario, newFrequency) => {
    try {
      await axios.post(`${API_BASE}/simulator/config`, {
        scenario: newScenario !== undefined ? newScenario : scenario,
        frequency: newFrequency !== undefined ? newFrequency : frequency
      });
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'text-red-400 bg-red-900/20 border-red-500',
      high: 'text-orange-400 bg-orange-900/20 border-orange-500',
      medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-500',
      low: 'text-blue-400 bg-blue-900/20 border-blue-500'
    };
    return colors[severity] || colors.medium;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-y-auto">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 pb-16 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2 font-['Orbitron']">
                ATTACK SIMULATOR
              </h1>
              <p className="text-gray-400 text-lg">Real-time threat generation engine for SOC testing</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-lg border ${isRunning ? 'bg-green-900/20 border-green-500' : 'bg-gray-800/50 border-gray-700'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span className={`font-semibold ${isRunning ? 'text-green-400' : 'text-gray-400'}`}>
                    {isRunning ? 'ACTIVE' : 'STOPPED'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Scenario Selector */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-6 shadow-lg shadow-cyan-500/10">
            <div className="flex items-center gap-2 mb-4">
              <Cog6ToothIcon className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-cyan-400">Attack Scenario</h2>
            </div>
            <select
              value={scenario}
              onChange={(e) => {
                setScenario(e.target.value);
                if (isRunning) handleConfigUpdate(e.target.value, undefined);
              }}
              disabled={loading}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
            >
              {Object.entries(SCENARIOS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.name}
                </option>
              ))}
            </select>
            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Selected: <span className="text-cyan-400 font-semibold">{SCENARIOS[scenario]?.name}</span>
              </p>
            </div>
          </div>

          {/* Frequency Slider */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-orange-500/30 p-6 shadow-lg shadow-orange-500/10">
            <div className="flex items-center gap-2 mb-4">
              <BoltIcon className="w-6 h-6 text-orange-400" />
              <h2 className="text-xl font-bold text-orange-400">Attack Frequency</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Logs/Second:</span>
                <span className="text-3xl font-bold text-orange-400">{frequency}</span>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                value={frequency}
                onChange={(e) => {
                  const newFreq = parseInt(e.target.value);
                  setFrequency(newFreq);
                  if (isRunning) handleConfigUpdate(undefined, newFreq);
                }}
                disabled={loading}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, #fb923c 0%, #fb923c ${(frequency / 200) * 100}%, #374151 ${(frequency / 200) * 100}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1/s</span>
                <span>50/s</span>
                <span>100/s</span>
                <span>200/s</span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6 shadow-lg shadow-purple-500/10">
            <div className="flex items-center gap-2 mb-4">
              <FireIcon className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-purple-400">Controls</h2>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleStart}
                disabled={isRunning || loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-700 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon className="w-6 h-6" />
                {loading ? 'STARTING...' : 'START ATTACK'}
              </button>
              <button
                onClick={handleStop}
                disabled={!isRunning || loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-gray-700 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <StopIcon className="w-6 h-6" />
                {loading ? 'STOPPING...' : 'STOP ATTACK'}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/10 border border-cyan-500/30 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon className="w-5 h-5 text-cyan-400" />
              <p className="text-cyan-400 text-sm font-semibold">LOGS/SEC</p>
            </div>
            <p className="text-3xl font-bold text-white">{Math.round(stats.logsPerSecond || 0)}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border border-blue-500/30 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="w-5 h-5 text-blue-400" />
              <p className="text-blue-400 text-sm font-semibold">LOGS/MIN</p>
            </div>
            <p className="text-3xl font-bold text-white">{Math.round(stats.logsPerMinute || 0)}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border border-purple-500/30 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <GlobeAltIcon className="w-5 h-5 text-purple-400" />
              <p className="text-purple-400 text-sm font-semibold">UNIQUE IPs</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.uniqueIPs?.length || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 border border-orange-500/30 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <BoltIcon className="w-5 h-5 text-orange-400" />
              <p className="text-orange-400 text-sm font-semibold">STAGE</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.currentStage || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 border border-green-500/30 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <FireIcon className="w-5 h-5 text-green-400" />
              <p className="text-green-400 text-sm font-semibold">TOTAL LOGS</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalLogs || 0}</p>
          </div>
        </div>

        {/* Live Attack Feed */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-red-500/30 p-6 shadow-lg shadow-red-500/10">
          <div className="flex items-center gap-2 mb-4">
            <FireIcon className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-red-400">Live Attack Feed</h2>
            <span className="ml-auto text-sm text-gray-500">Last 20 attacks</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
            {stats.recentLogs && stats.recentLogs.length > 0 ? (
              stats.recentLogs.map((log, index) => (
                <div
                  key={index}
                  className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${getSeverityColor(log.severity)}`}>
                          {log.severity?.toUpperCase()}
                        </span>
                        <span className="text-cyan-400 font-semibold">{log.attack_type?.replace('_', ' ').toUpperCase()}</span>
                        <span className="text-gray-500 text-sm">{formatTimestamp(log.timestamp)}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Source:</span>
                          <span className="text-orange-400 font-mono ml-2">{log.source_ip}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Target:</span>
                          <span className="text-blue-400 ml-2">{log.target_system}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Method:</span>
                          <span className="text-purple-400 ml-2">{log.metadata?.http_method}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-500 text-sm">Payload:</span>
                        <code className="block mt-1 text-xs text-red-400 bg-black/30 p-2 rounded border border-red-900/30 font-mono truncate">
                          {log.payload}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FireIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No attacks generated yet</p>
                <p className="text-gray-600 text-sm mt-2">Start the simulator to see live attack data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.8);
        }
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fb923c;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(251, 146, 60, 0.5);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fb923c;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(251, 146, 60, 0.5);
        }
      `}</style>
    </div>
  );
};

export default AttackSimulator;
