import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

// Connect to Backend Socket
const socket = io('http://localhost:3000');

const Dashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, critical: 0 });
  const [topIps, setTopIps] = useState([]);

  // Fetch Initial Data
  const fetchData = async () => {
    try {
      const incRes = await axios.get('http://localhost:3000/api/incidents');
      const statRes = await axios.get('http://localhost:3000/api/dashboard/stats');
      const ipRes = await axios.get('http://localhost:3000/api/dashboard/top-ip');

      setIncidents(incRes.data);
      setStats(statRes.data);
      setTopIps(ipRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData();

    // --- SOCKET EVENT LISTENERS (Real-time magic) ---
    
    // 1. New Attack Detection
    socket.on('newIncident', (newIncident) => {
      console.log("⚠️ New Alert:", newIncident);
      setIncidents((prev) => [newIncident, ...prev]);
    });

    // 2. Incident Update (Assignment or Status Change)
    socket.on('incidentUpdated', (updatedIncident) => {
      setIncidents((prev) => 
        prev.map((inc) => (inc._id === updatedIncident._id ? updatedIncident : inc))
      );
    });

    // 3. Stats Refresh Trigger
    socket.on('dashboardStatsUpdate', () => {
      // Re-fetch aggregate stats when something changes
      axios.get('http://localhost:3000/api/dashboard/stats')
           .then(res => setStats(res.data));
           
      axios.get('http://localhost:3000/api/dashboard/top-ip')
           .then(res => setTopIps(res.data));
    });

    return () => {
      socket.off('newIncident');
      socket.off('incidentUpdated');
      socket.off('dashboardStatsUpdate');
    };
  }, []);

  // --- ACTIONS ---

  const assignAnalyst = async (id) => {
    const analystName = prompt("Enter Analyst Name (e.g., Blue Ranger):");
    if (analystName) {
      await axios.put(`http://localhost:3000/api/incidents/${id}/assign`, { analystName });
    }
  };

  const updateStatus = async (id, status) => {
    await axios.put(`http://localhost:3000/api/incidents/${id}/status`, { status });
  };

  const simulateAttack = async () => {
    await axios.post('http://localhost:3000/api/simulate/attack');
  };

  // --- RENDER (NO UI/CSS as requested) ---
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔴 Red Ranger's MicroSOC Command Center</h1>
      
      <button onClick={simulateAttack}>⚠️ SIMULATE CYBER KAIJU ATTACK</button>

      <hr />

      {/* DASHBOARD STATS WIDGET */}
      <h3>📊 Dashboard Statistics</h3>
      <ul>
        <li>Total Incidents: {stats.total}</li>
        <li>Active (Open): {stats.open}</li>
        <li>Critical Threats: {stats.critical}</li>
        <li>Resolved: {stats.resolved}</li>
      </ul>

      <hr />

      {/* TOP ATTACKERS WIDGET */}
      <h3>🌍 Top Attacker IPs</h3>
      <table border="1">
        <thead>
          <tr><th>IP Address</th><th>Attack Count</th></tr>
        </thead>
        <tbody>
          {topIps.map(ip => (
            <tr key={ip._id}>
              <td>{ip._id}</td>
              <td>{ip.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      {/* INCIDENT LIST / ANALYST WORKLOAD */}
      <h3>📝 Live Incident Feed & Management</h3>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Severity</th>
            <th>Source IP</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc) => (
            <tr key={inc._id}>
              <td>{new Date(inc.timestamp).toLocaleTimeString()}</td>
              <td>{inc.type}</td>
              <td style={{ color: inc.severity === 'Critical' ? 'red' : 'black' }}>
                {inc.severity}
              </td>
              <td>{inc.sourceIP}</td>
              <td>{inc.status}</td>
              <td>{inc.assignedTo || "Unassigned"}</td>
              <td>
                {inc.status === 'Open' && (
                  <button onClick={() => assignAnalyst(inc._id)}>Assign Me</button>
                )}
                {inc.status === 'In Progress' && (
                  <button onClick={() => updateStatus(inc._id, 'Resolved')}>Resolve</button>
                )}
                {inc.status === 'Resolved' && "✅"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;