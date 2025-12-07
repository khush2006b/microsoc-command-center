import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useSocket } from '../../hooks/useSocket';

const COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#eab308',
  low: '#84cc16',
  resolved: '#10b981'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-lg">
        <p className="text-gray-100 font-semibold">{payload[0].name}</p>
        <p className="text-blue-400">{payload[0].value} alerts</p>
        <p className="text-gray-400 text-sm">{((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export default function AlertsSeverityChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/alerts/stats');
      const json = await res.json();
      
      if (json.success && json.stats?.severity_distribution) {
        const total = Object.values(json.stats.severity_distribution).reduce((a, b) => a + b, 0);
        const chartData = Object.entries(json.stats.severity_distribution)
          .map(([severity, value]) => ({
            name: severity.charAt(0).toUpperCase() + severity.slice(1),
            value,
            total
          }))
          .sort((a, b) => {
            const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
            return (order[a.name] || 4) - (order[b.name] || 4);
          });
        setData(chartData);
      }
    } catch (err) {
      console.error('Error fetching alerts stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time update on new alert
  useEffect(() => {
    if (!socket) return;
    
    const handleNewAlert = () => {
      fetchStats();
    };

    socket.on('alert:new', handleNewAlert);
    socket.on('alert:critical', handleNewAlert);
    return () => {
      if (socket && socket.off) {
        socket.off('alert:new', handleNewAlert);
        socket.off('alert:critical', handleNewAlert);
      }
    };
  }, [socket]);

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-gray-400">Loading chart...</div>;
  }

  return (
    <div className="w-full h-80 bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Alerts by Severity</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()] || '#666'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px', color: '#d1d5db' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
