import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Database,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@nexus.ai');
  const [password, setPassword] = useState('nexus123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/command-center';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both work email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('nexus123');
    try {
      setLoading(true);
      setError(null);
      await login(demoEmail, 'nexus123');
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to authenticate.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-blue-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 -right-10 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-2 shadow-sm shadow-cyan-500/10">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            Autonomous Multi-Agent Business Operations
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">NEXUS<span className="text-cyan-400">.AI</span></h1>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Sign in to access your enterprise autonomous co-pilot and multi-agent control plane.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0d1527] border border-[#22345e] shadow-2xl shadow-black/80 space-y-5 backdrop-blur-md">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Enterprise Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nexus.ai"
                  className="w-full bg-[#131e38] border border-[#22345e] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[10px] text-cyan-400 font-mono">Default: nexus123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#131e38] border border-[#22345e] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to NEXUS AI</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Accounts for Hackathons & Evaluators */}
          <div className="pt-4 border-t border-[#1f2d4d] space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">
              ⚡ 1-Click Test Accounts:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@nexus.ai')}
                disabled={loading}
                className="p-2 rounded-xl bg-[#131e38] hover:bg-[#182442] border border-[#22345e] hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="text-[10px] font-bold text-cyan-400 group-hover:text-cyan-300">Admin</div>
                <div className="text-[9px] text-slate-400 truncate">Full System</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager@nexus.ai')}
                disabled={loading}
                className="p-2 rounded-xl bg-[#131e38] hover:bg-[#182442] border border-[#22345e] hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="text-[10px] font-bold text-emerald-400 group-hover:text-emerald-300">Manager</div>
                <div className="text-[9px] text-slate-400 truncate">Approvals</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('employee@nexus.ai')}
                disabled={loading}
                className="p-2 rounded-xl bg-[#131e38] hover:bg-[#182442] border border-[#22345e] hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="text-[10px] font-bold text-purple-400 group-hover:text-purple-300">Employee</div>
                <div className="text-[9px] text-slate-400 truncate">Operations</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Cloud Compliance Badge */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> SENTINEL Guarded
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-cyan-500" /> Supabase PostgreSQL
          </span>
        </div>
      </div>
    </div>
  );
};
