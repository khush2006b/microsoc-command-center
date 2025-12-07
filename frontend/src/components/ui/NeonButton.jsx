/**
 * NeonButton Component
 * Futuristic glowing button with sci-fi aesthetics
 */

import React from 'react';

export const NeonButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  className = '',
  icon = null
}) => {
  const baseStyles = `
    relative overflow-hidden
    font-['Orbitron'] font-semibold tracking-wider
    backdrop-blur-md
    transition-all duration-300 ease-out
    border
    flex items-center justify-center gap-2
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
  `;

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-red-600/20 to-red-500/10
      border-red-500/50
      text-red-300
      shadow-[0_0_15px_rgba(239,68,68,0.3)]
      hover:border-red-400
      hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]
      hover:bg-gradient-to-r hover:from-red-600/30 hover:to-red-500/20
    `,
    secondary: `
      bg-gradient-to-r from-blue-600/20 to-blue-500/10
      border-blue-500/50
      text-blue-300
      shadow-[0_0_15px_rgba(59,130,246,0.3)]
      hover:border-blue-400
      hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]
      hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-blue-500/20
    `,
    success: `
      bg-gradient-to-r from-green-600/20 to-green-500/10
      border-green-500/50
      text-green-300
      shadow-[0_0_15px_rgba(34,197,94,0.3)]
      hover:border-green-400
      hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]
      hover:bg-gradient-to-r hover:from-green-600/30 hover:to-green-500/20
    `,
    ghost: `
      bg-black/20
      border-gray-500/30
      text-gray-300
      shadow-[0_0_10px_rgba(156,163,175,0.2)]
      hover:border-gray-400/50
      hover:shadow-[0_0_20px_rgba(156,163,175,0.4)]
      hover:bg-black/30
    `
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {/* Animated glow effect */}
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent 
                      -translate-x-full hover:translate-x-full transition-transform duration-1000" />
      
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10 uppercase">{children}</span>
    </button>
  );
};

export default NeonButton;
