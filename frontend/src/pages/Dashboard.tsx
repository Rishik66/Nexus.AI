import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ApiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency.js';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export const Dashboard: React.FC = () => {
  const { business } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [m, c] = await Promise.all([
          ApiService.getDashboardMetrics(),
          ApiService.getDashboardCharts(),
        ]);
        setMetrics(m);
        setCharts(c);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Aggregating Enterprise Business Health...</p>
        </div>
      </div>
    );
  }

  const m = metrics?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Top Banner: Holistic Business Health Score */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full lg:w-auto">
          {/* Health Score Gauge Display */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#090f1d] border-2 border-cyan-500/40 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {metrics?.healthScore ?? 0}
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-cyan-400 font-bold uppercase">
              / 100 HEALTH
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                STATUS: {metrics?.healthStatus || 'HEALTHY'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {business?.name || 'Apex Global Technologies & Enterprise Solutions'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              Autonomous Business Health Index
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {metrics?.executiveSummary ||
                'Enterprise operational velocity is optimal. Cloud resource margins are positive.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/command-center')}
          className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex-shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          Run AI Health Optimization
        </button>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-xl bg-[#0d1527] border border-[#22345e] hover:border-slate-500 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Paid Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrency(m.totalRevenue ?? 0, business?.currency)}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% from last period</span>
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-semibold flex items-center gap-1"
            >
              <span>+ Record Sale</span>
            </button>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-xl bg-[#0d1527] border border-[#22345e] hover:border-slate-500 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Operating Costs</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrency(m.totalExpenses ?? 0, business?.currency)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Cloud compute burst logged</span>
          </div>
        </div>

        {/* Infrastructure & Asset Depletion Alerts */}
        <div className="p-4 rounded-xl bg-[#0d1527] border border-[#22345e] hover:border-slate-500 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Infrastructure & Asset Alerts</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {m.lowStockCount ?? 0} <span className="text-xs font-normal text-slate-400">Assets</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-cyan-400 font-medium">
            <button
              onClick={() => navigate('/inventory')}
              className="hover:underline flex items-center gap-1"
            >
              Auto-Provision with ATLAS <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Overdue Receivables */}
        <div className="p-4 rounded-xl bg-[#0d1527] border border-[#22345e] hover:border-slate-500 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Overdue Invoices</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {formatCurrency(m.overdueAmount ?? 0, business?.currency)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400 font-medium">
            <span>{m.overdueInvoicesCount ?? 0} invoices past due</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Expense Chart (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Revenue vs Operating Expenditures</h3>
              <p className="text-xs text-slate-400">Historical performance & current operating run-rate</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Costs
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthlyPerformance || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d4d" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Chart (1 column) */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Expense Distribution</h3>
            <p className="text-xs text-slate-400">Categorized operational cost centers</p>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.expenseBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts?.expenseBreakdown || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {(charts?.expenseBreakdown || []).slice(0, 4).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-mono text-slate-400">{formatCurrency(item.value, business?.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anomalies & Immediate Actions Banner */}
      {metrics?.anomalies?.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Autonomous Anomaly Detection Engine
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              {metrics.anomalies.length} Flagged Issues
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.anomalies.map((anom: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#131e38] border border-[#22345e] space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{anom.title}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      anom.severity === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {anom.severity}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">{anom.description}</p>
                <div className="pt-1 text-cyan-400 font-medium text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {anom.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
