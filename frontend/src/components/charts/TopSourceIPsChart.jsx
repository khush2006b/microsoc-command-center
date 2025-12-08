import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-lg">
        <p className="text-gray-100 font-semibold text-sm">{payload[0].payload.ip}</p>
        <p className="text-red-400">{payload[0].value} logs</p>
      </div>
    );
  }
  return null;
};

export default function TopSourceIPsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
        
        if (json.success && json.stats?.top_source_ips) {
          const chartData = json.stats.top_source_ips.slice(0, 10).map(({ _id, count }) => ({
            ip: _id.length > 15 ? _id.substring(0, 12) + '...' : _id,
            fullIp: _id,
            count
          }));
          setData(chartData);
        }
      } catch (err) {
        console.error('Error fetching top IPs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 45000); // Refresh every 45s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-gray-400">Loading chart...</div>;
  }

  return (
    <div className="w-full h-80 bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Top 10 Source IPs</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="ip" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
