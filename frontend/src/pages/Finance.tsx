import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { ApiService } from '../services/api.js';

export const Finance: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'EXPENSES'>('INVOICES');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        setLoading(true);
        const [invRes, expRes, ovrRes] = await Promise.all([
          ApiService.getInvoices(),
          ApiService.getExpenses(),
          ApiService.getOverdueInvoices(),
        ]);
        setInvoices(invRes || []);
        setExpenses(expRes.expenses || []);
        setTotalExpenses(expRes.totalExpenses || 0);
        setOverdueCount(ovrRes.count || 0);
        setOverdueAmount(ovrRes.totalOverdueAmount || 0);
      } catch (err) {
        console.error('Failed to load finance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              NOVA Fiscal Intelligence
            </span>
            <span className="text-xs text-slate-400 font-mono">Revenue, Invoicing & Expense Audit</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Finance Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic cash flow tracking, overdue customer receivables aging, and automated expenditure anomaly detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#131e38] border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            Overdue Exposure: ${overdueAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Overdue Alert Banner if present */}
      {overdueCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-rose-200">
                {overdueCount} Overdue Invoices Totaling ${overdueAmount.toFixed(2)}
              </p>
              <p className="text-rose-400 text-[11px]">
                Operating cash flow is delayed. NOVA recommends deploying customer reminder tasks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#22345e] pb-1">
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'INVOICES'
              ? 'bg-[#182442] text-cyan-400 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Customer Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'EXPENSES'
              ? 'bg-[#182442] text-cyan-400 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Operating Expenses ({expenses.length})
        </button>
      </div>

      {/* Invoices View */}
      {activeTab === 'INVOICES' && (
        <div className="rounded-xl bg-[#0d1527] border border-[#22345e] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#131e38] text-slate-400 border-b border-[#22345e] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2d4d]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#131e38]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {inv.customer_name || 'Customer'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{inv.issue_date}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{inv.due_date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      ${Number(inv.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {inv.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> PAID
                        </span>
                      ) : inv.status === 'OVERDUE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> OVERDUE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <Clock className="w-3 h-3" /> ISSUED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses View */}
      {activeTab === 'EXPENSES' && (
        <div className="rounded-xl bg-[#0d1527] border border-[#22345e] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#131e38] text-slate-400 border-b border-[#22345e] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2d4d]">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-[#131e38]/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {e.description}
                      {e.description.includes('Anomalous') && (
                        <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          SPIKE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{e.date}</td>
                    <td className="py-3 px-4 text-slate-400">{e.payment_method}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      -${Number(e.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
