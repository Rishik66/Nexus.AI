import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { ApiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency.js';

export const Inventory: React.FC = () => {
  const { business } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, mRes] = await Promise.all([
        ApiService.getProducts({ low_stock: filterLowStock ? 'true' : undefined }),
        ApiService.getInventoryMovements(),
      ]);
      setProducts(pRes.products || []);
      setMovements(mRes || []);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterLowStock]);

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || adjustQuantity === 0 || !adjustReason) return;
    try {
      await ApiService.adjustInventory({
        product_id: selectedProduct.id,
        quantity: Number(adjustQuantity),
        reason: adjustReason,
      });
      setAdjustModalOpen(false);
      setSelectedProduct(null);
      setAdjustQuantity(0);
      setAdjustReason('');
      await fetchData();
    } catch (err: any) {
      alert(`Adjustment failed: ${err.message}`);
    }
  };

  const handleTriggerAtlasRestock = () => {
    navigate('/command-center');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ATLAS Infrastructure Domain
            </span>
            <span className="text-xs text-slate-400 font-mono">Enterprise Asset Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Operations & Infrastructure Assets</h1>
          <p className="text-xs text-slate-400 mt-1">
            Continuous auditing of engineering workstations, server nodes, network equipment, and procurement staging.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleTriggerAtlasRestock}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            AI Asset Procurement Plan
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0d1527] border border-[#22345e] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-[#131e38] border border-[#22345e] rounded-lg px-3 py-2 text-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU or asset / service name..."
            className="bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#131e38] border border-[#22345e] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Toggle Low Stock Only */}
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              filterLowStock
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-[#131e38] text-slate-400 border-[#22345e] hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Capacity Deficit Only
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl bg-[#0d1527] border border-[#22345e] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131e38] text-slate-400 border-b border-[#22345e] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Asset Code / Specification</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Cost / Unit</th>
                <th className="py-3 px-4">Capacity Allocation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d4d]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading asset catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No infrastructure assets found. Use AI Asset Procurement Plan to stage assets.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock_quantity <= p.reorder_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-[#131e38]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-200">{p.name}</div>
                        <div className="font-mono text-[10px] text-cyan-400">{p.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{p.category}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {formatCurrency(p.cost_price, business?.currency)} / {formatCurrency(p.unit_price, business?.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{p.stock_quantity}</span>
                          <span className="text-[10px] text-slate-500">
                            (Min: {p.reorder_threshold})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" /> LOW CAPACITY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Healthy
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setAdjustModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-[#182442] hover:bg-[#22345e] text-slate-300 hover:text-white border border-[#22345e] text-[11px] font-medium transition-all"
                        >
                          Reallocate Capacity
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Stock Adjustment Modal */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0d1527] border border-[#22345e] rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">Manual Asset & Capacity Allocation</h3>
            <p className="text-xs text-slate-400">
              Adjusting quantity for <span className="text-cyan-400 font-bold">{selectedProduct.name}</span> ({selectedProduct.sku}).
              Active capacity / units: <span className="text-white font-bold">{selectedProduct.stock_quantity}</span>.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 font-medium block mb-1">
                  Quantity Change (+ to add, - to subtract):
                </label>
                <input
                  type="number"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  className="w-full bg-[#131e38] border border-[#22345e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-medium block mb-1">
                  Reason for Adjustment:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Node cluster scale-up, workstation decommission, licensing renewal"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-[#131e38] border border-[#22345e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#182442] text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold shadow-md shadow-cyan-500/20"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Audit Log Section */}
      <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-cyan-400" />
          Recent Infrastructure & Asset Allocation Logs
        </h3>
        <div className="space-y-2">
          {movements.length === 0 ? (
            <div className="p-4 text-center rounded-lg bg-[#131e38] text-slate-500 text-xs">
              No asset allocation movements logged yet.
            </div>
          ) : (
            movements.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-lg bg-[#131e38] border border-[#22345e] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200">{m.reason || 'Infrastructure Reallocation'}</span>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Type: {m.type} • Ref: {m.reference_id || 'N/A'} • {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="font-mono font-bold">
                  <span className={m.quantity >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {m.quantity >= 0 ? `+${m.quantity}` : m.quantity} units
                  </span>
                  <span className="text-slate-500 text-[10px] ml-1">
                    ({m.previous_quantity} → {m.new_quantity})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
