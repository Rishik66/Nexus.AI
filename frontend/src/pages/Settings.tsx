import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Database,
  Mail,
  Globe,
  CheckCircle2,
  AlertCircle,
  Key,
  Link2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Code,
  FileText,
  UploadCloud,
} from 'lucide-react';
import { ApiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const Settings: React.FC = () => {
  const { business, user, role } = useAuth();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase state
  const [supabaseStatus, setSupabaseStatus] = useState<any | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncingSeed, setSyncingSeed] = useState(false);
  const [connectMessage, setConnectMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Migration SQL modal state
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [migrationSql, setMigrationSql] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  // Gemini Live AI state
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [connectingGemini, setConnectingGemini] = useState(false);
  const [geminiMessage, setGeminiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const [intRes, supaRes] = await Promise.all([
        ApiService.getIntegrations(),
        ApiService.getSupabaseStatus().catch(() => null),
      ]);
      setIntegrations(intRes || []);
      if (supaRes) {
        setSupabaseStatus(supaRes);
        if (supaRes.supabaseUrl && !supaRes.supabaseUrl.includes('PostgreSQL')) {
          setSupabaseUrl(supaRes.supabaseUrl);
        }
      }
    } catch (err) {
      console.error('Failed to load settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestAndConnectSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      setConnectMessage({ type: 'error', text: 'Please enter both Supabase Project URL and API Key.' });
      return;
    }

    try {
      setConnecting(true);
      setConnectMessage(null);
      const res = await ApiService.connectSupabase({
        supabaseUrl,
        supabaseServiceRoleKey: supabaseKey,
        databaseUrl: databaseUrl || undefined,
      });

      if (res.success) {
        setConnectMessage({
          type: 'success',
          text: 'Connected to Supabase successfully! Cloud database is linked.',
        });
        await fetchIntegrations();
      } else {
        setConnectMessage({
          type: 'error',
          text: res.message || 'Failed to connect to Supabase project.',
        });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to verify Supabase connection.';
      setConnectMessage({ type: 'error', text: errMsg });
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiKey) {
      setGeminiMessage({ type: 'error', text: 'Please enter a valid Google Gemini API Key.' });
      return;
    }
    try {
      setConnectingGemini(true);
      setGeminiMessage(null);
      const res = await ApiService.connectGemini({
        apiKey: geminiKey,
        model: geminiModel,
      });
      if (res.success) {
        setGeminiMessage({
          type: 'success',
          text: `Connected to Gemini! Test response: "${res.testReply}". Live AI planning & function calling are active.`,
        });
        await fetchIntegrations();
      } else {
        setGeminiMessage({ type: 'error', text: res.message || 'Failed to verify Gemini API Key.' });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Verification failed.';
      setGeminiMessage({ type: 'error', text: errMsg });
    } finally {
      setConnectingGemini(false);
    }
  };

  const handleSyncSeedToSupabase = async () => {
    try {
      setSyncingSeed(true);
      setSyncMessage(null);
      const res = await ApiService.syncSupabaseSeed();
      if (res.success) {
        setSyncMessage({
          type: 'success',
          text: `Seed data synchronized! Synced: ${JSON.stringify(res.stats || {})}`,
        });
      } else {
        setSyncMessage({ type: 'error', text: res.message || 'Failed to sync seed data.' });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Sync failed.';
      setSyncMessage({ type: 'error', text: errMsg });
    } finally {
      setSyncingSeed(false);
    }
  };

  const handleOpenSqlModal = async () => {
    try {
      if (!migrationSql) {
        const sql = await ApiService.getSupabaseMigrationSql();
        setMigrationSql(sql);
      }
      setShowSqlModal(true);
    } catch (err) {
      console.error('Failed to load migration SQL:', err);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(migrationSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Cloud Infrastructure & Security
            </span>
            <span className="text-xs text-slate-400 font-mono">Enterprise Configuration</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">System Settings & Integrations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure external database providers, monitor cloud sub-services, and manage multi-tenant enterprise parameters.
          </p>
        </div>

        <button
          onClick={fetchIntegrations}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#131e38] hover:bg-[#182442] text-slate-300 hover:text-white border border-[#22345e] text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Google Gemini Live AI Configuration Card */}
      <div className="p-6 rounded-2xl bg-[#0d1527] border border-purple-500/30 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#1f2d4d]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Google Gemini Live AI Reasoning Engine</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    integrations.find((i) => i.provider === 'GEMINI')?.status === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {integrations.find((i) => i.provider === 'GEMINI')?.status === 'CONNECTED'
                    ? '● CONNECTED (LIVE GEMINI LLM REASONING)'
                    : '○ AUTONOMOUS DEMO FALLBACK ENGINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Powers real-time natural language planning (ORION), function calling, tool execution, and multimodal vision OCR (SAGE).
              </p>
            </div>
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#131e38] hover:bg-[#1f2d4d] text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all self-start md:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Get Free Gemini API Key (Google AI Studio)
          </a>
        </div>

        {geminiMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              geminiMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}
          >
            {geminiMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{geminiMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleConnectGemini} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* API Key */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Google Gemini API Key:</span>
                <span className="text-[10px] text-slate-500 font-mono">Starts with AIzaSy...</span>
              </label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  required
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Model Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                LLM Architecture:
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Active / High-Speed)</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Latest Preview)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Multimodal Reasoning)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="submit"
              disabled={connectingGemini}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all"
            >
              <Sparkles className={`w-4 h-4 ${connectingGemini ? 'animate-spin' : ''}`} />
              {connectingGemini ? 'Verifying with Gemini...' : 'Activate Live Gemini AI'}
            </button>
          </div>
        </form>
      </div>

      {/* Supabase Cloud Database Integration Section */}
      <div className="p-6 rounded-2xl bg-[#0d1527] border border-cyan-500/30 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#1f2d4d]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Supabase Cloud Database Link</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    supabaseStatus?.isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {supabaseStatus?.isConnected ? '● CONNECTED (SUPABASE CLOUD)' : '○ LOCAL RELATIONAL ENGINE (READY TO LINK)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your hosted PostgreSQL instance on Supabase for persistent multi-tenant data isolation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenSqlModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#131e38] hover:bg-[#1f2d4d] text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
            >
              <Code className="w-3.5 h-3.5" />
              Copy Supabase Schema SQL
            </button>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#131e38] hover:bg-[#1f2d4d] text-slate-300 hover:text-white border border-[#22345e] text-xs font-semibold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Supabase Console
            </a>
          </div>
        </div>

        {/* Setup Walkthrough Mini Banner */}
        <div className="p-3.5 rounded-xl bg-[#131e38]/70 border border-[#22345e] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] flex items-center justify-center font-bold">
              1
            </span>
            <span>Create a project on <strong>Supabase</strong></span>
            <span className="text-slate-600">→</span>
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] flex items-center justify-center font-bold">
              2
            </span>
            <span>Run <strong>Schema SQL</strong> in SQL Editor</span>
            <span className="text-slate-600">→</span>
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] flex items-center justify-center font-bold">
              3
            </span>
            <span>Paste <strong>Project URL & Key</strong> below</span>
          </div>

          {supabaseStatus?.isConnected && (
            <button
              onClick={handleSyncSeedToSupabase}
              disabled={syncingSeed}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all disabled:opacity-50"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${syncingSeed ? 'animate-bounce' : ''}`} />
              {syncingSeed ? 'Syncing Tables...' : 'Push Enterprise Seed to Supabase'}
            </button>
          )}
        </div>

        {/* Sync message alert */}
        {syncMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              syncMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}
          >
            {syncMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{syncMessage.text}</span>
          </div>
        )}

        {/* Connection Form */}
        <form onSubmit={handleTestAndConnectSupabase} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supabase URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Supabase Project URL:</span>
                <span className="text-[10px] text-slate-500 font-mono">https://&lt;project-ref&gt;.supabase.co</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="https://xyzabcdefghijklm.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Supabase Key */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Supabase Anon or Service Role Key:</span>
                <span className="text-[10px] text-slate-500 font-mono">Project Settings → API</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Database URL Optional */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span>PostgreSQL Connection String (Optional Direct Pool):</span>
              <span className="text-[10px] text-slate-500 font-mono">postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres</span>
            </label>
            <input
              type="text"
              placeholder="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            />
          </div>

          {connectMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                connectMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}
            >
              {connectMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{connectMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={connecting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              <Link2 className={`w-4 h-4 ${connecting ? 'animate-spin' : ''}`} />
              {connecting ? 'Verifying & Linking...' : 'Test & Link Supabase'}
            </button>
          </div>
        </form>
      </div>

      {/* Integration Providers Overview */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
          Connected External Subsystems:
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((item) => (
            <div
              key={item.provider}
              className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                    {item.provider === 'GEMINI' ? (
                      <Cpu className="w-5 h-5" />
                    ) : item.provider === 'SUPABASE' ? (
                      <Database className="w-5 h-5" />
                    ) : item.provider === 'RESEND' ? (
                      <Mail className="w-5 h-5" />
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{item.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{item.provider}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    item.status === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <p className="text-xs text-slate-300">{item.description}</p>
              <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-[#1f2d4d]">
                {item.details}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Business Details Card */}
      <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-3">
        <h3 className="text-sm font-bold text-white">Active Enterprise Tenant</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#131e38] border border-[#22345e]">
            <span className="text-slate-400 block text-[10px]">Business Name</span>
            <span className="font-bold text-white">{business?.name}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#131e38] border border-[#22345e]">
            <span className="text-slate-400 block text-[10px]">Primary Currency</span>
            <span className="font-bold text-cyan-400 font-mono">{business?.currency || 'USD'}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#131e38] border border-[#22345e]">
            <span className="text-slate-400 block text-[10px]">Industry Vertical</span>
            <span className="font-bold text-white">{business?.type}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#131e38] border border-[#22345e]">
            <span className="text-slate-400 block text-[10px]">Headquarters Address</span>
            <span className="text-slate-300">{business?.address || 'Silicon Valley, CA'}</span>
          </div>
        </div>
      </div>

      {/* Schema SQL Migration Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d1527] border border-[#22345e] rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#22345e]">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Supabase PostgreSQL Schema Migration (001_initial_schema.sql)</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Open your Supabase project's <strong>SQL Editor</strong>, paste this entire SQL script, and click <strong>RUN</strong> to create all tables, indexes, and foreign keys.
            </p>

            <div className="relative flex-1 min-h-[300px] overflow-hidden rounded-xl bg-[#090d18] border border-[#1f2d4d]">
              <pre className="p-4 text-[11px] font-mono text-cyan-200 overflow-y-auto h-full max-h-[400px]">
                {migrationSql || '-- Loading migration SQL script...'}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Creates: users, businesses, products, suppliers, customers, invoices, expenses, agent_runs, audit_logs.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copiedSql ? 'Copied to Clipboard!' : 'Copy Entire SQL Script'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
