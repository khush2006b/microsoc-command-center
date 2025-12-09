import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [emailValid, setEmailValid] = useState(null);
  const [serverOnline, setServerOnline] = useState(true);
  const [shake, setShake] = useState(false);

  // Generate particles once with stable random values
  const particles = useMemo(() => {
    const seed = 42; // Stable seed for consistent particle positions
    const random = (i) => ((seed + i * 13) % 100) / 100;
    
    return [...Array(15)].map((_, i) => ({
      id: i,
      left: `${random(i) * 100}%`,
      delay: `${random(i + 15) * 5}s`,
      duration: `${5 + random(i + 30) * 10}s`
    }));
  }, []);

  // Role hint based on email
  const roleHint = useMemo(() => {
    if (formData.email.includes('@microsoc.com')) {
      return '🔐 Admin Account Detected';
    } else if (formData.email.includes('@')) {
      return '👤 Analyst Portal Access';
    }
    return '';
  }, [formData.email]);

  // Check server health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/health`);
        setServerOnline(response.ok);
      } catch {
        setServerOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Detect Caps Lock
  const handleKeyPress = (e) => {
    setCapsLockOn(e.getModifierState?.('CapsLock') || false);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    
    if (name === 'email') {
      setEmailValid(value.length > 0 ? validateEmail(value) : null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    if (!validateEmail(formData.email)) {
      setError('⚠️ INVALID EMAIL FORMAT');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      let errorMsg = result.error;
      
      // Enhanced error messages
      if (errorMsg.toLowerCase().includes('password')) {
        errorMsg = '🔒 INCORRECT PASSWORD';
      } else if (errorMsg.toLowerCase().includes('approved')) {
        errorMsg = '⏳ ACCOUNT PENDING REVIEW';
      } else if (errorMsg.toLowerCase().includes('rejected')) {
        errorMsg = '❌ ACCOUNT REJECTED';
      } else if (errorMsg.toLowerCase().includes('not found')) {
        errorMsg = '⚠️ UNAUTHORIZED ACCESS ATTEMPT';
      }
      
      setError(errorMsg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#05080F] relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,0,51,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,0,51,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
        
        {/* Scan Line Animation */}
        <div className="absolute inset-0 animate-scan-line" style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,0,51,0.1) 50%, transparent 100%)',
          animation: 'scan 8s linear infinite'
        }} />
        
        {/* Floating Particles */}
        <div className="particle-container">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle"
              style={{
                left: particle.left,
                animationDelay: particle.delay,
                animationDuration: particle.duration
              }}
            />
          ))}
        </div>
      </div>

      {/* Radial Glow Behind Login Card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Server Status Indicator */}
      <div className="absolute top-6 right-6 flex items-center gap-2 text-xs font-['Roboto_Mono']">
        <div className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(0,255,0,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.5)]'} animate-pulse`} />
        <span className={serverOnline ? 'text-green-400' : 'text-red-400'}>
          {serverOnline ? 'MONITORING ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header with Light Sweep Animation */}
        <div className="text-center mb-10 relative">
          <div className="relative inline-block">
            <h1 className="text-5xl font-['Orbitron'] font-black text-red-400 mb-3 tracking-wider relative z-10">
              RANGER COMMAND
            </h1>
            {/* Light Sweep Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-300/30 to-transparent animate-sweep pointer-events-none" />
          </div>
          <p className="text-gray-500 font-['Roboto_Mono'] text-sm tracking-widest">
            SECURITY OPERATIONS CENTER
          </p>
          <div className="mt-2 text-xs text-gray-600 font-['Roboto_Mono']">
            v2.5.1 | Build 2025.12.08
          </div>
        </div>

        {/* Enhanced Login Card */}
        <div className={`
          bg-black/40 backdrop-blur-xl 
          border-2 border-red-500/40 
          rounded-xl p-8 
          shadow-[0_0_40px_rgba(255,0,51,0.3),inset_0_0_20px_rgba(255,0,51,0.05)]
          relative
          transition-all duration-300
          ${shake ? 'animate-shake' : ''}
        `}>
          {/* Holographic Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-400/50 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-400/50 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-400/50 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-400/50 rounded-br-xl" />

          <h2 className="text-2xl font-['Orbitron'] text-red-400 mb-2 text-center tracking-widest">
            SYSTEM LOGIN
          </h2>
          <div className="text-center text-xs text-gray-500 mb-6 font-['Roboto_Mono']">
            AUTHENTICATE TO ACCESS COMMAND CENTER
          </div>

          {/* Role Hint */}
          {roleHint && (
            <div className="mb-4 text-center text-sm text-cyan-400 font-['Roboto_Mono'] animate-fade-in">
              {roleHint}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border-2 border-red-500/50 rounded-lg px-4 py-3 mb-6 animate-slide-up">
              <p className="text-red-400 text-sm font-['Roboto_Mono'] text-center font-bold">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border-2 border-green-500/50 rounded-lg px-4 py-3 mb-6 animate-slide-up flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-400 text-sm font-['Roboto_Mono'] font-bold">
                AUTHENTICATED — REDIRECTING...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="relative">
              <label className="block text-xs font-['Orbitron'] text-gray-400 uppercase tracking-wider mb-2">
                🔐 OPERATOR EMAIL
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`
                    w-full bg-black/50 
                    border-2 rounded-lg
                    px-4 py-3 
                    text-gray-200 font-['Roboto_Mono'] 
                    focus:outline-none 
                    transition-all duration-300
                    ${emailValid === true ? 'border-green-500/50 focus:border-green-500 focus:shadow-[0_0_15px_rgba(0,255,0,0.3)]' : 
                      emailValid === false ? 'border-red-500/50 focus:border-red-500' : 
                      'border-red-500/30 focus:border-red-500 focus:shadow-[0_0_15px_rgba(255,0,51,0.3)]'}
                  `}
                  placeholder="operator@microsoc.com"
                />
                {emailValid === true && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

{/* PASSWORD FIELD — 100% FIXED LAYOUT */}
<div className="mb-6 w-full">
  <label className="block text-xs font-['Orbitron'] text-gray-400 uppercase tracking-wider mb-2">
    🔑 ACCESS CODE
  </label>

  <div className="relative w-full bg-black/50 border-2 border-red-500/30 rounded-lg">
    
    <input
      type="password"
      name="password"
      value={formData.password}
      onChange={handleChange}
      onKeyUp={handleKeyPress}
      placeholder="••••••••"
      required
      className="
        w-full py-3 px-4 
        bg-transparent text-gray-200 
        font-['Roboto_Mono']
        focus:outline-none
      "
    />
  </div>


              {/* Caps Lock Warning */}
              {capsLockOn && (
                <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400 font-['Roboto_Mono'] animate-fade-in">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>CAPS LOCK IS ON</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full 
                bg-red-500/20 
                border-2 border-red-500 
                text-red-400 
                font-['Orbitron'] font-bold 
                py-4 rounded-lg 
                uppercase tracking-widest text-sm
                hover:bg-red-500/30 
                hover:shadow-[0_0_30px_rgba(255,0,51,0.5),0_0_15px_rgba(255,0,51,0.3)_inset] 
                hover:border-red-400
                active:scale-[0.98]
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
                relative overflow-hidden
                group
              "
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>AUTHENTICATING...</span>
                </span>
              ) : (
                <>
                  <span className="relative z-10">🔓 ACCESS SYSTEM</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </>
              )}
            </button>
          </form>

          {/* Request Access Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/signup')}
              className="
                relative
                text-cyan-400 text-sm font-['Roboto_Mono'] 
                hover:text-cyan-300 
                transition-all duration-300
                group
                inline-flex items-center gap-2
                px-4 py-2
                border border-cyan-500/30
                rounded-lg
                hover:border-cyan-500
                hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]
                hover:bg-cyan-500/10
              "
              title="Requires admin approval"
            >
              <span>Request Analyst Access</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {/* Security Info */}
          <div className="mt-6 pt-6 border-t border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-['Roboto_Mono'] text-gray-600">
              <span className="flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Encrypted: AES-256
              </span>
              <span>Portal v2.5.1</span>
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <div className="mt-6 text-center text-xs text-gray-600 font-['Roboto_Mono'] leading-relaxed border border-gray-800/50 rounded-lg p-4 bg-black/20">
          <p className="text-yellow-500/70 mb-2">⚠️ SECURITY NOTICE</p>
          <p>Unauthorized access to this system is prohibited.</p>
          <p className="mt-1">All actions are monitored and logged.</p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 text-center text-xs text-gray-700 font-['Roboto_Mono'] opacity-50">
          <p>Demo: admin@microsoc.com / Admin@12345</p>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
        }
        
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-sweep {
          animation: sweep 3s ease-in-out infinite;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-in;
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .particle-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        
        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(255, 0, 51, 0.6);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 0, 51, 0.8);
          animation: float linear infinite;
        }
        
        @keyframes float {
          0% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(50px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
