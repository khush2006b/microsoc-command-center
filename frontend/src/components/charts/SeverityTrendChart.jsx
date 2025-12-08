import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-lg">
        <p className="text-gray-100 text-sm">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color }} className="text-sm font-semibold">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SeverityTrendChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/logs/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const json = await res.json();
        
        if (json.success && json.stats?.time_series_7d) {
          const chartData = json.stats.time_series_7d.map(entry => ({
            date: entry._id || 'Unknown',
            count: entry.count || 0
          }));
          setData(chartData);
        }
      } catch (err) {
        console.error('Error fetching severity trend:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // Real-time update on new log
  useEffect(() => {
    if (!socket) return;
    
    const handleNewLog = () => {
      const token = localStorage.getItem('token');
      fetch('http://localhost:3000/api/logs/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data.time_series_7d) {
            const chartData = json.data.time_series_7d.map(entry => ({
              date: new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              critical: entry.severity.critical || 0,
              high: entry.severity.high || 0,
              medium: entry.severity.medium || 0,
              low: entry.severity.low || 0
            }));
            setData(chartData);
          }
        })
        .catch(err => console.error('Error updating severity trend:', err));
    };

    socket.on('log:new', handleNewLog);
    return () => {
      if (socket && socket.off) {
        socket.off('log:new', handleNewLog);
      }
    };
  }, [socket]);

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-gray-400">Loading chart...</div>;
  }

  return (
    <div className="w-full h-80 bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Severity Trend (7 Days)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#d1d5db' }} />
          <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="high" stroke="#ea580c" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="low" stroke="#84cc16" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
