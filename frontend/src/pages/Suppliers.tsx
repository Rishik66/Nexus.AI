import React, { useState, useEffect } from 'react';
import { Truck, Mail, Phone, MapPin, Star, Clock } from 'lucide-react';
import { ApiService } from '../services/api.js';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ApiService.getSuppliers(), ApiService.getPurchaseOrders()])
      .then(([s, o]) => {
        setSuppliers(s || []);
        setOrders(o || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl">
        <h1 className="text-2xl font-extrabold text-white">Suppliers & Purchase Orders</h1>
        <p className="text-xs text-slate-400 mt-1">
          Approved vendor profiles, reliability ratings, lead times, and staged purchase orders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="p-4 rounded-xl bg-[#0d1527] border border-[#22345e] space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">{s.name}</h3>
                <p className="text-[11px] text-slate-400">Contact: {s.contact_person || 'Sales Desk'}</p>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {s.rating || 4.5}
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{s.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{s.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Avg Fulfillment Lead Time: <strong className="text-slate-200">{s.lead_time_days} days</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Staged Purchase Orders Table */}
      <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Truck className="w-4 h-4 text-cyan-400" />
          Staged Purchase Orders History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131e38] text-slate-400 border-b border-[#22345e] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">PO Number</th>
                <th className="py-2.5 px-4">Supplier</th>
                <th className="py-2.5 px-4">Total Amount</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d4d]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No purchase orders yet. Trigger ATLAS in Command Center to generate low-stock POs!
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-[#131e38]/50">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{po.order_number}</td>
                    <td className="py-3 px-4 text-slate-200">{po.supplier_name || 'Vendor'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">${Number(po.total_amount).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{po.created_by || 'ATLAS'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
