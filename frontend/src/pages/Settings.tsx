import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Cpu, Database, Mail, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const Settings: React.FC = () => {
  const { business, user, role } = useAuth();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.getIntegrations()
      .then(setIntegrations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl">
        <h1 className="text-2xl font-extrabold text-white">System Settings & Integrations</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure external credentials, monitor cloud services, and manage multi-tenant enterprise parameters.
        </p>
      </div>

      {/* Integration Providers */}
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
    </div>
  );
};
