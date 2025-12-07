/**
 * FuturisticDropdown Component
 * Translucent holographic dropdown with neon accents
 */

import React from 'react';

export const FuturisticDropdown = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select...',
  className = '',
  label = null
}) => {
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs text-gray-400 mb-1.5 font-['Exo_2'] tracking-wide uppercase">
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="
            w-full px-4 py-2.5 text-sm
            bg-black/30 backdrop-blur-md
            border border-cyan-500/30
            text-cyan-100
            rounded-lg
            font-['Roboto_Mono']
            appearance-none
            cursor-pointer
            transition-all duration-300
            hover:border-cyan-400/50
            hover:bg-black/40
            focus:outline-none
            focus:border-cyan-400
            focus:shadow-[0_0_20px_rgba(6,182,212,0.4)]
            shadow-[0_0_10px_rgba(6,182,212,0.2)]
          "
        >
          <option value="" className="bg-gray-900 text-gray-300">
            {placeholder}
          </option>
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              className="bg-gray-900 text-gray-200 py-2"
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
          <svg 
            className="w-4 h-4 text-cyan-400 shrink-0" 
            fill="none" 
            strokeWidth="2" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ minWidth: '16px', maxWidth: '16px', minHeight: '16px', maxHeight: '16px' }}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FuturisticDropdown;
