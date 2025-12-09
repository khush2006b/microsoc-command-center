import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { API_BASE_URL } from '../config/api';

export default function CriticalAlertBanner() {
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    const fetchCriticalAlerts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/alerts/recent?severity=critical&limit=3`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const json = await res.json();
        if (json.success) {
          setCriticalAlerts(json.alerts || []);
        }
      } catch (err) {
        console.error('Error fetching critical alerts:', err);
      }
    };

    fetchCriticalAlerts();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleCritical = (alert) => {
      setCriticalAlerts(prev => [alert, ...prev].slice(0, 3));
    };

    socket.on('alert:critical', handleCritical);
    return () => {
      if (socket && socket.off) {
        socket.off('alert:critical', handleCritical);
      }
    };
  }, [socket]);

  if (criticalAlerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {criticalAlerts.map((alert) => (
        <div
          key={alert._id}
          className="bg-linear-to-r from-red-900 to-red-800 border-l-4 border-red-500 rounded-lg p-4 shadow-lg animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-100">🚨 CRITICAL ALERT</h3>
              <p className="text-red-200 mt-1">{alert.rule_name?.toUpperCase().replace(/_/g, ' ')}</p>
              <p className="text-red-300 text-sm mt-2">{alert.evidence?.description || 'Security threat detected'}</p>
              <p className="text-red-400 text-xs mt-2">
                Source: {alert.source_ip} → {alert.target_system}
              </p>
            </div>
            <div className="ml-4 text-right">
              <span className="inline-block bg-red-700 px-3 py-1 rounded-full text-red-100 text-sm font-semibold">
                {new Date(alert.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
