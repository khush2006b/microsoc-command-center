// frontend/src/components/incidents/CreateIncidentModal.jsx
// Modal for creating new incidents manually

import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function CreateIncidentModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    attack_type: 'other',
    metadata: {
      src_ip: '',
      dest_system: ''
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/incidents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          creation_type: 'manual'
        })
      });
      const data = await res.json();

      if (data.success) {
        onSuccess(data.incident);
        onClose();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black border-2 border-red-500 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-['Orbitron'] font-bold text-red-400 mb-6">CREATE NEW INCIDENT</h2>

        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500 rounded p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">TITLE *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-red-500"
              placeholder="Brief incident description"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">DESCRIPTION</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-red-500 min-h-24"
              placeholder="Detailed incident description and context"
            />
          </div>

          {/* Severity & Attack Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">SEVERITY</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-red-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">ATTACK TYPE</label>
              <select
                value={formData.attack_type}
                onChange={(e) => setFormData({ ...formData, attack_type: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-red-500"
              >
                <option value="sql_injection">SQL Injection</option>
                <option value="xss">XSS</option>
                <option value="brute_force">Brute Force</option>
                <option value="port_scan">Port Scan</option>
                <option value="data_exfiltration">Data Exfiltration</option>
                <option value="ddos">DDoS</option>
                <option value="malware">Malware</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">SOURCE IP</label>
              <input
                type="text"
                value={formData.metadata.src_ip}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, src_ip: e.target.value }
                })}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-gray-300 font-['Roboto_Mono'] focus:outline-none focus:border-red-500"
                placeholder="192.168.1.1"
              />
            </div>

            <div>
              <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">TARGET SYSTEM</label>
              <input
                type="text"
                value={formData.metadata.dest_system}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, dest_system: e.target.value }
                })}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-red-500"
                placeholder="web-server-01"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500 text-red-400 rounded font-['Orbitron'] font-bold tracking-wider hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {submitting ? 'CREATING...' : 'CREATE INCIDENT'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-gray-600/20 border border-gray-500 text-gray-400 rounded font-['Orbitron'] disabled:opacity-50"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
