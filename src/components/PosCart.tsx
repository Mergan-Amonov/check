import React from 'react';
import { usePosStore } from '../store/posStore';
import { formatCurrency } from '../utils/formatters';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Printer,
  User,
  UserCheck,
  Receipt as ReceiptIcon
} from 'lucide-react';

export const PosCart: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    patientName,
    setPatientName,
    doctorName,
    setDoctorName,
    openReceiptModal
  } = usePosStore();

  // Total amount
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.treatment.price * item.quantity,
    0
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl">
      {/* Cart Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-sky-400" />
          Hozirgi Chek / Savat
        </h2>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tozalash</span>
          </button>
        )}
      </div>

      {/* Customer & Doctor Input Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
        {/* Doctor Name */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            Shifokor Ismi
          </label>
          <input
            type="text"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="Dr. Akramov"
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Patient Name */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sky-400" />
            Mijoz Ismi (ixtiyoriy)
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Masalan: Alisher N."
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Selected Items List */}
      <div className="flex-1 space-y-2 mb-4 lg:overflow-y-auto lg:pr-1 lg:max-h-[calc(100vh-420px)]">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-800 rounded-xl">
            <ReceiptIcon className="w-9 h-9 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-slate-400 font-medium text-xs">Savat hozircha bo'sh</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Chap tomondan muolajalarni tanlang</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.treatment.id}
              className="flex items-center justify-between bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 transition hover:border-slate-600"
            >
              {/* Item Info */}
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-xs font-semibold text-slate-200 truncate">
                  {item.treatment.name}
                </h4>
                <div className="text-[11px] text-sky-400 font-mono font-medium">
                  {formatCurrency(item.treatment.price)}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-1.5 bg-slate-900/80 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => updateQuantity(item.treatment.id, -1)}
                  className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 active:bg-slate-600 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="w-6 text-center text-xs font-bold text-slate-100 font-mono">
                  {item.quantity}
                </span>

                <button
                  onClick={() => updateQuantity(item.treatment.id, 1)}
                  className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 active:bg-slate-600 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Subtotal & Delete */}
              <div className="flex items-center space-x-2 pl-3">
                <div className="text-right min-w-[75px]">
                  <span className="text-xs font-bold text-white font-mono">
                    {formatCurrency(item.treatment.price * item.quantity)}
                  </span>
                </div>
                <button
                  onClick={() => removeFromCart(item.treatment.id)}
                  className="text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Action Buttons */}
      <div className="pt-3 border-t border-slate-800 space-y-3">
        {/* Total Price Banner */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            JAMI SUMMA:
          </span>
          <span className="text-xl font-extrabold text-sky-400 font-mono tracking-tight">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => openReceiptModal()}
          disabled={cart.length === 0}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg ${
            cart.length > 0
              ? 'bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white shadow-sky-600/30 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <Printer className="w-4 h-4 stroke-[2.5]" />
          <span>Chek chiqarish</span>
        </button>
      </div>
    </div>
  );
};
