import React, { useState, useEffect } from 'react';
import { ScrollText, Search, Filter, ShieldCheck, Terminal } from 'lucide-react';
import { ApiService } from '../services/api.js';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.getAuditLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.agent_name && l.agent_name.toLowerCase().includes(search.toLowerCase())) ||
      (l.entity_type && l.entity_type.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl">
        <h1 className="text-2xl font-extrabold text-white">Immutable Audit Trail</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete, tamper-evident log of all agent decisions, tool invocations, database mutations, and human approvals.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[#0d1527] border border-[#22345e]">
        <div className="flex items-center gap-2 max-w-md bg-[#131e38] border border-[#22345e] rounded-lg px-3 py-2 text-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, agent name, or entity..."
            className="bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>
      </div>

      <div className="rounded-xl bg-[#0d1527] border border-[#22345e] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131e38] text-slate-400 border-b border-[#22345e] uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Agent / Actor</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d4d]">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-[#131e38]/50">
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(l.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{l.action}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                      {l.agent_name || 'USER'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">{l.entity_type}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                    {l.details ? JSON.stringify(l.details) : '—'}
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
