/**
 * Command Navigation Bar - Ranger HQ Style
 * Premium sci-fi navigation with glow effects and tactical styling
 */

import React from 'react';

export function CommandNavBar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: '⚡ Dashboard', icon: '📊' },
    { id: 'logs', label: '🖥️ Live Logs', icon: '📝' },
    { id: 'alerts', label: '🚨 Alerts', icon: '⚠️' },
    { id: 'analytics', label: '📈 Analytics', icon: '📉' },
    { id: 'incidents', label: '🛡️ Incidents', icon: '🔥' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
  ];

  return (
    <nav className="command-navbar">
      <div className="flex items-center justify-between">
        {/* Left: Branding */}
        <div className="text-header-xl" style={{ color: '#ff2a2a' }}>
          ⚡ RANGER COMMAND
        </div>

        {/* Center: Tabs */}
        <div className="nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              title={tab.label}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" style={{
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
          }} />
          <span className="text-xs font-mono opacity-70 uppercase tracking-wide">
            System Online
          </span>
        </div>
      </div>
    </nav>
  );
}

export default CommandNavBar;
