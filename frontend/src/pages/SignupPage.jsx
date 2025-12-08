import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    department: '',
    reasonForAccess: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-8 shadow-[0_0_30px_rgba(0,255,153,0.2)] text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-['Orbitron'] text-cyan-400 mb-4">
              Request Submitted
            </h2>
            <p className="text-gray-400 font-['Roboto_Mono'] text-sm mb-6">
              Your analyst access request has been submitted successfully.
              Please wait for admin approval.
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-black/50 border border-red-500/30 rounded px-4 py-2 pr-12 text-gray-200 font-['Roboto_Mono'] text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-['Orbitron'] text-gray-400 uppercase tracking-wider mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full bg-black/50 border border-red-500/30 rounded px-4 py-2 pr-12 text-gray-200 font-['Roboto_Mono'] text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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
