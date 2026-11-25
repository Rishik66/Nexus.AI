import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  FileCode,
} from 'lucide-react';
import { ApiService, Approval } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const Approvals: React.FC = () => {
  const { refreshApprovals } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getApprovals();
      setApprovals(res.approvals || []);
      setPendingCount(res.pendingCount || 0);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const reason = decisionNotes[id] || `Decided by manager as ${decision}`;
      await ApiService.decideApproval(id, decision, reason);
      await fetchApprovals();
      await refreshApprovals();
    } catch (err: any) {
      alert(`Decision failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              SENTINEL Safety Gatekeeper
            </span>
            <span className="text-xs text-slate-400 font-mono">Human-in-the-Loop Governance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Approval Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous agent operations with MEDIUM or HIGH risk (purchase orders, financial commitments, database mutations) require explicit human authorization.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-[#131e38] border border-[#22345e] text-xs">
          <span className="text-slate-400">Pending Actions: </span>
          <span className="font-bold text-amber-400">{pendingCount}</span>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {approvals.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0d1527] border border-[#22345e] text-slate-500 text-xs">
            <ShieldAlert className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            No pending or historical approvals found. When an agent plans a high-risk operation, it will appear here for review.
          </div>
        ) : (
          approvals.map((a) => {
            const isPending = a.status === 'PENDING';
            return (
              <div
                key={a.id}
                className={`p-5 rounded-2xl bg-[#0d1527] border transition-all space-y-3 ${
                  isPending
                    ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'border-[#22345e]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        a.risk_level === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {a.risk_level} RISK
                    </span>
                    <span className="font-mono text-xs text-cyan-400 font-bold">
                      Requested by {a.requesting_agent}
                    </span>
                    <span className="text-xs text-slate-400">• {a.action_type}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded self-start sm:self-auto ${
                      a.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : a.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300 animate-pulse'
                    }`}
                  >
                    STATUS: {a.status}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#131e38] border border-[#22345e] space-y-2">
                  <p className="text-xs text-slate-200 font-semibold">{a.description}</p>
                  {a.payload && (
                    <pre className="text-[11px] font-mono text-cyan-300 bg-[#090f1d] p-2.5 rounded-lg overflow-x-auto border border-[#22345e]">
                      {JSON.stringify(a.payload, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Decision Actions if Pending */}
                {isPending ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="Optional decision note..."
                      value={decisionNotes[a.id] || ''}
                      onChange={(e) =>
                        setDecisionNotes({ ...decisionNotes, [a.id]: e.target.value })
                      }
                      className="text-xs bg-[#131e38] border border-[#22345e] rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 flex-1"
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleDecision(a.id, 'REJECTED')}
                        className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleDecision(a.id, 'APPROVED')}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Authorize Action
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 font-mono pt-1">
                    Decided by: <strong className="text-slate-300">{a.decided_by || 'Manager'}</strong> • Reason: {a.decision_reason || 'N/A'}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
