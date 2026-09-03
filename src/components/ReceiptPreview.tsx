import React, { useState } from 'react';
import { usePosStore } from '../store/posStore';
import { generateReceiptText } from '../utils/escpos';
import { renderTextToBitmap } from '../utils/receiptBitmap';
import {
  isWebBluetoothSupported,
  connectBluetoothPrinter,
  printBitmapAiyin,
  getActivePrinterName
} from '../utils/bluetooth';
import {
  Printer,
  Bluetooth,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Share2,
  Download
} from 'lucide-react';

export const ReceiptPreviewModal: React.FC = () => {
  const {
    isReceiptModalOpen,
    closeReceiptModal,
    activeReceiptForPreview,
    settings,
    confirmReceiptSale,
    clearCart,
    setPrinterState,
    printerState
  } = usePosStore();

  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isReceiptModalOpen || !activeReceiptForPreview) return null;

  const receipt = activeReceiptForPreview;
  const receiptText = generateReceiptText(receipt, settings);
  const btSupported = isWebBluetoothSupported();

  // Print via Bluetooth ESC/POS
  const handleBluetoothPrint = async () => {
    setIsPrinting(true);
    setErrorMsg(null);
    setPrintStatus("Bluetooth printer tayyorlanmoqda...");

    try {
      // Check active connection or request connection
      let activeName = getActivePrinterName();
      if (!activeName) {
        setPrintStatus("Printer qidirilmoqda...");
        const conn = await connectBluetoothPrinter();
        activeName = conn.device.name || 'Bluetooth Printer';
        setPrinterState({ connected: true, deviceName: activeName });
      }

      setPrintStatus("Chek rasm (bitmap) sifatida tayyorlanmoqda...");
      const bitmap = renderTextToBitmap(receiptText);

      setPrintStatus("Ma'lumotlar printerga yuborilmoqda...");
      await printBitmapAiyin(bitmap);

      setPrintStatus("Chek muvaffaqiyatli chop etildi!");
      confirmReceiptSale(receipt);

      setTimeout(() => {
        setIsPrinting(false);
        setPrintStatus(null);
        clearCart();
        closeReceiptModal();
      }, 1200);
    } catch (err: any) {
      console.error("Print error:", err);
      setErrorMsg(err.message || "Bluetooth orqali chop etishda xatolik yuz berdi.");
      setIsPrinting(false);
      setPrinterState({ connected: false, deviceName: null });
    }
  };

  // Print via Browser Window.print()
  const handleBrowserPrint = () => {
    confirmReceiptSale(receipt);
    window.print();
  };

  const handleSaveOnly = () => {
    confirmReceiptSale(receipt);
    clearCart();
    closeReceiptModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-base">Chek Ko'rinishi (32 Ustun)</h3>
          </div>
          <button
            onClick={closeReceiptModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Paper Container (Monospace 32-column view) */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950/60">
          <div className="mx-auto max-w-[320px] bg-amber-50 text-slate-900 p-5 rounded-md shadow-inner border border-amber-200/80 font-mono text-[13px] leading-[1.35] tracking-tight selection:bg-sky-200 selection:text-slate-900">
            <pre className="whitespace-pre font-mono font-medium text-slate-900">
              {receiptText}
            </pre>
          </div>

          {/* Status / Error Toast */}
          {printStatus && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{printStatus}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Chop etish xatosi:</p>
                <p className="font-normal text-[11px] mt-0.5">{errorMsg}</p>
                <p className="text-[10px] text-rose-300/80 mt-1">
                  Zaxira sifatida "Brauzer Print" tugmasini bosing.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
          {/* Primary Bluetooth Print Button */}
          <button
            onClick={handleBluetoothPrint}
            disabled={isPrinting}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition duration-150 disabled:opacity-50"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bluetooth className="w-4 h-4" />
            )}
            <span>
              {btSupported
                ? 'Bluetooth (ESC/POS) Orqali Chop Etish'
                : 'Bluetooth Printer (Brauzerda cheklangan)'}
            </span>
          </button>

          {/* Secondary Buttons Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleBrowserPrint}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Brauzer Print</span>
            </button>

            <button
              onClick={handleSaveOnly}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Faqat Saqlash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
