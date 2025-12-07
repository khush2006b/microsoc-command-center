/**
 * Power Rangers Red Ranger / Morphin Grid Theme
 * High-tech command center aesthetic with neon glow effects
 */

export const rangerColors = {
  // Primary Ranger Colors
  rangerRed: '#D40000',
  morphinNeonRed: '#FF1744',
  energyOrange: '#FF6F00',
  technoBlue: '#2962FF',
  
  // Backgrounds
  deepBlack: '#0A0A0A',
  darkSteel: '#1C1C1C',
  panelDark: '#151515',
  
  // Accents
  gridGray: '#2D2D2D',
  neonWhite: '#F0F0F0',
  
  // Severity
  critical: '#FF1744',
  high: '#D40000',
  medium: '#FF6F00',
  low: '#2962FF',
  success: '#00E676',
  
  // Transparency variants
  rangerRedGlow: 'rgba(212, 0, 0, 0.3)',
  neonRedGlow: 'rgba(255, 23, 68, 0.2)',
};

export const rangerShadows = {
  // Neon glow effects
  glowRed: '0 0 20px rgba(212, 0, 0, 0.6), 0 0 40px rgba(255, 23, 68, 0.3)',
  glowRedIntense: '0 0 30px rgba(255, 23, 68, 0.8), 0 0 60px rgba(212, 0, 0, 0.5)',
  glowBlue: '0 0 20px rgba(41, 98, 255, 0.5), 0 0 40px rgba(41, 98, 255, 0.2)',
  glowOrange: '0 0 20px rgba(255, 111, 0, 0.5), 0 0 40px rgba(255, 111, 0, 0.2)',
  
  // Panel shadows
  panelShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
  panelGlowRed: 'inset 0 0 20px rgba(212, 0, 0, 0.1), 0 0 20px rgba(212, 0, 0, 0.3)',
  panelGlowBlue: 'inset 0 0 20px rgba(41, 98, 255, 0.1), 0 0 20px rgba(41, 98, 255, 0.2)',
  
  // Border glow
  borderGlowRed: '0 0 10px rgba(212, 0, 0, 0.6), inset 0 0 10px rgba(212, 0, 0, 0.2)',
};

export const rangerFonts = {
  header: "'Orbitron', 'Space Mono', monospace",
  body: "'Exo 2', sans-serif",
  mono: "'Roboto Mono', monospace",
};

export const rangerGradients = {
  redPulse: 'linear-gradient(135deg, #D40000 0%, #FF1744 50%, #D40000 100%)',
  orangePulse: 'linear-gradient(135deg, #FF6F00 0%, #FFA726 50%, #FF6F00 100%)',
  bluePulse: 'linear-gradient(135deg, #2962FF 0%, #5E35B1 50%, #2962FF 100%)',
  
  darkPanel: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(28, 28, 28, 0.95) 100%)',
  hoverGlow: 'linear-gradient(135deg, rgba(212, 0, 0, 0.15) 0%, rgba(255, 23, 68, 0.05) 100%)',
};

export const rangerConfig = {
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

export default {
  colors: rangerColors,
  shadows: rangerShadows,
  fonts: rangerFonts,
  gradients: rangerGradients,
  config: rangerConfig,
};
