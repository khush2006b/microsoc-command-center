/**
 * Ranger Theme Navigation Sidebar
 * Vertical neon-red glow strip with Ranger aesthetics
 */

import React, { useState } from 'react';
import { rangerColors, rangerShadows } from '../../theme/rangerTheme';

const navItems = [
  { icon: '⚡', label: 'Dashboard', id: 'dashboard' },
  { icon: '📝', label: 'Logs', id: 'logs' },
  { icon: '🚨', label: 'Alerts', id: 'alerts' },
  { icon: '🛡️', label: 'Incidents', id: 'incidents' },
  { icon: '📊', label: 'Analytics', id: 'analytics' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
];

export function RangerSidebar({ activeTab = 'dashboard', onTabChange = () => {} }) {
  const [hoveredTab, setHoveredTab] = useState(null);

  return (
    <div
      className="flex flex-col items-center gap-4 py-6 px-4"
      style={{
        background: `linear-gradient(180deg, ${rangerColors.panelDark} 0%, ${rangerColors.deepBlack} 100%)`,
        borderRight: `3px solid ${rangerColors.rangerRed}`,
        boxShadow: `inset -10px 0 20px rgba(212, 0, 0, 0.1), ${rangerShadows.glowRed}`,
        minWidth: '80px',
      }}
    >
      {/* Ranger Helmet Icon */}
      <div
        className="mb-4 animate-glow-pulse"
        style={{
          fontSize: '32px',
          filter: 'drop-shadow(0 0 10px rgba(212, 0, 0, 0.6))',
        }}
        title="Morphin Grid"
      >
        🤖
      </div>

      {/* Navigation Items */}
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          onMouseEnter={() => setHoveredTab(item.id)}
          onMouseLeave={() => setHoveredTab(null)}
          className="relative group flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-300"
          style={{
            background:
              activeTab === item.id
                ? `linear-gradient(135deg, ${rangerColors.rangerRed}, ${rangerColors.morphinNeonRed})`
                : hoveredTab === item.id
                ? `rgba(212, 0, 0, 0.15)`
                : 'transparent',
            boxShadow:
              activeTab === item.id
                ? rangerShadows.glowRed
                : hoveredTab === item.id
                ? `0 0 15px rgba(212, 0, 0, 0.4)`
                : 'none',
            border: `1px solid ${activeTab === item.id ? rangerColors.morphinNeonRed : 'transparent'}`,
          }}
          title={item.label}
        >
          <span className="text-xl">{item.icon}</span>

          {/* Hover Label */}
          <div
            className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-header whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
            style={{
              background: rangerColors.panelDark,
              border: `1px solid ${rangerColors.rangerRed}`,
              boxShadow: rangerShadows.glowRed,
              transition: 'opacity 150ms',
            }}
          >
            {item.label}
          </div>

          {/* Active Indicator */}
          {activeTab === item.id && (
            <div
              className="absolute -right-1 w-1 h-6 rounded-full animate-glow-pulse"
              style={{
                background: rangerColors.morphinNeonRed,
                boxShadow: rangerShadows.glowRed,
              }}
            />
          )}
        </button>
      ))}

      {/* Bottom Separator */}
      <div
        className="my-4 w-full h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${rangerColors.rangerRed}, transparent)`,
          boxShadow: rangerShadows.glowRed,
        }}
      />

      {/* System Status */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center animate-glow-pulse"
          style={{
            background: `rgba(0, 230, 118, 0.2)`,
            border: `1px solid #00E676`,
            boxShadow: '0 0 10px rgba(0, 230, 118, 0.5)',
            fontSize: '12px',
          }}
          title="System Online"
        >
          ✓
        </div>
        <div className="text-xs opacity-50 text-header">ONLINE</div>
      </div>
    </div>
  );
}

export default RangerSidebar;
