import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Activity, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { ApiService, AgentDescriptor, AgentRun } from '../services/api.js';

export const AgentActivity: React.FC = () => {
  const [agents, setAgents] = useState<AgentDescriptor[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ApiService.getAgents(), ApiService.getAgentRuns()])
      .then(([a, r]) => {
        setAgents(a || []);
        setRuns(r || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Multi-Agent Intelligence Network
          </span>
          <span className="text-xs text-slate-400 font-mono">{agents.length || 7} Specialized Cooperating Agents</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Agent Activity & Roster</h1>
        <p className="text-xs text-slate-400 mt-1">
          Architectural overview of all specialized AI models, their role boundaries, tool authorizations, and execution audit history.
        </p>
      </div>

      {/* Agents Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] hover:border-slate-500 transition-all space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: `${agent.avatarColor}20`, color: agent.avatarColor }}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{agent.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">{agent.role}</p>
                  </div>
                </div>

                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <p className="text-xs text-slate-300 font-medium mb-3">{agent.tagline}</p>

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Core Capabilities:
                </p>
                {agent.capabilities.map((cap, i) => (
                  <div key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                    <span className="text-cyan-400">•</span>
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1f2d4d]">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Authorized Tools:
              </p>
              <div className="flex flex-wrap gap-1">
                {agent.permittedTools.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#131e38] text-cyan-300 border border-[#22345e]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Agent Runs Table */}
      <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Autonomous Runs History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131e38] text-slate-400 border-b border-[#22345e] uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Goal</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Current Agent</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d4d]">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-[#131e38]/50">
                  <td className="py-3 px-4 font-semibold text-slate-200">{r.goal}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : r.status === 'STOPPED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.current_agent}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
