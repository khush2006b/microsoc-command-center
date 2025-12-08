import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const COLORS = {
  brute_force: '#dc2626',
  port_scan: '#ea580c',
  sql_injection: '#ca8a04',
  xss: '#7c3aed',
  data_exfiltration: '#06b6d4',
  anomaly: '#06b6d4',
  multi_stage: '#f97316'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-lg">
        <p className="text-gray-100 font-semibold">{payload[0].name}</p>
        <p className="text-blue-400">{payload[0].value} logs</p>
        <p className="text-gray-400 text-sm">{((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export default function AttackTypeChart() {
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
        
        if (json.success && json.stats?.attack_type_distribution) {
          const total = Object.values(json.stats.attack_type_distribution).reduce((a, b) => a + b, 0);
          const chartData = Object.entries(json.stats.attack_type_distribution).map(([name, value]) => ({
            name: name.replace(/_/g, ' ').toUpperCase(),
            value,
            total
          }));
          setData(chartData);
        }
      } catch (err) {
        console.error('Error fetching attack stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-gray-400">Loading chart...</div>;
  }

  return (
    <div className="w-full h-80 bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Attack Type Distribution</h3>
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
              <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase().replace(/ /g, '_')] || '#666'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px', color: '#d1d5db' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
