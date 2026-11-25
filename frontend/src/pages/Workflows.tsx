import React, { useState, useEffect } from 'react';
import { Cpu, Play, CheckCircle2, Clock, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { ApiService } from '../services/api.js';
import { useNavigate } from 'react-router-dom';

export const Workflows: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  useEffect(() => {
    ApiService.getWorkflows()
      .then(setWorkflows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRunWorkflow = async (id: string) => {
    setTriggeringId(id);
    try {
      const res = await ApiService.triggerWorkflow(id);
      // Navigate to Command Center to view execution
      navigate('/command-center');
    } catch (err: any) {
      alert(`Workflow trigger failed: ${err.message}`);
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl">
        <h1 className="text-2xl font-extrabold text-white">Autonomous Workflows</h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated multi-agent pipelines for scheduled inventory audits, fiscal anomaly sweeps, and document intake.
        </p>
      </div>

      <div className="space-y-4">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] hover:border-slate-500 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    TRIGGER: {wf.trigger_type}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{wf.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{wf.description}</p>
              </div>

              <button
                onClick={() => handleRunWorkflow(wf.id)}
                disabled={triggeringId === wf.id}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex-shrink-0"
              >
                {triggeringId === wf.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    Run Workflow Now
                  </>
                )}
              </button>
            </div>

            {/* Workflow Steps Preview */}
            <div className="pt-2 border-t border-[#1f2d4d]">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Pipeline Execution Steps:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {(wf.steps || []).map((step: any, sIdx: number) => (
                  <div key={sIdx} className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131e38] border border-[#22345e] text-xs">
                      <span className="font-mono font-bold text-cyan-400">{step.agent}</span>
                      <span className="text-slate-400 text-[11px]">• {step.action}</span>
                    </div>
                    {sIdx < wf.steps.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
