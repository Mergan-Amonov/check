import React from 'react';
import { usePosStore } from './store/posStore';
import { Navbar } from './components/Navbar';
import { PosCatalog } from './components/PosCatalog';
import { PosCart } from './components/PosCart';
import { AdminCatalog } from './components/AdminCatalog';
import { ReceiptPreviewModal } from './components/ReceiptPreview';
import { BluetoothModal } from './components/BluetoothModal';
import { PrintReceiptView } from './components/PrintReceiptView';

export const App: React.FC = () => {
  const { activeTab } = usePosStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-[calc(100vh-120px)]">
            {/* Catalog Section (2 cols desktop) */}
            <div className="lg:col-span-2">
              <PosCatalog />
            </div>

            {/* Cart & Receipt Section (1 col desktop) */}
            <div className="lg:col-span-1">
              <PosCart />
            </div>
          </div>
        )}

        {(activeTab === 'catalog' || activeTab === 'settings') && <AdminCatalog />}
      </main>

      {/* Interactive Modals & Print Target */}
      <ReceiptPreviewModal />
      <BluetoothModal />
      <PrintReceiptView />
    </div>
  );
};

export default App;
