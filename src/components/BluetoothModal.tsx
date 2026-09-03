import React, { useState } from 'react';
import { usePosStore } from '../store/posStore';
import {
  isWebBluetoothSupported,
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  getActivePrinterName,
  printBitmapAiyin,
  testAllWritableChannels
} from '../utils/bluetooth';
import { renderTextToBitmap } from '../utils/receiptBitmap';
import {
  Bluetooth,
  BluetoothConnected,
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ListChecks
} from 'lucide-react';

export const BluetoothModal: React.FC = () => {
  const { isBluetoothModalOpen, closeBluetoothModal, printerState, setPrinterState } = usePosStore();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isBluetoothModalOpen) return null;

  const btSupported = isWebBluetoothSupported();
  const connectedDeviceName = getActivePrinterName() || printerState.deviceName;

  const handleConnect = async () => {
    setLoading(true);
    setErrorMsg(null);
    setMsg("Bluetooth printerlar qidirilmoqda...");

    try {
      const conn = await connectBluetoothPrinter();
      const name = conn.device.name || 'Bluetooth Printer';
      setPrinterState({ connected: true, deviceName: name });
      setMsg(`Printer ulangan: ${name}`);
      setLoading(false);
    } catch (err: any) {
      console.error("Bluetooth pairing error:", err);
      setErrorMsg(err.message || "Printerga ulanish imkoni bo'lmadi.");
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectBluetoothPrinter();
    setPrinterState({ connected: false, deviceName: null });
    setMsg("Printer uzildi.");
  };

  const handleTestPrint = async () => {
    if (!printerState.connected) {
      setErrorMsg("Avval printerni ulang!");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setMsg("Test chek chop etilmoqda...");

    try {
      const testText = [
        '================================',
        '       58mm THERMAL TEST       ',
        '================================',
        'Bluetooth ulanish: OK',
        'Rasm (bitmap) rejimida chop etish',
        '================================'
      ].join('\n');

      const bitmap = renderTextToBitmap(testText);
      await printBitmapAiyin(bitmap);
      setMsg("Test chek muvaffaqiyatli chop etildi!");
      setLoading(false);
    } catch (err: any) {
      setErrorMsg("Test chop etishda xatolik: " + err.message);
      setLoading(false);
    }
  };

  const handleTestAllChannels = async () => {
    if (!printerState.connected) {
      setErrorMsg("Avval printerni ulang!");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setMsg("Barcha kanallar birma-bir sinalmoqda — printerni kuzatib turing...");

    try {
      await testAllWritableChannels(({ index, total, charUuid }) => {
        setMsg(`Sinalmoqda: ${index}/${total} — ${charUuid.split('-')[0]}. Printerni kuzating!`);
      });
      setMsg("Barcha kanallar sinaldi. Qaysi raqamda printer harakatga kelganini konsoldan (F12) tekshiring.");
      setLoading(false);
    } catch (err: any) {
      setErrorMsg("Kanallarni sinashda xatolik: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Bluetooth className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-base">58mm Bluetooth Printer Sozlamalari</h3>
          </div>
          <button
            onClick={closeBluetoothModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">
          {/* Status Box */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              printerState.connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              {printerState.connected ? (
                <BluetoothConnected className="w-6 h-6 text-emerald-400 animate-pulse" />
              ) : (
                <Bluetooth className="w-6 h-6 text-slate-400" />
              )}
              <div>
                <p className="font-bold text-sm text-white">
                  {printerState.connected ? connectedDeviceName || 'Printer Ulangan' : 'Printerga ulanmagan'}
                </p>
                <p className="text-[11px] opacity-80">
                  {printerState.connected ? 'ESC/POS 32-ustunli rejim aktiv' : 'Web Bluetooth orqali printerni tanlang'}
                </p>
              </div>
            </div>

            {printerState.connected && (
              <button
                onClick={handleDisconnect}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold transition text-[11px]"
              >
                Uzish
              </button>
            )}
          </div>

          {/* Web Bluetooth Browser Compatibility warning */}
          {!btSupported && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Web Bluetooth API qo'llab-quvvatlanmaydi</span>
              </div>
              <p className="text-[11px] opacity-90 leading-normal">
                Siz ishlatayotgan brauzer (masalan, iOS Safari) Web Bluetooth-ni bevosita qo'llab-quvvatlamaydi. Xavotir olmang! POS tizimi brauzerining zaxira <strong className="text-white">CSS 58mm window.print()</strong> funksiyasi orqali chop etish imkoniyatiga ega.
              </p>
            </div>
          )}

          {msg && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>{msg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleConnect}
              disabled={loading || !btSupported}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>Yangi Bluetooth Printer Ulash</span>
            </button>

            {printerState.connected && (
              <button
                onClick={handleTestPrint}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>Test Chek Chop Etish</span>
              </button>
            )}

            {printerState.connected && (
              <button
                onClick={handleTestAllChannels}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition disabled:opacity-50"
              >
                <ListChecks className="w-3.5 h-3.5 text-amber-400" />
                <span>Barcha Kanallarni Birma-bir Sinash</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
