import React from 'react';
import { usePosStore } from '../store/posStore';
import {
  Stethoscope,
  ShoppingBag,
  Settings,
  Bluetooth,
  BluetoothConnected,
  Printer
} from 'lucide-react';
import { isWebBluetoothSupported, getActivePrinterName } from '../utils/bluetooth';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, printerState, openBluetoothModal, settings } = usePosStore();
  const btSupported = isWebBluetoothSupported();
  const connectedDeviceName = getActivePrinterName() || printerState.deviceName;

  return (
    <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700/80 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Clinic Name */}
          <div
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0 flex-1 sm:flex-initial"
            onClick={() => setActiveTab('pos')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-md shadow-sky-500/20 ring-2 ring-sky-400/30">
              <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-lg text-white tracking-tight leading-tight flex items-center gap-1.5 min-w-0">
                <span className="truncate">{settings.clinicName || 'DENTAL CLINIC'}</span>
                <span className="hidden sm:inline shrink-0 text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  POS PWA
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium hidden sm:block truncate">
                Stomatologiya Kassa Tizimi
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-900/70 p-1 rounded-xl border border-slate-700/60 shadow-inner shrink-0">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
                activeTab === 'pos'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden xs:inline">Kassa</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
                activeTab === 'catalog'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden xs:inline">Sozlamalar</span>
            </button>
          </nav>

          {/* Bluetooth Thermal Printer Status */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={openBluetoothModal}
              title="Bluetooth printer sozlamalari"
              className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                printerState.connected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : btSupported
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-600'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {printerState.connected ? (
                <>
                  <BluetoothConnected className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="hidden md:inline font-mono">
                    {connectedDeviceName || 'Printer ulangan'}
                  </span>
                  <span className="md:hidden">58mm</span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4 text-slate-400" />
                  <span className="hidden md:inline">Bluetooth Printer</span>
                  <span className="md:hidden">BT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
