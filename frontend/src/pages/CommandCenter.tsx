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
  Cpu,
  Layers,
  ShieldCheck,
  BarChart3,
  FileSearch,
  Mail,
  TrendingUp,
  HardDrive,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { ApiService, ExecutionPlan, PlanStep, AgentRun, AgentName } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface AIModelDefinition {
  name: AgentName;
  role: string;
  tagline: string;
  avatarColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  foundationEngine: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  whatItCanDo: string[];
  authorizedTools: string[];
  domain: string;
  riskBoundary: string;
  suggestedPrompt: {
    title: string;
    prompt: string;
  };
}

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
  const [selectedModel, setSelectedModel] = useState<AgentName | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');
  const [expandedModel, setExpandedModel] = useState<AgentName | null>('ORION');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Complete Catalog of AI Models & Specialist Agents with deep capability descriptions
  const AI_MODELS: AIModelDefinition[] = [
    {
      name: 'ORION',
      role: 'Master Strategic Orchestrator & Planner',
      tagline: 'Dynamic Goal Decomposition, Multi-Agent Delegation & Executive Synthesis',
      avatarColor: '#0ea5e9',
      accentBg: 'bg-cyan-500/10',
      accentBorder: 'border-cyan-500/30',
      accentText: 'text-cyan-400',
      foundationEngine: 'Gemini 3.5 Flash / Gemini 2.5 Pro Neural Orchestrator',
      icon: Zap,
      summary:
        'The primary coordinating intelligence of NEXUS AI. Takes complex high-level enterprise directives, decomposes them into sequential dependency graphs, assigns tasks to specialist domain models, and synthesizes final executive briefings.',
      whatItCanDo: [
        'Natural-language goal decomposition into ordered, dependency-aware execution steps',
        'Dynamic multi-agent delegation & cross-domain workflow handoffs',
        'Holistic 360° business health audits synthesizing revenue, compute, and inventory telemetry',
        'Autonomous conflict resolution, execution replanning, and executive outcome synthesis',
      ],
      authorizedTools: ['BUSINESS_ANALYTICS', 'ORCHESTRATOR_DELEGATION'],
      domain: 'Platform-Wide Strategy, Multi-Agent Coordination & Executive Synthesis',
      riskBoundary: 'Orchestrates workflows; routes all state modifications through SENTINEL approval gates',
      suggestedPrompt: {
        title: '360° Enterprise Health Audit',
        prompt:
          'Perform a complete 360-degree business health check and formulate operational growth recommendations.',
      },
    },
    {
      name: 'ATLAS',
      role: 'Enterprise Operations & Infrastructure Specialist',
      tagline: 'Cloud Node Sizing, Asset Provisioning & Vendor Procurement Staging',
      avatarColor: '#10b981',
      accentBg: 'bg-emerald-500/10',
      accentBorder: 'border-emerald-500/30',
      accentText: 'text-emerald-400',
      foundationEngine: 'Gemini Compute & Operational Optimization Engine',
      icon: HardDrive,
      summary:
        'Manages enterprise hardware assets, compute cluster allocations, vendor SLAs, and supply chain logistics. Automatically calculates replenishment quantities and stages purchase orders for human review.',
      whatItCanDo: [
        'Real-time IT infrastructure and cloud compute capacity threshold monitoring',
        'Automatic calculation of hardware replenishment and developer workstation orders',
        'Enterprise vendor lead-time, pricing tier, and SLA fulfillment rate analysis',
        'Staging procurement requisitions and purchase orders for human manager sign-off',
        'Physical asset tracking, inventory movement logs, and internal task routing',
      ],
      authorizedTools: ['DATABASE_SEARCH', 'DATABASE_UPDATE', 'BUSINESS_CALCULATOR'],
      domain: 'Cloud Infrastructure, Hardware Logistics, Vendor Procurement & Task Routing',
      riskBoundary: 'Classified as MEDIUM risk for inventory updates/PO staging; requires manager authorization',
      suggestedPrompt: {
        title: 'Infrastructure & Asset Procurement',
        prompt:
          'Audit operational IT assets and cloud compute capacity, calculate needed units, and stage procurement orders.',
      },
    },
    {
      name: 'NOVA',
      role: 'Finance Intelligence & Fiscal Anomaly Specialist',
      tagline: 'Fiscal Clarity, Expense Anomaly Auditing, Invoicing & Cash Flow',
      avatarColor: '#f59e0b',
      accentBg: 'bg-amber-500/10',
      accentBorder: 'border-amber-500/30',
      accentText: 'text-amber-400',
      foundationEngine: 'Gemini Fiscal Reasoning & Algorithmic Ledger Engine',
      icon: BarChart3,
      summary:
        'NEXUS AI’s fiscal watchdog. Performs mathematical audits on operational expenses, identifies runaway SaaS leakages, executes overdue receivables sweeps, and projects working capital runway.',
      whatItCanDo: [
        'Real-time revenue, gross profit margin, and burn rate arithmetic without fabrication',
        'Overdue accounts receivable aging sweeps with customer balance calculations',
        'Autonomous expense anomaly detection and unbudgeted cloud burst isolation',
        'Multi-currency live exchange rate conversion across USD, EUR, GBP, INR, JPY',
        'Working capital stress tests, cash runway projections, and fiscal forecasting',
      ],
      authorizedTools: [
        'BUSINESS_CALCULATOR',
        'DATABASE_SEARCH',
        'DATABASE_UPDATE',
        'CURRENCY_CONVERSION',
        'BUSINESS_ANALYTICS',
      ],
      domain: 'Corporate Finance, Ledgers, Overdue Invoices & Cash Flow Runway',
      riskBoundary: 'Read-only telemetry is LOW risk; ledger mutations or adjustments require approval',
      suggestedPrompt: {
        title: 'Expense Anomaly & Cloud Audit',
        prompt:
          'Analyze operating expenses, detect unbudgeted cloud overage spikes, and isolate SaaS cost leakages.',
      },
    },
    {
      name: 'SAGE',
      role: 'Research & Multimodal Intelligence Specialist',
      tagline: 'Multimodal Vision OCR, Contract Extraction & Market Intelligence',
      avatarColor: '#8b5cf6',
      accentBg: 'bg-purple-500/10',
      accentBorder: 'border-purple-500/30',
      accentText: 'text-purple-400',
      foundationEngine: 'Gemini 2.5 Pro Vision & Multimodal Extraction Engine',
      icon: FileSearch,
      summary:
        'Unlocks unstructured enterprise documentation using native multimodal vision. Extracts structured tables and line items from vendor invoices, MSAs, and receipts, cross-referencing against database records.',
      whatItCanDo: [
        'Multimodal vision parsing of PDF vendor invoices, receipts, and billing statements',
        'B2B service contracts & Master Service Agreement (MSA) clause compliance audits',
        'Automatic line-item extraction with subtotal, tax, and total amount validation',
        'Cross-referencing scanned invoices against internal supplier catalogs to prevent billing fraud',
        'Unstructured market research report synthesis and competitive trend discovery',
      ],
      authorizedTools: ['DOCUMENT_ANALYSIS', 'DATABASE_SEARCH', 'BUSINESS_ANALYTICS'],
      domain: 'Document Intelligence, Contract Vision, Unstructured Data & Market Research',
      riskBoundary: 'LOW risk during parsing; drafts verified transactions for human sign-off',
      suggestedPrompt: {
        title: 'Multimodal Invoice & MSA Audit',
        prompt:
          'Analyze uploaded vendor invoice or contract, extract structured line items, verify against database, and draft records.',
      },
    },
    {
      name: 'SENTINEL',
      role: 'Quality, Security & Safety Controller',
      tagline: 'Risk Classification, Prompt-Injection Defense & Human Gatekeeper',
      avatarColor: '#ef4444',
      accentBg: 'bg-rose-500/10',
      accentBorder: 'border-rose-500/30',
      accentText: 'text-rose-400',
      foundationEngine: 'Gemini Safety Classifier & Guardrail Engine',
      icon: ShieldCheck,
      summary:
        'The autonomous safety supervisor. Inspects every agent action before execution, calculates risk scores (LOW/MEDIUM/HIGH), enforces human-in-the-loop approvals on consequential tasks, and logs immutable audit trails.',
      whatItCanDo: [
        'Real-time operational risk scoring on every tool call and agent delegation',
        'Human-in-the-loop approval gate enforcement: halts execution on MEDIUM/HIGH risk',
        'Input parameter sanity checks and anti-prompt injection defense',
        'Protection against runaway loops, infinite retries, and budget overruns',
        'Cryptographic audit trail logging for full SOC-2 / enterprise compliance',
      ],
      authorizedTools: ['BUSINESS_ANALYTICS'],
      domain: 'Operational Security, System Safety, Compliance & Human Authorization',
      riskBoundary: 'Independent gatekeeper; cannot be bypassed by other autonomous agents',
      suggestedPrompt: {
        title: 'Enterprise Safety & Risk Audit',
        prompt:
          'Perform a comprehensive security audit of pending agent approvals, high-risk purchase orders, and system safety constraints.',
      },
    },
    {
      name: 'HERMES',
      role: 'Customer Communications & CRM Outreach Specialist',
      tagline: 'Receivables Follow-Ups, Escalation Messaging & Partner Notices',
      avatarColor: '#6366f1',
      accentBg: 'bg-indigo-500/10',
      accentBorder: 'border-indigo-500/30',
      accentText: 'text-indigo-400',
      foundationEngine: 'Gemini Contextual Language & Relationship Engine',
      icon: Mail,
      summary:
        'Manages customer relationships and communications. Automatically drafts polite, effective overdue invoice reminders, coordinates client dispute resolutions, and monitors partner engagement health.',
      whatItCanDo: [
        'Automated accounts receivable reminder drafting with personalized invoice summaries',
        'Contextual customer payment dispute triage and resolution messaging',
        'VIP client account health monitoring and proactive churn risk detection',
        'Multi-channel communication dispatch with mandatory SENTINEL safety checks',
      ],
      authorizedTools: ['EMAIL_NOTIFICATION', 'DATABASE_SEARCH', 'BUSINESS_ANALYTICS'],
      domain: 'Customer Relations, CRM Outreach, Collections Communications & VIP Messaging',
      riskBoundary: 'HIGH risk on external emails; enforces human approval before sending',
      suggestedPrompt: {
        title: 'Client Invoices & Receivables',
        prompt:
          'Check which client invoices are overdue and create employee accounts receivable recovery tasks.',
      },
    },
    {
      name: 'APEX',
      role: 'Executive Strategy & Market Forecasting Specialist',
      tagline: 'Competitive Benchmarking, Strategic Roadmapping & Capital Allocation',
      avatarColor: '#14b8a6',
      accentBg: 'bg-teal-500/10',
      accentBorder: 'border-teal-500/30',
      accentText: 'text-teal-400',
      foundationEngine: 'Gemini Predictive Business Dynamics Engine',
      icon: TrendingUp,
      summary:
        'C-Suite strategic co-pilot. Synthesizes cross-functional telemetry into forward-looking financial scenarios (conservative, baseline, aggressive), evaluates pricing elasticity, and guides working capital allocation.',
      whatItCanDo: [
        'Executive KPI synthesis across operations, sales, cash flow, and team velocity',
        'Multi-scenario quarterly revenue and runway modeling (conservative, baseline, aggressive)',
        'Competitive benchmarking, pricing elasticity analysis, and market trend forecasts',
        'Capital allocation recommendations for cloud expansion and hiring roadmaps',
      ],
      authorizedTools: ['BUSINESS_ANALYTICS', 'BUSINESS_CALCULATOR', 'DATABASE_SEARCH'],
      domain: 'Executive Strategy, Market Intelligence, Scenario Modeling & Capital Planning',
      riskBoundary: 'Advisory & strategic forecasting; generates actionable board-level briefs',
      suggestedPrompt: {
        title: 'Executive Growth & Scenario Modeling',
        prompt:
          'Model quarterly enterprise growth scenarios across conservative, baseline, and aggressive runway assumptions.',
      },
    },
  ];

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
      case 'HERMES':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'APEX':
        return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

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
      setGoal(`Analyze this uploaded document "${file.name}", extract structured line items, verify against database, and draft records.`);

      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await ApiService.uploadDocument(formData);
        setUploadSummary(
          `Extracted ${res.extracted?.items?.length || 0} line items totaling $${
            res.extracted?.totalAmount?.toFixed(2) || '0.00'
          } (${res.method})`
        );
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
            ApiService.getAgentRun(runId).then(setActiveRun).catch(console.error);
            sse.close();
          }
        } catch (e) {
          // ignore non-json heartbeat
        }
      };

      sse.onerror = () => {
        setIsExecuting(false);
      };

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

  const handleSelectModel = (modelName: AgentName) => {
    setSelectedModel(modelName);
    setExpandedModel(modelName);
  };

  const handleApplyPrompt = (promptText: string) => {
    setGoal(promptText);
    const inputElement = document.querySelector('textarea');
    if (inputElement) {
      inputElement.focus();
    }
  };

  // Filtered prompt list based on selected model
  const displayedPrompts =
    selectedModel === 'ALL'
      ? AI_MODELS.map((m) => ({ ...m.suggestedPrompt, agent: m.name }))
      : AI_MODELS.filter((m) => m.name === selectedModel).map((m) => ({
          ...m.suggestedPrompt,
          agent: m.name,
        }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Core Autonomous Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                7 Specialized AI Models
              </span>
              <span className="text-xs text-slate-400 font-mono">Plan → Act → Observe → Evaluate → Replan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Command Center
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Issue natural language goals to NEXUS AI. ORION coordinates multi-agent decomposition across ATLAS, NOVA, SAGE, HERMES, and APEX, backed by SENTINEL human approval gatekeepers.
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

      {/* SECTION: Complete AI Models & What Each AI Model Can Do */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1527] border border-[#22345e] shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#22345e] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Bot className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Specialized AI Models & Neural Agents
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Click any AI model to explore what it can do, review authorized enterprise tools, and execute targeted autonomous tasks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedModel('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedModel === 'ALL'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-[#131e38] text-slate-400 hover:text-white border border-[#22345e]'
              }`}
            >
              All Models ({AI_MODELS.length})
            </button>
            {AI_MODELS.map((m) => (
              <button
                key={m.name}
                onClick={() => handleSelectModel(m.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all font-mono ${
                  selectedModel === m.name
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'bg-[#131e38] text-slate-400 hover:text-white border border-[#22345e]'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* AI Models Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {AI_MODELS.map((model) => {
            const Icon = model.icon;
            const isSelected = selectedModel === model.name;
            const isExpanded = expandedModel === model.name;

            return (
              <div
                key={model.name}
                onClick={() => setExpandedModel(isExpanded ? null : model.name)}
                className={`p-4 rounded-xl bg-[#131e38] border transition-all cursor-pointer flex flex-col justify-between hover:border-slate-400 group ${
                  isSelected
                    ? 'border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-500/10'
                    : 'border-[#22345e]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: `${model.avatarColor}20`, color: model.avatarColor }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-sm text-white">{model.name}</h3>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{model.role}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${model.accentText} ${model.accentBg} ${model.accentBorder}`}
                    >
                      ONLINE
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 font-medium mb-3 line-clamp-2">
                    {model.tagline}
                  </p>

                  <div className="space-y-1 mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>What It Can Do:</span>
                      <span className="text-[10px] text-cyan-400 font-normal">
                        {isExpanded ? 'Hide' : 'View all'}
                      </span>
                    </p>
                    <ul className="space-y-1">
                      {model.whatItCanDo.slice(0, isExpanded ? 5 : 2).map((item, idx) => (
                        <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                          <span className={model.accentText}>•</span>
                          <span className="leading-tight">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#1f2d4d] space-y-2 mt-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">Tools: {model.authorizedTools.length}</span>
                    <span className="text-slate-500 font-mono line-clamp-1 max-w-[120px]">
                      {model.authorizedTools[0]}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyPrompt(model.suggestedPrompt.prompt);
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      model.accentBg
                    } ${model.accentText} border ${model.accentBorder} hover:brightness-125`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Try {model.name} Model
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Model Capability Deep-Dive Drawer */}
        {expandedModel && (
          <div className="p-5 rounded-xl bg-[#0b1222] border border-[#22345e] space-y-4 animate-in fade-in duration-200">
            {(() => {
              const active = AI_MODELS.find((m) => m.name === expandedModel) || AI_MODELS[0];
              const Icon = active.icon;

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2d4d] pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${active.avatarColor}20`, color: active.avatarColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-white">{active.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                            Operational
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{active.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApplyPrompt(active.suggestedPrompt.prompt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          active.accentBg
                        } ${active.accentText} ${active.accentBorder} hover:brightness-125`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Load {active.name} Prompt
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{active.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="p-3.5 rounded-xl bg-[#131e38] border border-[#22345e] space-y-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        What {active.name} Can Do (Capabilities):
                      </h4>
                      <ul className="space-y-1.5">
                        {active.whatItCanDo.map((cap, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className={active.accentText}>✔</span>
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#131e38] border border-[#22345e] space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                          Authorized Tools & Data Access:
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {active.authorizedTools.map((tool) => (
                            <span
                              key={tool}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#090f1d] text-cyan-300 border border-cyan-500/30"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#1f2d4d]">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                          Safety & Risk Boundary:
                        </h4>
                        <p className="text-[11px] text-slate-400">{active.riskBoundary}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Suggested Command Chips */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Suggested Autonomous Business Commands:
          </p>
          {selectedModel !== 'ALL' && (
            <button
              onClick={() => setSelectedModel('ALL')}
              className="text-xs text-cyan-400 hover:underline"
            >
              Show commands for all models
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {displayedPrompts.map((s, idx) => (
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
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getAgentColor(
                    s.agent
                  )}`}
                >
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
            placeholder="Type or speak an enterprise goal... (e.g. 'Audit operational IT assets, calculate needed developer workstations, and stage procurement orders for human review')"
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
            Multi-Agent Neural Decomposition
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
