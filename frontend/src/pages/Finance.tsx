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
  Plus,
  X,
  Building2,
  Sparkles,
  Check,
} from 'lucide-react';
import { ApiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { formatCurrency, getCurrencySymbol } from '../utils/currency.js';

export const Finance: React.FC = () => {
  const { business } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'EXPENSES'>('INVOICES');
  const [loading, setLoading] = useState(true);

  // Sales modal state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [saleDescription, setSaleDescription] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [saleUnitPrice, setSaleUnitPrice] = useState('');
  const [saleTax, setSaleTax] = useState('0');
  const [saleStatus, setSaleStatus] = useState<'ISSUED' | 'PAID'>('PAID');
  const [saleDueDate, setSaleDueDate] = useState(() => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [saleNotes, setSaleNotes] = useState('');
  const [submittingSale, setSubmittingSale] = useState(false);
  const [saleMessage, setSaleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  useEffect(() => {
    fetchFinance();
  }, []);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const unitPrice = parseFloat(saleUnitPrice);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      setSaleMessage({ type: 'error', text: 'Please enter a valid sale unit price.' });
      return;
    }

    const qty = Number(saleQuantity) || 1;
    const subtotal = qty * unitPrice;
    const tax = parseFloat(saleTax) || 0;

    try {
      setSubmittingSale(true);
      setSaleMessage(null);
      await ApiService.createInvoice({
        customer_name: customerName.trim() || 'Enterprise Client',
        subtotal,
        tax_amount: tax,
        status: saleStatus,
        due_date: saleDueDate,
        notes: saleNotes.trim(),
        items: [
          {
            description: saleDescription.trim() || 'Enterprise Cloud & Managed Services',
            quantity: qty,
            unit_price: unitPrice,
            total_price: subtotal,
          },
        ],
      });

      setSaleMessage({
        type: 'success',
        text: `Sale recorded successfully! Invoice generated for ${customerName || 'Client'}.`,
      });

      // Refresh finance tables
      await fetchFinance();

      // Reset form & close modal after brief delay
      setTimeout(() => {
        setCustomerName('');
        setSaleDescription('');
        setSaleUnitPrice('');
        setSaleNotes('');
        setIsSaleModalOpen(false);
        setSaleMessage(null);
      }, 1200);
    } catch (err: any) {
      setSaleMessage({ type: 'error', text: err.message || 'Failed to record sale.' });
    } finally {
      setSubmittingSale(false);
    }
  };

  const curr = business?.currency || 'USD';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              NOVA Fiscal Intelligence
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Operating Currency: <strong className="text-cyan-400">{curr} ({getCurrencySymbol(curr)})</strong>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Finance Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic cash flow tracking, overdue customer receivables aging, and automated expenditure anomaly detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#131e38] border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            Overdue Exposure: {formatCurrency(overdueAmount, curr)}
          </div>
          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Sale / Invoice</span>
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner if present */}
      {overdueCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-rose-200">
                {overdueCount} Overdue Invoices Totaling {formatCurrency(overdueAmount, curr)}
              </p>
              <p className="text-rose-400 text-[11px]">
                Operating cash flow is delayed. NOVA recommends deploying customer reminder tasks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#22345e] pb-1">
        <div className="flex items-center gap-2">
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

        <button
          onClick={() => setIsSaleModalOpen(true)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Sale</span>
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
                  <th className="py-3 px-4">Total Amount ({getCurrencySymbol(curr)})</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2d4d]">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 space-y-3">
                      <p>No sales or customer invoices recorded yet.</p>
                      <button
                        onClick={() => setIsSaleModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Record First Sale
                      </button>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
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
                        {formatCurrency(inv.total_amount, curr)}
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
                  ))
                )}
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
                  <th className="py-3 px-4 text-right">Amount ({getCurrencySymbol(curr)})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2d4d]">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No operating expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
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
                        -{formatCurrency(e.amount, curr)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record New Sale & Create Invoice Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0d1527] border border-[#22345e] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#22345e]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Record New Sale & Customer Invoice</h3>
                  <p className="text-[11px] text-slate-400">Adds transaction directly into your financial ledger</p>
                </div>
              </div>
              <button
                onClick={() => setIsSaleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saleMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  saleMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}
              >
                {saleMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{saleMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateSale} className="space-y-4">
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Customer / Client Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Apex Global Industries"
                    className="w-full bg-[#131e38] border border-[#22345e] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Service / Item Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Sales Item / Service Description
                </label>
                <input
                  type="text"
                  required
                  value={saleDescription}
                  onChange={(e) => setSaleDescription(e.target.value)}
                  placeholder="e.g. Enterprise Cloud Compute Provisioning (Annual)"
                  className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Price & Quantity Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Unit Price ({getCurrencySymbol(curr)})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={saleUnitPrice}
                    onChange={(e) => setSaleUnitPrice(e.target.value)}
                    placeholder="2500.00"
                    className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Status and Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Payment Status
                  </label>
                  <select
                    value={saleStatus}
                    onChange={(e) => setSaleStatus(e.target.value as any)}
                    className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
                  >
                    <option value="PAID">PAID (Payment Received)</option>
                    <option value="ISSUED">ISSUED (Payment Pending)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={saleDueDate}
                    onChange={(e) => setSaleDueDate(e.target.value)}
                    className="w-full bg-[#131e38] border border-[#22345e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Calculated Total Display */}
              <div className="p-3 rounded-xl bg-[#090f1d] border border-[#1f2d4d] flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Calculated Sales Total:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {formatCurrency((saleQuantity * (parseFloat(saleUnitPrice) || 0)), curr)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSale}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{submittingSale ? 'Recording Sale...' : 'Record Sale & Generate Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
