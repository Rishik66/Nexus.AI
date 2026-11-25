import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Play,
  Square,
  Mic,
  MicOff,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  Bot,
  Terminal,
  FileText,
  RotateCcw,
  Zap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ApiService, ExecutionPlan, PlanStep, AgentRun } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const CommandCenter: React.FC = () => {
  const { business, refreshApprovals } = useAuth();
  const [goal, setGoal] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [pendingApproval, setPendingApproval] = useState<any | null>(null);
  const [approvalDecisionReason, setApprovalDecisionReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Suggested demo prompts for hackathon judges
  const suggestedPrompts = [
    {
      title: 'Low-Stock & PO Restock',
      prompt: 'Find products that are running low on stock and prepare a restocking plan.',
      agent: 'ATLAS',
    },
    {
      title: 'Expense Anomaly Audit',
      prompt: 'Analyze my expenses, detect unusual spending spikes, and identify cost drivers.',
      agent: 'NOVA',
    },
    {
      title: 'Overdue Receivables',
      prompt: 'Check which customer invoices are overdue and create employee follow-up tasks.',
      agent: 'NOVA',
    },
    {
      title: 'Complete 360° Health Check',
      prompt: 'Perform a complete business health check and prepare strategic growth recommendations.',
      agent: 'ORION',
    },
  ];

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
    }
  }, []);

  const toggleVoiceRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or type your goal.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setGoal((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Handle file attachment for document intelligence
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      // Auto-populate goal with multimodal context
      setGoal(`Analyze this uploaded document "${file.name}", extract structured line items, verify against database, and draft records.`);

      // Upload and run extraction
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await ApiService.uploadDocument(formData);
        setUploadSummary(`Extracted ${res.extracted?.items?.length || 0} line items totaling $${res.extracted?.totalAmount?.toFixed(2) || '0.00'} (${res.method})`);
      } catch (err: any) {
        console.error('Document extraction error:', err);
      }
    }
  };

  // Step 1: Generate Plan with ORION
  const handleGeneratePlan = async () => {
    if (!goal.trim()) return;
    setIsPlanning(true);
    setPlan(null);
    setActiveRun(null);
    setLiveEvents([]);
    setPendingApproval(null);

    try {
      const generatedPlan = await ApiService.planGoal(goal);
      setPlan(generatedPlan);
    } catch (err: any) {
      alert(`Plan generation failed: ${err.message}`);
    } finally {
      setIsPlanning(false);
    }
  };

  // Step 2: Execute Plan
  const handleExecutePlan = async () => {
    if (!plan) return;
    setIsExecuting(true);
    setLiveEvents([]);
    setPendingApproval(null);

    try {
      const { runId } = await ApiService.executePlan(plan.goal, plan);

      // Connect to Server-Sent Events (SSE) live trace
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const sse = new EventSource(`/api/agent-runs/${runId}/stream`);
      eventSourceRef.current = sse;

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setLiveEvents((prev) => [payload, ...prev]);

          if (payload.type === 'APPROVAL_REQUIRED') {
            setPendingApproval(payload.data);
            refreshApprovals();
          }

          if (payload.type === 'RUN_COMPLETE' || payload.type === 'RUN_STOPPED' || payload.type === 'RUN_ERROR') {
            setIsExecuting(false);
            refreshApprovals();
            // Refresh run details
            ApiService.getAgentRun(runId).then(setActiveRun).catch(console.error);
            sse.close();
          }
        } catch (e) {
          // ignore non-json heartbeat
        }
      };

      sse.onerror = () => {
        // SSE closed
        setIsExecuting(false);
      };

      // Initial fetch of run
      const run = await ApiService.getAgentRun(runId);
      setActiveRun(run);
    } catch (err: any) {
      alert(`Execution failed: ${err.message}`);
      setIsExecuting(false);
    }
  };

  // Stop Execution Control
  const handleStopExecution = async () => {
    if (!activeRun) return;
    try {
      await ApiService.stopExecution(activeRun.id);
      setIsExecuting(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      const updated = await ApiService.getAgentRun(activeRun.id);
      setActiveRun(updated);
    } catch (err: any) {
      alert(`Failed to stop execution: ${err.message}`);
    }
  };

  // Human In The Loop Decision
  const handleApprovalDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!pendingApproval) return;
    try {
      await ApiService.decideApproval(
        pendingApproval.approvalId,
        decision,
        approvalDecisionReason || `Decided by human manager as ${decision}`
      );
      setPendingApproval(null);
      setApprovalDecisionReason('');
      await refreshApprovals();
    } catch (err: any) {
      alert(`Approval decision failed: ${err.message}`);
    }
  };

  // Helper colors for agents
  const getAgentColor = (name: string) => {
    switch (name) {
      case 'ORION':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'ATLAS':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'NOVA':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'SAGE':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'SENTINEL':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Core Autonomous Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">Plan → Act → Observe → Evaluate → Replan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Command Center
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Issue natural language goals to NEXUS AI. ORION will formulate an execution plan, assign specialist agents (ATLAS, NOVA, SAGE), invoke enterprise tools, and enforce SENTINEL human approval gates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isExecuting && (
              <button
                onClick={handleStopExecution}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 animate-pulse transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                STOP EXECUTION
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Command Chips */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          Suggested Autonomous Business Commands:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {suggestedPrompts.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setGoal(s.prompt);
              }}
              className="p-3 text-left rounded-xl bg-[#0d1527] border border-[#22345e] hover:border-cyan-500/50 hover:bg-[#131e38] transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  {s.title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {s.agent}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">{s.prompt}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Command Input Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] shadow-xl space-y-4">
        <div className="relative">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Type or speak a business goal... (e.g. 'Audit low stock items, calculate optimal reorder units, and stage purchase orders for human review')"
            rows={3}
            className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
          />

          {/* Voice & Attachment Actions inside the input box */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload invoice/document for multimodal intelligence"
              className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                attachedFile
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-[#182442] text-slate-400 border-[#22345e] hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleVoiceRecognition}
              title={isListening ? 'Listening... click to stop' : 'Voice input (Web Speech API)'}
              className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                isListening
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-[#182442] text-slate-400 border-[#22345e] hover:text-white'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Uploaded File Banner if present */}
        {attachedFile && (
          <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-cyan-200">{attachedFile.name}</span>
              {uploadSummary && (
                <span className="text-slate-400">({uploadSummary})</span>
              )}
            </div>
            <button
              onClick={() => {
                setAttachedFile(null);
                setUploadSummary(null);
              }}
              className="text-slate-400 hover:text-rose-400 text-xs"
            >
              Remove
            </button>
          </div>
        )}

        {/* Voice indicator bar if listening */}
        {isListening && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-pulse">
            <div className="flex items-center gap-1">
              <span className="w-1 h-3 bg-rose-400 voice-bar"></span>
              <span className="w-1 h-5 bg-rose-400 voice-bar"></span>
              <span className="w-1 h-2 bg-rose-400 voice-bar"></span>
            </div>
            <span>Listening to your voice... Speak your goal clearly.</span>
          </div>
        )}

        {/* Action Button: Generate Plan */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            ORION Multi-Agent Decomposition
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={!goal.trim() || isPlanning || isExecuting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
          >
            {isPlanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ORION Planning...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Execution Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* STEP 1: Structured Editable Execution Plan */}
      {plan && (
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22345e] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Editable Plan
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {plan.steps.length} Sequential Steps
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{plan.summary}</p>
            </div>

            {!isExecuting && (
              <button
                onClick={handleExecutePlan}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex-shrink-0"
              >
                <Play className="w-4 h-4 fill-white" />
                Launch Multi-Agent Execution
              </button>
            )}
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {plan.steps.map((step, idx) => (
              <div
                key={step.id || idx}
                className="p-3.5 rounded-xl bg-[#131e38] border border-[#22345e] flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:border-slate-500"
              >
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                    {step.stepIndex}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${getAgentColor(
                          step.agentName
                        )}`}
                      >
                        {step.agentName}
                      </span>

                      {step.toolName && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300 border border-slate-700">
                          {step.toolName}
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          step.riskLevel === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : step.riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {step.riskLevel} RISK
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium">{step.description}</p>
                  </div>
                </div>

                {/* Step status indicator */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  {step.status === 'COMPLETED' ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                  ) : step.status === 'RUNNING' ? (
                    <span className="flex items-center gap-1 text-[11px] text-cyan-400 font-semibold animate-pulse">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Executing
                    </span>
                  ) : step.status === 'WAITING_APPROVAL' ? (
                    <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold animate-bounce">
                      <AlertTriangle className="w-3.5 h-3.5" /> Needs Approval
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Approval Gate Card (Shows when SENTINEL halts on MEDIUM/HIGH risk) */}
      {pendingApproval && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/30 text-amber-300 border border-amber-500/50">
                    HUMAN APPROVAL REQUIRED
                  </span>
                  <span className="text-xs text-rose-400 font-bold font-mono">
                    {pendingApproval.riskLevel} RISK OPERATION
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  SENTINEL Safety Gate: Action Intercepted
                </h3>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#090f1d] border border-amber-500/30 space-y-2">
            <p className="text-xs text-slate-200 font-medium">
              <span className="text-amber-400 font-bold">Planned Action: </span>
              {pendingApproval.description}
            </p>
            {pendingApproval.payload && (
              <pre className="text-[11px] font-mono text-cyan-300 bg-[#060a14] p-2.5 rounded-lg overflow-x-auto border border-[#22345e]">
                {JSON.stringify(pendingApproval.payload, null, 2)}
              </pre>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <input
              type="text"
              value={approvalDecisionReason}
              onChange={(e) => setApprovalDecisionReason(e.target.value)}
              placeholder="Optional approval note or reason..."
              className="text-xs bg-[#131e38] border border-[#22345e] rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 flex-1"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApprovalDecision('REJECTED')}
                className="px-4 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all"
              >
                Reject Action
              </button>
              <button
                onClick={() => handleApprovalDecision('APPROVED')}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Authorize & Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Live Execution Trace / Timeline */}
      {(isExecuting || liveEvents.length > 0 || activeRun) && (
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-4">
          <div className="flex items-center justify-between border-b border-[#22345e] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Live Agent Execution Trace
                {isExecuting && (
                  <span className="text-[10px] text-cyan-400 font-mono font-normal">
                    (Streaming Real-Time)
                  </span>
                )}
              </h2>
            </div>
            {activeRun && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                  activeRun.status === 'COMPLETED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : activeRun.status === 'STOPPED'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                STATUS: {activeRun.status}
              </span>
            )}
          </div>

          {/* Trace Event Log */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {liveEvents.map((evt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#131e38] border border-[#22345e] text-xs space-y-1.5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {evt.agentName && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${getAgentColor(
                          evt.agentName
                        )}`}
                      >
                        {evt.agentName}
                      </span>
                    )}
                    <span className="font-semibold text-slate-200">{evt.type}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {evt.data?.toolName && (
                  <div className="font-mono text-[11px] text-cyan-300 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Tool: {evt.data.toolName}</span>
                  </div>
                )}

                {evt.data?.output && (
                  <div className="bg-[#090f1d] p-2 rounded-lg font-mono text-[10px] text-slate-300 overflow-x-auto border border-[#22345e]/50">
                    <pre>{JSON.stringify(evt.data.output, null, 2)}</pre>
                  </div>
                )}

                {evt.data?.step?.description && (
                  <p className="text-slate-300">{evt.data.step.description}</p>
                )}
              </div>
            ))}
          </div>

          {/* Final Executive Briefing Card */}
          {activeRun?.status === 'COMPLETED' && activeRun.results && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border border-emerald-500/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                ORION Executive Execution Summary
              </div>
              <p className="text-xs text-slate-200">
                All planned specialist agent operations completed successfully with full verification.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2 rounded bg-black/30 border border-[#22345e]">
                  <p className="text-[10px] text-slate-400 font-medium">Tasks Finished</p>
                  <p className="text-sm font-bold text-white">
                    {activeRun.results.completedTasks} / {activeRun.results.totalTasks}
                  </p>
                </div>
                <div className="p-2 rounded bg-black/30 border border-[#22345e]">
                  <p className="text-[10px] text-slate-400 font-medium">Tools Utilized</p>
                  <p className="text-sm font-bold text-cyan-400">
                    {activeRun.results.toolsUsed?.length || 0}
                  </p>
                </div>
                <div className="p-2 rounded bg-black/30 border border-[#22345e]">
                  <p className="text-[10px] text-slate-400 font-medium">Safety Status</p>
                  <p className="text-sm font-bold text-emerald-400">SENTINEL Verified</p>
                </div>
                <div className="p-2 rounded bg-black/30 border border-[#22345e]">
                  <p className="text-[10px] text-slate-400 font-medium">Audit Trail</p>
                  <p className="text-sm font-bold text-purple-400">Persisted</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
