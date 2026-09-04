import React, { useState, useMemo } from 'react';
import { usePosStore } from '../store/posStore';
import { Treatment } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Search, Plus, Check, Stethoscope, Sparkles } from 'lucide-react';

export const PosCatalog: React.FC = () => {
  const { treatments, addToCart, cart } = usePosStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    treatments.forEach((t) => set.add(t.category));
    return ['Barchasi', ...Array.from(set)];
  }, [treatments]);

  // Filter treatments by search & category
  const filteredTreatments = useMemo(() => {
    return treatments.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'Barchasi' || t.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [treatments, searchQuery, selectedCategory]);

  // Helper to check quantity in cart
  const getCartQuantity = (treatmentId: string) => {
    const item = cart.find((c) => c.treatment.id === treatmentId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl">
      {/* Top Search & Filter Bar */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            Muolajalar Katalogi
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Jami: <strong className="text-slate-200">{filteredTreatments.length}</strong> ta
          </span>
        </div>

        {/* Search Input — desktop only, category pills are enough on mobile */}
        <div className="relative hidden lg:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Muolaja nomini qidirish..."
            className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/40'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Treatments Grid */}
      <div className="flex-1 space-y-2.5 lg:overflow-y-auto lg:pr-1 lg:max-h-[calc(100vh-280px)]">
        {filteredTreatments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <Stethoscope className="w-10 h-10 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-slate-400 font-medium text-sm">Muolajalar topilmadi</p>
            <p className="text-xs text-slate-500 mt-1">Qidiruv yoki kategoriya bo'yicha boshqasini tanlang</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2.5">
            {filteredTreatments.map((treatment) => {
              const qtyInCart = getCartQuantity(treatment.id);
              return (
                <div
                  key={treatment.id}
                  onClick={() => addToCart(treatment)}
                  className={`group relative flex items-center gap-3 bg-slate-800/80 hover:bg-slate-800 border rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    qtyInCart > 0
                      ? 'border-sky-500/60 bg-sky-950/20 ring-1 ring-sky-500/30'
                      : 'border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  {/* Left: Category, Name & Description */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-slate-700/80 text-sky-400 border border-slate-600/50 shrink-0">
                        {treatment.category}
                      </span>
                      {qtyInCart > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 animate-in fade-in">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          {qtyInCart}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-slate-100 group-hover:text-sky-300 transition-colors truncate">
                      {treatment.name}
                    </h3>
                    {treatment.description && (
                      <p className="text-xs text-slate-400 truncate font-normal">
                        {treatment.description}
                      </p>
                    )}
                  </div>

                  {/* Right: Price & Add Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-sm font-bold text-sky-400 font-mono whitespace-nowrap">
                      {formatCurrency(treatment.price)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(treatment);
                      }}
                      aria-label="Qo'shish"
                      className="flex items-center justify-center gap-1 w-8 h-8 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white text-xs font-semibold transition-all border border-sky-500/30 group-hover:border-sky-500"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                      <span className="hidden sm:inline">Qo'shish</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
