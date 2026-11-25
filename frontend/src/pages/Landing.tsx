import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Cpu,
  ShieldCheck,
  TrendingUp,
  Zap,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileText,
  DollarSign,
  Package,
  Activity,
  Bot,
  Users,
  ChevronRight,
  Server,
  Cloud,
  Terminal,
  LogOut,
  Building2,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const agents = [
    {
      name: 'ORION',
      title: 'Strategic Master Planner',
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      border: 'rgba(6, 182, 212, 0.3)',
      desc: 'Decomposes complex enterprise goals into dependency-ordered multi-step execution plans and delegates tasks to domain specialists.',
      skills: ['Natural Language Goal Decomposition', 'Execution DAG Construction', 'Cross-Agent Coordination'],
    },
    {
      name: 'ATLAS',
      title: 'Operations & Asset Lead',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      desc: 'Monitors engineering hardware, cloud compute clusters, and network nodes, calculating unit deficits and staging purchase orders.',
      skills: ['Asset Capacity Auditing', 'Reorder Threshold Calculations', 'Vendor Purchase Order Staging'],
    },
    {
      name: 'NOVA',
      title: 'Fiscal Intelligence & Anomaly Auditor',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      desc: 'Tracks cash flow, analyzes categorized operating costs, catches unbudgeted cloud spend spikes, and flags overdue customer receivables.',
      skills: ['Revenue & Cash Flow Analytics', 'Expenditure Anomaly Detection', 'Receivables Aging & Recovery'],
    },
    {
      name: 'SAGE',
      title: 'Multimodal Vision Subsystem',
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.1)',
      border: 'rgba(168, 85, 247, 0.3)',
      desc: 'Ingests PDF contracts, receipts, and vendor invoices via Gemini Vision OCR, extracting structured data and validating SLA compliance.',
      skills: ['Multimodal Document OCR', 'Line Item & Tax Extraction', 'Automated Ledger Entry Drafting'],
    },
    {
      name: 'SENTINEL',
      title: 'Human-in-the-Loop Governance',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)',
      desc: 'Evaluates risk profiles on all planned agent actions. Requires explicit human authorization before executing financial or database mutations.',
      skills: ['Deterministic Risk Classification', 'Human Authorization Gatekeeping', 'Immutable Audit Logging'],
    },
  ];

  const features = [
    {
      icon: Terminal,
      title: 'Voice & Natural Language Command Center',
      tag: 'Orchestration',
      color: 'text-cyan-400',
      description:
        'Speak or type complex executive instructions in plain English. Watch your 5 AI agents formulate an execution plan, assign dependencies, and execute tools in real time with live streaming telemetry.',
    },
    {
      icon: Package,
      title: 'Operations & Infrastructure Asset Ledger',
      tag: 'Operations',
      color: 'text-emerald-400',
      description:
        'Continuous auditing of developer workstations, server nodes, and network switches. Automatically detects capacity deficits, verifies minimum reorder thresholds, and stages vendor purchase orders.',
    },
    {
      icon: DollarSign,
      title: 'Deterministic Fiscal Intelligence',
      tag: 'Finance',
      color: 'text-amber-400',
      description:
        'Zero guesswork cash flow tracking. Visualizes paid revenue vs. categorized operating expenditures, flags overdue customer invoices with aging metrics, and detects anomalous SaaS or cloud billing spikes.',
    },
    {
      icon: FileText,
      title: 'SAGE Multimodal Document Intelligence',
      tag: 'Computer Vision',
      color: 'text-purple-400',
      description:
        'Upload unstructured B2B service contracts, cloud infrastructure invoices, or receipts (PDF, PNG, JPG). SAGE extracts vendor details, line items, and payment dates to register verified records in your database.',
    },
    {
      icon: ShieldCheck,
      title: 'SENTINEL Human-in-the-Loop Governance',
      tag: 'Safety & Control',
      color: 'text-rose-400',
      description:
        'Autonomous does not mean unsupervised. Any operation carrying financial risk (issuing purchase orders, funds transfer, database updates) pauses at a safety gate until an authorized manager reviews and approves.',
    },
    {
      icon: Activity,
      title: 'Tamper-Evident Immutable Audit Log',
      tag: 'Compliance',
      color: 'text-blue-400',
      description:
        'Every single agent decision, prompt, tool execution, database mutation, and human approval is cryptographically logged with timestamps and user identifiers for enterprise compliance.',
    },
  ];

  const customerProfiles = [
    {
      title: 'Cloud & IT Infrastructure Firms',
      desc: 'Enterprises managing distributed server nodes, engineering workstations, and fluctuating cloud compute expenditures.',
      useCase: 'Auto-provision hardware capacity, monitor cloud cost spikes, and audit vendor agreements.',
    },
    {
      title: 'B2B SaaS & Tech Providers',
      desc: 'Fast-scaling technology firms with multi-tier client subscriptions and operational equipment workflows.',
      useCase: 'Recover overdue client receivables, extract contract terms via vision, and streamline team workflows.',
    },
    {
      title: 'Logistics & Equipment Operators',
      desc: 'Companies balancing multi-vendor supply chains, staged purchase orders, and capacity allocations.',
      useCase: 'Automate reorder triggers, monitor supplier lead times, and govern multi-thousand dollar procurement.',
    },
    {
      title: 'Agile Modern Enterprises',
      desc: 'Organizations eliminating manual data silos and spreadsheet fragmentation in favor of autonomous multi-agent co-pilots.',
      useCase: 'One unified operational command center with real-time Google Gemini 3.5 Flash intelligence.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ============================================================== */}
      {/* 1. TOP NAVBAR */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/80 border-b border-[#1f2d4d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
                NEXUS<span className="text-cyan-400">.AI</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono tracking-wider -mt-1 hidden sm:block">
                AUTONOMOUS ENTERPRISE OS
              </span>
            </div>
          </div>

          {/* Center Navigation Links (Hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">
              Features
            </a>
            <a href="#agents" className="hover:text-cyan-400 transition-colors">
              5 AI Agents
            </a>
            <a href="#who-uses" className="hover:text-cyan-400 transition-colors">
              Who It's For
            </a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">
              How It Works
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/command-center')}
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all"
                >
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={logout}
                  className="p-2.5 rounded-xl bg-[#131e38] hover:bg-[#182442] border border-[#22345e] text-slate-400 hover:text-rose-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/login?tab=signup')}
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION */}
      {/* ============================================================== */}
      <section className="relative pt-16 sm:pt-24 pb-20 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-purple-500/15 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-sm shadow-cyan-500/10">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Multi-Agent Enterprise Operating System</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
            Orchestrate Your Enterprise with{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Autonomous AI Agents
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            From IT infrastructure asset capacity planning to cash flow defense, multimodal document intake, and human-governed execution — NEXUS AI connects 5 specialized autonomous agents into a deterministic, secure enterprise control plane.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/command-center')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>Launch Enterprise Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login?tab=signup')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0d1527] hover:bg-[#131e38] border border-[#22345e] hover:border-cyan-500/50 text-slate-200 font-bold text-sm shadow-lg transition-all"
                >
                  <span>Sign In to Workspace</span>
                </button>
              </>
            )}
          </div>

          {/* Metric Highlights Pill Row */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-[#0d1527]/80 border border-[#22345e] backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-white">5 Agents</div>
              <div className="text-[11px] text-cyan-400 font-mono mt-0.5">Specialized Domain Leads</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0d1527]/80 border border-[#22345e] backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-white">100%</div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">Deterministic Metrics</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0d1527]/80 border border-[#22345e] backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-white">SENTINEL</div>
              <div className="text-[11px] text-amber-400 font-mono mt-0.5">Human Governance Gate</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0d1527]/80 border border-[#22345e] backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-white">Gemini 3.5</div>
              <div className="text-[11px] text-purple-400 font-mono mt-0.5">Live Vision & Reasoning</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. CORE FEATURES SECTION (Detailed Breakdown) */}
      {/* ============================================================== */}
      <section id="features" className="py-20 border-t border-[#1f2d4d] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              Complete Functional Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Everything Your Enterprise Needs to Run Autonomously
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Before logging in, explore the six technological pillars engineered into NEXUS AI. Every feature connects directly to your live database with zero hardcoded placeholders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-[#0d1527] border border-[#22345e] hover:border-cyan-500/40 transition-all space-y-4 shadow-xl flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#131e38] border border-[#22345e] flex items-center justify-center group-hover:border-cyan-500/40 transition-colors">
                        <Icon className={`w-6 h-6 ${feat.color}`} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {feat.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#1f2d4d] flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
                    <span>Explore in Workspace</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. THE 5 SPECIALIZED AGENTS ROSTER */}
      {/* ============================================================== */}
      <section id="agents" className="py-20 border-t border-[#1f2d4d] bg-[#090f1d] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider">
              Cooperating Autonomous Intelligence
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Meet Your 5 Autonomous Specialists
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              No single LLM can reliably operate an enterprise. NEXUS AI partitions operational duties across 5 specialized, collaborating agents with distinct tool sets and role boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="p-6 rounded-3xl bg-[#0d1527] border border-[#22345e] hover:border-slate-500 transition-all space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
                        style={{ backgroundColor: agent.bg, color: agent.color, border: `1px solid ${agent.border}` }}
                      >
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white">{agent.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">{agent.title}</p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {agent.desc}
                  </p>

                  <div className="space-y-1.5 pt-2">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Specialized Capabilities:
                    </p>
                    {agent.skills.map((skill, sIdx) => (
                      <div key={sIdx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. WHO USES NEXUS AI */}
      {/* ============================================================== */}
      <section id="who-uses" className="py-20 border-t border-[#1f2d4d] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Ideal Customer Archetypes
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Engineered for Complex B2B Operations
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              If your organization manages physical or cloud infrastructure, customer invoices, and high-value contracts, NEXUS AI automates your administrative overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {customerProfiles.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#0d1527] border border-[#22345e] space-y-3 shadow-xl"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                <div className="p-3 rounded-xl bg-[#131e38] border border-[#22345e] text-xs text-slate-400">
                  <span className="font-semibold text-cyan-300">Target Workflow: </span>
                  {item.useCase}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. HOW IT WORKS (4 Step Flow) */}
      {/* ============================================================== */}
      <section id="how-it-works" className="py-20 border-t border-[#1f2d4d] bg-[#090f1d] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
              The Autonomous Loop
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              From Plain English Goal to Verified Ledger Update
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-3">
              <span className="text-3xl font-black text-cyan-400">01</span>
              <h4 className="font-bold text-white text-sm">State Your Mission</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Type or speak your goal in the Command Center (e.g. "Audit IT assets and stage purchase orders for depleted units").
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-3">
              <span className="text-3xl font-black text-emerald-400">02</span>
              <h4 className="font-bold text-white text-sm">Autonomous Planning</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                ORION builds an execution DAG, querying live database tables and decomposing tasks to ATLAS, NOVA, or SAGE.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-3">
              <span className="text-3xl font-black text-amber-400">03</span>
              <h4 className="font-bold text-white text-sm">SENTINEL Approval</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                If the action spends money or mutates records, SENTINEL pauses and requests 1-click authorization from your manager.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-3">
              <span className="text-3xl font-black text-purple-400">04</span>
              <h4 className="font-bold text-white text-sm">Verified Ledger Update</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Purchase orders stage, inventory movements record, and immutable audit logs update in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. BOTTOM CALL TO ACTION */}
      {/* ============================================================== */}
      <section className="py-20 border-t border-[#1f2d4d] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Take Command of Your Enterprise?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Create your account now or sign in to access your multi-agent control plane, live telemetry, and autonomous business workflows.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => navigate('/login?tab=signup')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <span>Create Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0d1527] hover:bg-[#131e38] border border-[#22345e] text-slate-200 font-bold text-xs transition-all"
            >
              <span>Sign In to Existing Account</span>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. FOOTER */}
      {/* ============================================================== */}
      <footer className="py-10 border-t border-[#1f2d4d] bg-[#05080f] text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">NEXUS AI Enterprise Operating System</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Powered by Google Gemini 3.5 Flash</span>
            <span>•</span>
            <span>Supabase PostgreSQL</span>
            <span>•</span>
            <span>SOC2 Type II Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
