/**
 * HologramCard Component
 * Translucent holographic panel with thin neon borders
 */

import React from 'react';

export const HologramCard = ({ 
  children, 
  className = '', 
  glowColor = 'red',
  variant = 'default',
  title = null,
  icon = null,
  noPadding = false
}) => {
  const glowColors = {
    red: 'border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.08)] hover:border-red-400/40 hover:shadow-[0_0_16px_rgba(239,68,68,0.12)]',
    blue: 'border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.08)] hover:border-blue-400/40 hover:shadow-[0_0_16px_rgba(59,130,246,0.12)]',
    cyan: 'border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.08)] hover:border-cyan-400/40 hover:shadow-[0_0_16px_rgba(6,182,212,0.12)]',
    green: 'border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.08)] hover:border-green-400/40 hover:shadow-[0_0_16px_rgba(34,197,94,0.12)]',
    yellow: 'border-yellow-500/30 shadow-[0_0_12px_rgba(234,179,8,0.08)] hover:border-yellow-400/40 hover:shadow-[0_0_16px_rgba(234,179,8,0.12)]',
    purple: 'border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.08)] hover:border-purple-400/40 hover:shadow-[0_0_16px_rgba(168,85,247,0.12)]'
  };

  const variants = {
    default: 'bg-black/30',
    glass: 'bg-gradient-to-br from-black/20 via-black/30 to-black/40',
    solid: 'bg-black/50'
  };

  return (
    <div className={`
      relative
      ${variants[variant]}
      backdrop-blur-md
      rounded-xl
      border
      ${glowColors[glowColor] || glowColors.red}
      transition-all duration-300
      ${noPadding ? '' : 'p-6'}
      ${className}
    `}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current opacity-40" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current opacity-40" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current opacity-40" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current opacity-40" />

      {title && (
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
          {icon && <span className="text-xl">{icon}</span>}
          <h3 className="font-['Orbitron'] text-sm font-bold tracking-wider uppercase text-gray-200">
            {title}
          </h3>
        </div>
      )}

      {children}
    </div>
  );
};

export default HologramCard;
