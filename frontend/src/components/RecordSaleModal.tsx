import React, { useState } from 'react';
import {
  TrendingUp,
  X,
  Building2,
  Check,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { ApiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { formatCurrency, getCurrencySymbol } from '../utils/currency.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (invoice: any) => void;
}

export const RecordSaleModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { business } = useAuth();
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

  if (!isOpen) return null;

  const curr = business?.currency || 'USD';
  const unitPrice = parseFloat(saleUnitPrice) || 0;
  const qty = Number(saleQuantity) || 1;
  const calculatedTotal = qty * unitPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unitPrice <= 0) {
      setSaleMessage({ type: 'error', text: 'Please enter a valid sale unit price.' });
      return;
    }

    const tax = parseFloat(saleTax) || 0;
    const subtotal = calculatedTotal;

    try {
      setSubmittingSale(true);
      setSaleMessage(null);
      const inv = await ApiService.createInvoice({
        customer_name: customerName.trim() || 'Valued Client',
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
        text: `Sale recorded successfully! Total: ${formatCurrency(subtotal + tax, curr)}.`,
      });

      if (onSuccess) {
        onSuccess(inv);
      }

      setTimeout(() => {
        setCustomerName('');
        setSaleDescription('');
        setSaleUnitPrice('');
        setSaleNotes('');
        setSaleMessage(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setSaleMessage({ type: 'error', text: err.message || 'Failed to record sale.' });
    } finally {
      setSubmittingSale(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#0d1527] border border-[#22345e] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#22345e]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record New Sale</h3>
              <p className="text-[11px] text-slate-400">
                Adds a customer sale & revenue transaction to your ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="p-3.5 rounded-xl bg-[#090f1d] border border-[#1f2d4d] flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Calculated Sales Total:</span>
            <span className="font-mono font-black text-emerald-400 text-base">
              {formatCurrency(calculatedTotal, curr)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
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
  );
};
