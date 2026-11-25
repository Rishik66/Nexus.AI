import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, Building, DollarSign } from 'lucide-react';
import { ApiService } from '../services/api.js';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.getCustomers()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl">
        <h1 className="text-2xl font-extrabold text-white">Customer Accounts Directory</h1>
        <p className="text-xs text-slate-400 mt-1">
          B2B client profiles, historical order value, and receivables account standing.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Loading customer records...</p>
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0d1527] border border-[#22345e] text-slate-400 text-xs">
          <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          No client accounts found. Connect your database or upload client agreements in Document Intelligence.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-[#0d1527] border border-[#22345e] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">{c.name}</h3>
                  <p className="text-[11px] text-cyan-400 font-medium">{c.company || 'Enterprise'}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {c.status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-400">
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{c.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#22345e] flex items-center justify-between text-xs">
                <span className="text-slate-400">Lifetime Spend:</span>
                <span className="font-mono font-bold text-white">
                  ${Number(c.total_spend || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
