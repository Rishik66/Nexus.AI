import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  ShieldCheck,
  Plus,
  RefreshCw,
  X,
  AlertTriangle,
  Sparkles,
  Trash2,
  Power,
  RotateCcw,
} from 'lucide-react';
import { ApiService } from '../services/api.js';
import { useNavigate } from 'react-router-dom';

const AGENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ORION: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  ATLAS: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  NOVA: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  SAGE: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  SENTINEL: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export const Workflows: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [executionMessage, setExecutionMessage] = useState<{ id: string; name: string; runId?: string } | null>(null);

  // Create workflow modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [wfName, setWfName] = useState('');
  const [wfDescription, setWfDescription] = useState('');
  const [wfTriggerType, setWfTriggerType] = useState<'SCHEDULED' | 'EVENT_DRIVEN' | 'MANUAL'>('SCHEDULED');
  const [wfCron, setWfCron] = useState('0 9 * * 1');
  const [wfPrimaryAgent, setWfPrimaryAgent] = useState<'ATLAS' | 'NOVA' | 'SAGE' | 'ORION'>('ATLAS');
  const [wfActionName, setWfActionName] = useState('');
  const [submittingWf, setSubmittingWf] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getWorkflows();
      setWorkflows(data || []);
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleRunWorkflow = async (id: string, name: string) => {
    setTriggeringId(id);
    setExecutionMessage(null);
    try {
      const res = await ApiService.triggerWorkflow(id);
      setExecutionMessage({
        id,
        name,
        runId: res?.runId,
      });
    } catch (err: any) {
      alert(`Workflow trigger failed: ${err.message}`);
    } finally {
      setTriggeringId(null);
    }
  };

  const handleToggleWorkflow = async (id: string) => {
    try {
      const updated = await ApiService.toggleWorkflow(id);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, is_active: updated?.is_active ?? !w.is_active } : w))
      );
    } catch (err: any) {
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, is_active: !w.is_active } : w))
      );
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to remove this workflow?')) return;
    try {
      await ApiService.deleteWorkflow(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    }
  };

  const handleRestoreDefaults = async () => {
    try {
      setLoading(true);
      const res = await ApiService.seedDefaultWorkflows();
      setWorkflows(res || []);
    } catch {
      fetchWorkflows();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim()) {
      setModalError('Workflow name is required.');
      return;
    }

    const action = wfActionName.trim() || `EXECUTE_${wfPrimaryAgent}_PIPELINE`;

    try {
      setSubmittingWf(true);
      setModalError(null);
      const newWf = await ApiService.createWorkflow({
        name: wfName.trim(),
        description: wfDescription.trim() || `Autonomous multi-agent execution pipeline orchestrated by ${wfPrimaryAgent}`,
        trigger_type: wfTriggerType,
        cron_expression: wfCron,
        steps: [
          { agent: wfPrimaryAgent, action: action, order: 1 },
          { agent: 'SENTINEL', action: 'VERIFY_SAFETY_GATES', order: 2 },
        ],
        is_active: true,
      });

      setWorkflows((prev) => [newWf, ...prev]);
      setCreateModalOpen(false);
      setWfName('');
      setWfDescription('');
      setWfActionName('');
    } catch (err: any) {
      setModalError(err.message || 'Failed to create workflow.');
    } finally {
      setSubmittingWf(false);
    }
  };

  const formatScheduleText = (trigger: string, cron?: string) => {
    if (trigger === 'EVENT_DRIVEN') return 'Event: On Document Upload / Webhook';
    if (trigger === 'MANUAL') return 'Manual: On-Demand Trigger Only';
    if (!cron) return 'Scheduled: Custom Cadence';
    if (cron === '0 9 * * 1') return 'Every Monday @ 9:00 AM';
    if (cron === '0 8 * * *') return 'Every Morning @ 8:00 AM';
    if (cron === '0 17 * * *') return 'Every Evening @ 5:00 PM';
    if (cron.includes('* * *')) return 'Daily Scheduled Cadence';
    return `Cron Cadence: ${cron}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ORION & SENTINEL Autonomous Pipelines
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {workflows.filter((w) => w.is_active).length} Active Pipelines
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Autonomous Workflows</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Automated recurring multi-agent pipelines for scheduled infrastructure asset audits, fiscal cash flow sweeps, and multimodal document ingestion.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRestoreDefaults}
            title="Reload default enterprise workflows"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#131e38] hover:bg-[#182442] text-slate-300 hover:text-white border border-[#22345e] text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reset Presets</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Execution Alert Banner if just triggered */}
      {executionMessage && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#0d1527] to-blue-950/40 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">
                Workflow "{executionMessage.name}" Triggered Successfully!
              </p>
              <p className="text-[11px] text-cyan-300">
                ORION and the specialist agents have begun generating the multi-step execution DAG.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/command-center')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
          >
            <span>View Live in Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Workflows List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3 bg-[#0d1527] border border-[#22345e] rounded-2xl">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
            <p className="text-xs">Loading autonomous pipelines...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-[#0d1527] border border-[#22345e] rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Workflows Configured Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Deploy the 4 pre-configured enterprise workflow templates to automate weekly hardware audits, daily cash sweeps, and contract ingestion.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={handleRestoreDefaults}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Deploy 4 Enterprise Workflow Presets</span>
              </button>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#131e38] border border-[#22345e] text-slate-300 hover:text-white text-xs font-semibold"
              >
                + Create Custom
              </button>
            </div>
          </div>
        ) : (
          workflows.map((wf) => {
            const isActive = wf.is_active !== false;
            return (
              <div
                key={wf.id}
                className={`p-6 rounded-2xl bg-[#0d1527] border transition-all space-y-4 shadow-xl ${
                  isActive ? 'border-[#22345e] hover:border-slate-500' : 'border-[#1f2d4d]/50 opacity-60'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                        {wf.trigger_type}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        {formatScheduleText(wf.trigger_type, wf.cron_expression)}
                      </span>
                      {isActive ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          <Power className="w-3 h-3" /> PAUSED
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white">{wf.name}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{wf.description}</p>
                  </div>

                  {/* Actions Button Group */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
                    <button
                      onClick={() => handleToggleWorkflow(wf.id)}
                      title={isActive ? 'Pause Workflow' : 'Activate Workflow'}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#131e38] text-slate-400 hover:text-amber-300 border-[#22345e]'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleRunWorkflow(wf.id, wf.name)}
                      disabled={triggeringId === wf.id}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
                    >
                      {triggeringId === wf.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Run Workflow Now</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteWorkflow(wf.id)}
                      title="Delete Workflow"
                      className="p-2.5 rounded-xl bg-[#131e38] hover:bg-rose-500/10 border border-[#22345e] hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Workflow Pipeline Steps Preview */}
                <div className="pt-3 border-t border-[#1f2d4d] space-y-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Orchestrated Execution Pipeline:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {(wf.steps || []).map((step: any, sIdx: number) => {
                      const colors = AGENT_COLORS[step.agent] || AGENT_COLORS.ORION;
                      return (
                        <div key={sIdx} className="flex items-center gap-2">
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${colors.bg} ${colors.border}`}
                          >
                            <span className={`font-mono font-black text-xs ${colors.text}`}>
                              {step.agent}
                            </span>
                            <span className="text-slate-300 text-[11px] font-medium">
                              • {step.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                          {sIdx < wf.steps.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Custom Workflow Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#0d1527] border border-[#22345e] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#22345e]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Autonomous Workflow</h3>
                  <p className="text-[11px] text-slate-400">
                    Define scheduled or event-driven multi-agent pipelines
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateWorkflow} className="space-y-4">
              {/* Workflow Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Workflow Name
                </label>
                <input
                  type="text"
                  required
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  placeholder="e.g. Daily Data Center Node Deficit Scan"
                  className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Workflow Operational Objective
                </label>
                <input
                  type="text"
                  value={wfDescription}
                  onChange={(e) => setWfDescription(e.target.value)}
                  placeholder="e.g. Scans server units below minimum threshold and stages PO drafts"
                  className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Trigger Type & Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Trigger Mode
                  </label>
                  <select
                    value={wfTriggerType}
                    onChange={(e) => setWfTriggerType(e.target.value as any)}
                    className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SCHEDULED">SCHEDULED (Cron Cadence)</option>
                    <option value="EVENT_DRIVEN">EVENT-DRIVEN (On Ingestion)</option>
                    <option value="MANUAL">MANUAL (On Demand)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Cadence / Cron
                  </label>
                  <select
                    value={wfCron}
                    onChange={(e) => setWfCron(e.target.value)}
                    className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  >
                    <option value="0 9 * * 1">Every Monday @ 9:00 AM</option>
                    <option value="0 8 * * *">Every Day @ 8:00 AM</option>
                    <option value="0 17 * * *">Every Evening @ 5:00 PM</option>
                    <option value="0 0 1 * *">Monthly (1st Day @ 00:00)</option>
                    <option value="ON_DEMAND">Manual On-Demand</option>
                  </select>
                </div>
              </div>

              {/* Primary Agent & Action */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Lead Specialist Agent
                  </label>
                  <select
                    value={wfPrimaryAgent}
                    onChange={(e) => setWfPrimaryAgent(e.target.value as any)}
                    className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="ATLAS">ATLAS (Infrastructure & Assets)</option>
                    <option value="NOVA">NOVA (Fiscal & Receivables)</option>
                    <option value="SAGE">SAGE (Vision & Document OCR)</option>
                    <option value="ORION">ORION (Strategic Master Planner)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Action Name
                  </label>
                  <input
                    type="text"
                    value={wfActionName}
                    onChange={(e) => setWfActionName(e.target.value)}
                    placeholder="e.g. AUDIT_INVENTORY"
                    className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Pipeline Safety Preview */}
              <div className="p-3.5 rounded-xl bg-[#090f1d] border border-[#1f2d4d] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span className="text-slate-300 text-[11px]">SENTINEL Human Governance Gate is auto-attached</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                  2-STEP DAG
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWf}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{submittingWf ? 'Deploying...' : 'Save & Deploy Workflow'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
