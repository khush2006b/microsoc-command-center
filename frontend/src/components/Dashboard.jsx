import React, { useState, useEffect } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import CriticalAlertBanner from './CriticalAlertBanner';
import LogsTable from './LogsTable';
import AlertsTable from './AlertsTable';
import AttackTypeChart from './Charts/AttackTypeChart';
import SeverityTrendChart from './Charts/SeverityTrendChart';
import TopSourceIPsChart from './Charts/TopSourceIPsChart';
import AlertsSeverityChart from './Charts/AlertsSeverityChart';
import { useSocket } from '../hooks/useSocket';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalLogs: 0,
    totalAlerts: 0,
    criticalAlerts: 0,
    resolutionRate: 0
  });
  const socket = useSocket();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [logsRes, alertsRes] = await Promise.all([
          fetch('http://localhost:3000/api/logs/stats'),
          fetch('http://localhost:3000/api/alerts/stats')
        ]);

        const logsData = await logsRes.json();
        const alertsData = await alertsRes.json();

        if (logsData.success && alertsData.success) {
          setStats({
            totalLogs: logsData.stats?.total_logs || 0,
            totalAlerts: alertsData.stats?.total_alerts || 0,
            criticalAlerts: alertsData.stats?.severity_distribution?.critical || 0,
            resolutionRate: alertsData.stats?.resolution_rate || 0
          });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, []);

  // Real-time stat updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      // Refetch stats on any new log or alert
      fetch('http://localhost:3000/api/logs/stats')
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setStats(prev => ({ ...prev, totalLogs: data.stats?.total_logs || 0 }));
          }
        });

      fetch('http://localhost:3000/api/alerts/stats')
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setStats(prev => ({
              ...prev,
              totalAlerts: data.stats?.total_alerts || 0,
              criticalAlerts: data.stats?.severity_distribution?.critical || 0,
              resolutionRate: data.stats?.resolution_rate || 0
            }));
          }
        });
    };

    socket.on('log:new', handleUpdate);
    socket.on('alert:new', handleUpdate);
    socket.on('alert:critical', handleUpdate);

    return () => {
      if (socket && socket.off) {
        socket.off('log:new', handleUpdate);
        socket.off('alert:new', handleUpdate);
        socket.off('alert:critical', handleUpdate);
      }
    };
  }, [socket]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-700 bg-gray-900 bg-opacity-95 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-400 hover:text-gray-200"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold gradient-text">Cyber Security SOC</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${socket?.isConnected ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                {socket?.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Critical Alert Banner */}
          <CriticalAlertBanner />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Logs</p>
                  <p className="text-3xl font-bold text-gray-100 mt-2">{stats.totalLogs.toLocaleString()}</p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Alerts</p>
                  <p className="text-3xl font-bold text-gray-100 mt-2">{stats.totalAlerts.toLocaleString()}</p>
                </div>
                <div className="text-4xl">🚨</div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Critical Alerts</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{stats.criticalAlerts}</p>
                </div>
                <div className="text-4xl">⚠️</div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Resolution Rate</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">{(stats.resolutionRate * 100).toFixed(1)}%</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttackTypeChart />
            <AlertsSeverityChart />
            <SeverityTrendChart />
            <TopSourceIPsChart />
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <LogsTable limit={10} />
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <AlertsTable limit={10} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}