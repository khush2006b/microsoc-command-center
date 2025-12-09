// AI-Powered Remediation Component
// Displays AI-generated security remediation guidance

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AIRemediation({ incidentId }) {
  const [remediation, setRemediation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  const fetchRemediation = useCallback(async (regenerate = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const url = regenerate 
        ? `${API_URL}/api/incidents/${incidentId}/remediation?regenerate=true`
        : `${API_URL}/api/incidents/${incidentId}/remediation`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRemediation(response.data.remediation);
        console.log('✅ Remediation loaded:', response.data.cached ? 'from cache' : 'newly generated');
      } else {
        setError(response.data.error || 'Failed to load remediation');
      }
    } catch (err) {
      console.error('❌ Remediation fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load AI remediation');
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, [incidentId]);

  useEffect(() => {
    if (incidentId) {
      fetchRemediation();
    }
  }, [incidentId, fetchRemediation]);

  const handleRegenerate = () => {
    setRegenerating(true);
    fetchRemediation(true);
  };

  // Risk level color mapping
  const getRiskColor = (riskLevel) => {
    if (!riskLevel) return 'text-gray-400';
    const level = riskLevel.toLowerCase();
    if (level.includes('critical')) return 'text-red-500';
    if (level.includes('high')) return 'text-orange-500';
    if (level.includes('medium')) return 'text-yellow-500';
    return 'text-blue-500';
  };

  // Loading State
  if (loading && !regenerating) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border-2 border-cyan-500/30 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative w-16 h-16">
            {/* Animated AI Icon */}
            <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping" />
            <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-cyan-400 border-b-cyan-300 border-l-cyan-200 rounded-full animate-spin" />
            <div className="absolute inset-3 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-cyan-400 font-['Orbitron'] text-lg mb-2">
              AI REMEDIATION ENGINE
            </p>
            <p className="text-gray-400 font-['Roboto_Mono'] text-sm animate-pulse">
              Generating standards-based mitigation guidance...
            </p>
          </div>

          {/* Loading Progress */}
          <div className="w-full max-w-md mt-4">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600 animate-shimmer" 
                   style={{ width: '100%', backgroundSize: '200% 100%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border-2 border-red-500/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">⚠️</div>
          <div className="flex-1">
            <h3 className="text-red-400 font-['Orbitron'] text-lg mb-2">
              AI SERVICE ERROR
            </h3>
            <p className="text-gray-400 font-['Roboto_Mono'] text-sm mb-4">
              {error}
            </p>
            <button
              onClick={() => fetchRemediation()}
              className="px-4 py-2 bg-red-500/20 border border-red-500 text-red-400 rounded-lg font-['Roboto_Mono'] text-sm hover:bg-red-500/30 transition-all"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No remediation yet
  if (!remediation) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border-2 border-gray-700 rounded-xl p-6 text-center">
        <p className="text-gray-500 font-['Roboto_Mono']">
          No remediation available. Click "Generate Remediation" to analyze this incident.
        </p>
      </div>
    );
  }

  // Main Remediation Display
  return (
    <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-gray-800/50">
      {/* Header with Regenerate Button */}
      <div className="flex items-center justify-between sticky top-0 bg-[#05080F] z-10 pb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🤖</div>
          <div>
            <h2 className="text-cyan-400 font-['Orbitron'] text-xl">
              AI REMEDIATION GUIDANCE
            </h2>
            <p className="text-gray-500 font-['Roboto_Mono'] text-xs">
              {remediation.is_fallback ? (
                '⚠️ Fallback mode (LLM unavailable)'
              ) : (
                `Generated by ${remediation.generated_by} • ${new Date(remediation.generated_at).toLocaleString()}`
              )}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="px-4 py-2 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded-lg font-['Roboto_Mono'] text-sm hover:bg-cyan-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {regenerating ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Regenerating...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Regenerate</span>
            </>
          )}
        </button>
      </div>

      {/* Executive Summary */}
      <div className="bg-black/40 backdrop-blur-sm border-2 border-cyan-500/40 rounded-xl p-6">
        <h3 className="text-cyan-400 font-['Orbitron'] text-sm uppercase mb-3 flex items-center gap-2">
          <span>📋</span>
          <span>Executive Summary</span>
        </h3>
        <p className="text-gray-300 font-['Roboto_Mono'] text-sm leading-relaxed">
          {remediation.summary}
        </p>
      </div>

      {/* Risk Level */}
      <div className="bg-black/40 backdrop-blur-sm border-2 border-orange-500/40 rounded-xl p-6">
        <h3 className="text-orange-400 font-['Orbitron'] text-sm uppercase mb-3 flex items-center gap-2">
          <span>⚠️</span>
          <span>Risk Assessment</span>
        </h3>
        <p className={`font-['Roboto_Mono'] text-sm leading-relaxed ${getRiskColor(remediation.risk_level)}`}>
          {remediation.risk_level}
        </p>
      </div>

      {/* Immediate Actions */}
      <div className="bg-black/40 backdrop-blur-sm border-2 border-red-500/40 rounded-xl p-6">
        <h3 className="text-red-400 font-['Orbitron'] text-sm uppercase mb-4 flex items-center gap-2">
          <span>🚨</span>
          <span>Immediate Actions (Execute Now)</span>
        </h3>
        <div className="space-y-3">
          {remediation.immediate_actions?.map((action, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="shrink-0 w-6 h-6 bg-red-500/20 border border-red-500 rounded-full flex items-center justify-center text-red-400 text-xs font-['Orbitron']">
                {index + 1}
              </div>
              <p className="text-gray-300 font-['Roboto_Mono'] text-sm flex-1">
                {action}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Long-Term Actions */}
      <div className="bg-black/40 backdrop-blur-sm border-2 border-blue-500/40 rounded-xl p-6">
        <h3 className="text-blue-400 font-['Orbitron'] text-sm uppercase mb-4 flex items-center gap-2">
          <span>🛡️</span>
          <span>Long-Term Improvements</span>
        </h3>
        <div className="space-y-3">
          {remediation.long_term_actions?.map((action, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="shrink-0 w-6 h-6 bg-blue-500/20 border border-blue-500 rounded-full flex items-center justify-center text-blue-400 text-xs font-['Orbitron']">
                {index + 1}
              </div>
              <p className="text-gray-300 font-['Roboto_Mono'] text-sm flex-1">
                {action}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Tools */}
      <div className="bg-black/40 backdrop-blur-sm border-2 border-purple-500/40 rounded-xl p-6">
        <h3 className="text-purple-400 font-['Orbitron'] text-sm uppercase mb-4 flex items-center gap-2">
          <span>🔧</span>
          <span>Recommended Security Tools</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {remediation.recommended_tools?.map((tool, index) => (
            <div key={index} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="text-gray-300 font-['Roboto_Mono'] text-sm">
                {tool}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Industry Standards References */}
      <div className="bg-black/40 backdrop-blur-sm border-2 border-green-500/40 rounded-xl p-6">
        <h3 className="text-green-400 font-['Orbitron'] text-sm uppercase mb-4 flex items-center gap-2">
          <span>📚</span>
          <span>Industry Standards & Frameworks</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {remediation.reference_standards?.map((standard, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="text-green-500 mt-1">✓</div>
              <p className="text-gray-300 font-['Roboto_Mono'] text-sm">
                {standard}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Automation Opportunities (if available) */}
      {remediation.automation_opportunities && remediation.automation_opportunities.length > 0 && (
        <div className="bg-black/40 backdrop-blur-sm border-2 border-yellow-500/40 rounded-xl p-6">
          <h3 className="text-yellow-400 font-['Orbitron'] text-sm uppercase mb-4 flex items-center gap-2">
            <span>⚙️</span>
            <span>Automation Opportunities</span>
          </h3>
          <div className="space-y-2">
            {remediation.automation_opportunities.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="text-yellow-500 mt-1">⚡</div>
                <p className="text-gray-300 font-['Roboto_Mono'] text-sm">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicators of Compromise (if available) */}
      {remediation.indicators_of_compromise && remediation.indicators_of_compromise.length > 0 && (
        <div className="bg-black/40 backdrop-blur-sm border-2 border-red-500/40 rounded-xl p-6">
          <h3 className="text-red-400 font-['Orbitron'] text-sm uppercase mb-4 flex items-center gap-2">
            <span>🎯</span>
            <span>Indicators of Compromise (IOCs)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {remediation.indicators_of_compromise.map((ioc, index) => (
              <div key={index} className="bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                <code className="text-red-300 font-['Roboto_Mono'] text-xs">
                  {ioc}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-yellow-500 text-xl">⚠️</div>
          <div>
            <p className="text-yellow-300 font-['Roboto_Mono'] text-xs mb-1 font-bold">
              AI-GENERATED CONTENT
            </p>
            <p className="text-gray-400 font-['Roboto_Mono'] text-xs leading-relaxed">
              This remediation guidance is generated by an AI system based on industry standards. 
              Always verify recommendations with your organization's security policies and conduct 
              thorough testing before implementing changes in production environments.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }

        /* Custom Scrollbar Styles */
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.8);
        }
      `}</style>
    </div>
  );
}
