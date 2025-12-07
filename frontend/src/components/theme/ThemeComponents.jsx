import React from 'react';
import { rangerColors, rangerShadows } from '../../theme/rangerTheme';
import '../../theme/rangerTheme.css';

export function SeverityBadge({ severity = 'low', text = null, pulse = false }) {
  const getSeverityConfig = (sev) => {
    const configs = {
      critical: { color: '#FF1744', label: 'CRITICAL' },
      high: { color: '#D40000', label: 'HIGH' },
      medium: { color: '#FF6F00', label: 'MEDIUM' },
      low: { color: '#2962FF', label: 'LOW' },
    };
    return configs[sev?.toLowerCase()] || configs.low;
  };

  const config = getSeverityConfig(severity);
  const className = `badge badge-${severity?.toLowerCase() || 'low'} ${pulse ? 'animate-glow-pulse' : ''}`;

  return (
    <span className={className} title={config.label}>
      {text || config.label}
    </span>
  );
}

export function SeverityIndicator({ severity = 'low', animated = false }) {
  const className = `severity-indicator ${severity?.toLowerCase() || 'low'} ${
    animated && severity?.toLowerCase() === 'critical' ? 'animate-glow-pulse' : ''
  }`;

  return <div className={className} />;
}

export function GlowButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  glow = true,
  onClick,
  disabled = false,
  className = ''
}) {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-6 py-2 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  const baseClass = `btn btn-${variant} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={baseClass}
      onClick={onClick}
      disabled={disabled}
      style={{
        boxShadow: variant === 'primary' && glow ? rangerShadows.glowRed : undefined,
      }}
    >
      {children}
    </button>
  );
}

export function HologramCard({ 
  children, 
  title = null, 
  glow = 'red', 
  animated = false,
  className = ''
}) {
  const glowClass = glow ? `panel-glow-${glow}` : '';
  const animClass = animated ? 'animate-hologram' : '';

  return (
    <div className={`panel hologram-tile ${glowClass} ${animClass} ${className}`}>
      {title && (
        <div className="text-header px-4 py-3 border-b border-gray-700 text-sm tracking-wide">
          {title}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

export function StatCard({ 
  label, 
  value, 
  unit = '', 
  trend = null, 
  icon = null,
  color = 'red',
  animated = false
}) {
  const colorMap = {
    red: { text: rangerColors.morphinNeonRed, glow: rangerShadows.glowRed },
    blue: { text: rangerColors.technoBlue, glow: rangerShadows.glowBlue },
    orange: { text: rangerColors.energyOrange, glow: rangerShadows.glowOrange },
  };

  const config = colorMap[color] || colorMap.red;

  return (
    <HologramCard glow={color} animated={animated}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs opacity-70 uppercase tracking-wider">{label}</div>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="text-3xl font-bold text-header" style={{ color: config.text }}>
        {value}
        {unit && <span className="text-sm ml-1 opacity-70">{unit}</span>}
      </div>
      {trend && (
        <div className="text-xs mt-2 opacity-75">
          {trend > 0 ? '📈' : '📉'} {Math.abs(trend)}% this hour
        </div>
      )}
    </HologramCard>
  );
}

export function TechDivider({ color = 'red', animated = false }) {
  const colorMap = {
    red: rangerColors.rangerRed,
    blue: rangerColors.technoBlue,
    orange: rangerColors.energyOrange,
  };

  return (
    <div
      style={{
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${colorMap[color] || colorMap.red}, transparent)`,
        boxShadow: `0 0 10px ${colorMap[color] || colorMap.red}`,
        margin: '16px 0',
      }}
      className={animated ? 'animate-glow-pulse' : ''}
    />
  );
}

export function TechTag({ children, variant = 'default', removable = false, onRemove = null }) {
  const variantClasses = {
    default: 'bg-gray-700 text-gray-100',
    critical: 'bg-red-900 text-red-200 border border-red-600',
    mitre: 'bg-blue-900 text-blue-200 border border-blue-600',
    success: 'bg-green-900 text-green-200 border border-green-600',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono ${variantClasses[variant]}`}>
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-white transition-colors"
          title="Remove"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function AlertBanner({ 
  severity = 'critical', 
  title = 'Alert', 
  message = '', 
  icon = '⚠️',
  onClose = null,
  animated = true
}) {
  const severityColors = {
    critical: { bg: 'rgba(255, 23, 68, 0.1)', border: '#FF1744' },
    high: { bg: 'rgba(212, 0, 0, 0.1)', border: '#D40000' },
    medium: { bg: 'rgba(255, 111, 0, 0.1)', border: '#FF6F00' },
  };

  const config = severityColors[severity] || severityColors.critical;

  return (
    <div
      className={`p-4 rounded-lg border-l-4 flex items-start gap-3 ${animated ? 'animate-slide-in-top' : ''}`}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        boxShadow: `inset 0 0 10px ${config.border}`,
      }}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="font-bold text-sm text-header">{title}</div>
        {message && <div className="text-xs mt-1 opacity-80">{message}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg opacity-60 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function StatusDot({ status = 'active', label = '' }) {
  const statusColors = {
    active: '#00E676',
    warning: '#FF6F00',
    critical: '#FF1744',
    offline: '#9E9E9E',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={status === 'active' ? 'animate-glow-pulse' : ''}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColors[status] || statusColors.offline,
          boxShadow: `0 0 10px ${statusColors[status] || statusColors.offline}`,
        }}
      />
      {label && <span className="text-xs opacity-70">{label}</span>}
    </div>
  );
}

export function RangerThemeProvider({ children }) {
  return (
    <div style={{ background: rangerColors.deepBlack, color: rangerColors.neonWhite }}>
      {children}
      <div className="morphin-grid-background" />
    </div>
  );
}

export default {
  SeverityBadge,
  SeverityIndicator,
  GlowButton,
  HologramCard,
  StatCard,
  TechDivider,
  TechTag,
  AlertBanner,
  StatusDot,
  RangerThemeProvider,
};
