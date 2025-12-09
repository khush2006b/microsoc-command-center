import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [step, setStep] = useState(1); // 1: Signup form, 2: OTP verification
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    department: '',
    reasonForAccess: ''
  });
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  // Countdown timer effect
  React.useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    const result = await signup({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      department: formData.department,
      reasonForAccess: formData.reasonForAccess
    });

    if (result.success && result.data?.user) {
      setUserId(result.data.user.id);
      setStep(2); // Move to OTP verification
      setTimeLeft(600); // Reset timer
    } else {
      setError(result.error || 'Signup failed. Please try again.');
    }
    
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otp.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Verification failed. Please try again.',err.message);
    }

    setLoading(false);
  };

  const handleResendOTP = async () => {
    setError('');
    setResendLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (data.success) {
        setTimeLeft(600); // Reset timer
        setOtp(''); // Clear OTP input
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.', err.message);
    }

    setResendLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-8 shadow-[0_0_30px_rgba(0,255,153,0.2)] text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-['Orbitron'] text-cyan-400 mb-4">
              Email Verified!
            </h2>
            <p className="text-gray-400 font-['Roboto_Mono'] text-sm mb-6">
              Your email has been verified successfully. Your account is now pending admin approval.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 font-['Orbitron'] font-bold py-3 px-8 rounded uppercase tracking-wider hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,255,153,0.4)] transition-all"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-['Orbitron'] font-black text-cyan-400 mb-2">
              VERIFY EMAIL
            </h1>
            <p className="text-gray-500 font-['Roboto_Mono'] text-sm">
              Enter the code sent to {formData.email}
            </p>
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-8 shadow-[0_0_30px_rgba(0,255,153,0.2)]">
            <div className="text-center mb-6">
              <div className="text-5xl mb-2">📧</div>
              <p className="text-gray-400 font-['Roboto_Mono'] text-sm">
                We've sent a 6-digit verification code to your email
              </p>
              <div className="mt-4 text-cyan-400 font-['Orbitron'] text-lg">
                {formatTime(timeLeft)}
              </div>
              {timeLeft === 0 && (
                <p className="text-red-400 text-sm mt-2">Code expired. Please resend.</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded px-4 py-3 mb-6">
                <p className="text-red-400 text-sm font-['Roboto_Mono']">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-xs font-['Orbitron'] text-gray-400 uppercase tracking-wider mb-2 text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-4 py-3 text-cyan-400 font-['Orbitron'] text-2xl text-center tracking-[0.5em] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-cyan-500/20 border border-cyan-500 text-cyan-400 font-['Orbitron'] font-bold py-3 rounded uppercase tracking-wider hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,255,153,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading || timeLeft > 0}
                  className="text-cyan-400 text-sm font-['Roboto_Mono'] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-gray-500 text-sm font-['Roboto_Mono'] hover:text-gray-400"
                  >
                    ← Back to Signup
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-['Orbitron'] font-black text-red-400 mb-2">
            RANGER COMMAND
          </h1>
          <p className="text-gray-500 font-['Roboto_Mono'] text-sm">
            Analyst Access Request
          </p>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-red-500/30 rounded-lg p-8 shadow-[0_0_30px_rgba(255,0,51,0.2)]">
          <h2 className="text-2xl font-['Orbitron'] text-red-400 mb-6 text-center">
            SIGN UP
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded px-4 py-3 mb-6">
              <p className="text-red-400 text-sm font-['Roboto_Mono']">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-['Orbitron'] text-gray-400 uppercase tracking-wider mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-red-500/30 rounded px-4 py-2 text-gray-200 font-['Roboto_Mono'] text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-['Orbitron'] text-gray-400 uppercase tracking-wider mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-red-500/30 rounded px-4 py-2 text-gray-200 font-['Roboto_Mono'] text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-['Orbitron'] text-gray-400 uppercase tracking-wider mb-2">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full bg-black/50 border border-red-500/30 rounded px-4 py-2 text-gray-200 font-['Roboto_Mono'] text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                placeholder="e.g., IT Security, Network Ops"
              />
            </div>

            <div>
              <label className="block text-xs font-['Orbitron'] text-gray-400 uppercase tracking-wider mb-2">
                Reason for Access
              </label>
              <textarea
                name="reasonForAccess"
                value={formData.reasonForAccess}
                onChange={handleChange}
                rows={3}
                className="w-full bg-black/50 border border-red-500/30 rounded px-4 py-2 text-gray-200 font-['Roboto_Mono'] text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                placeholder="Brief explanation of why you need access..."
              />
            </div>

            <div>
              <label className="block text-xs font-['Orbitron'] text-gray-400 uppercase tracking-wider mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-red-500/30 rounded px-4 py-2 text-gray-200 font-['Roboto_Mono'] text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-['Orbitron'] text-gray-400 uppercase tracking-wider mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-red-500/30 rounded px-4 py-2 text-gray-200 font-['Roboto_Mono'] text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                placeholder="Re-enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500/20 border border-red-500 text-red-400 font-['Orbitron'] font-bold py-3 rounded uppercase tracking-wider hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(255,0,51,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Submitting...' : 'Request Access'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-cyan-400 text-sm font-['Roboto_Mono'] hover:text-cyan-300 transition-colors"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
