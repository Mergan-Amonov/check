import React, { useState, useMemo } from 'react';
import { usePosStore } from '../store/posStore';
import { formatCurrency } from '../utils/formatters';
import {
  History,
  Search,
  Printer,
  Calendar,
  User,
  CreditCard,
  Banknote,
  DollarSign,
  ChevronRight,
  FileText
} from 'lucide-react';

export const ReceiptHistory: React.FC = () => {
  const { receipts, openReceiptModal } = usePosStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.patientName.toLowerCase().includes(q) ||
        r.doctorName.toLowerCase().includes(q) ||
        r.receiptNo.includes(q) ||
        r.dateStr.includes(q)
      );
    });
  }, [receipts, searchQuery]);

  // Total revenue stats
  const totalRevenue = useMemo(() => {
    return receipts.reduce((sum, r) => sum + r.totalAmount, 0);
  }, [receipts]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Jami Cheklar</p>
            <h3 className="text-2xl font-extrabold text-white font-mono">{receipts.length} ta</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center space-x-4 sm:col-span-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Umumiy Tushum (Jami Summa)</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 font-mono">
              {formatCurrency(totalRevenue)}
            </h3>
          </div>
        </div>
      </div>

      {/* Search & Receipts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            Cheklar Tarixi Ro'yxati
          </h3>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mijoz nomi yoki sana..."
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-800 rounded-xl">
            <History className="w-10 h-10 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-slate-400 font-medium text-sm">Hali cheklar yaratilmagan</p>
            <p className="text-xs text-slate-500 mt-1">Kassadan birinchi sotuvni amalga oshiring</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">№ Chek</th>
                  <th className="px-4 py-3">Sana & Vaqt</th>
                  <th className="px-4 py-3">Mijoz / Vrach</th>
                  <th className="px-4 py-3">Xizmatlar</th>
                  <th className="px-4 py-3">Jami Summa</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Chop etish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-sky-400">
                      #{r.receiptNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1 text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.dateStr}</span>
                        <span className="text-slate-500 font-mono text-[11px]">({r.timeStr})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100">{r.patientName}</div>
                      <div className="text-[11px] text-slate-400">{r.doctorName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 font-medium">
                        {r.items.map((i) => i.name).join(', ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {formatCurrency(r.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openReceiptModal(r)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-semibold transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Qayta chop etish</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
