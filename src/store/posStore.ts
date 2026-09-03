import { create } from 'zustand';
import {
  Treatment,
  CartItem,
  Receipt,
  ClinicSettings,
  BluetoothPrinterState,
  ActiveTab
} from '../types';
import {
  loadStoredCatalog,
  saveCatalogToStorage,
  loadStoredSettings,
  saveSettingsToStorage,
  loadStoredReceipts,
  saveReceiptToStorage,
  DEFAULT_TREATMENTS
} from '../utils/storage';
import { getCurrentDateStr, getCurrentTimeStr } from '../utils/formatters';

interface PosState {
  // Catalog & Cart
  treatments: Treatment[];
  cart: CartItem[];
  patientName: string;
  doctorName: string;

  // Receipts & Settings
  receipts: Receipt[];
  settings: ClinicSettings;
  activeTab: ActiveTab;

  // Modals & Printer
  activeReceiptForPreview: Receipt | null;
  isReceiptModalOpen: boolean;
  isBluetoothModalOpen: boolean;
  printerState: BluetoothPrinterState;

  // Cart Actions
  addToCart: (treatment: Treatment) => void;
  removeFromCart: (treatmentId: string) => void;
  updateQuantity: (treatmentId: string, delta: number) => void;
  setItemQuantity: (treatmentId: string, quantity: number) => void;
  clearCart: () => void;
  setPatientName: (name: string) => void;
  setDoctorName: (name: string) => void;

  // Catalog Management Actions
  addTreatment: (treatment: Omit<Treatment, 'id'>) => void;
  updateTreatment: (treatment: Treatment) => void;
  deleteTreatment: (id: string) => void;
  resetCatalogToDefault: () => void;

  // Settings & Navigation
  updateSettings: (newSettings: Partial<ClinicSettings>) => void;
  setActiveTab: (tab: ActiveTab) => void;

  // Receipt Modal Actions
  prepareCurrentReceipt: () => Receipt | null;
  openReceiptModal: (receipt?: Receipt) => void;
  closeReceiptModal: () => void;
  openBluetoothModal: () => void;
  closeBluetoothModal: () => void;
  confirmReceiptSale: (receipt: Receipt) => void;

  // Printer State Actions
  setPrinterState: (state: Partial<BluetoothPrinterState>) => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  treatments: loadStoredCatalog(),
  cart: [],
  patientName: '',
  doctorName: loadStoredSettings().doctorName || 'Dr. Umarov',

  receipts: loadStoredReceipts(),
  settings: loadStoredSettings(),
  activeTab: 'pos',

  activeReceiptForPreview: null,
  isReceiptModalOpen: false,
  isBluetoothModalOpen: false,
  printerState: {
    connected: false,
    deviceName: null,
    isConnecting: false,
    isPrinting: false,
    error: null
  },

  // --- Cart Actions ---
  addToCart: (treatment) => {
    set((state) => {
      const existingIndex = state.cart.findIndex((item) => item.treatment.id === treatment.id);
      if (existingIndex > -1) {
        const updatedCart = [...state.cart];
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + 1
        };
        return { cart: updatedCart };
      } else {
        return { cart: [...state.cart, { treatment, quantity: 1 }] };
      }
    });
  },

  removeFromCart: (treatmentId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.treatment.id !== treatmentId)
    }));
  },

  updateQuantity: (treatmentId, delta) => {
    set((state) => {
      const updatedCart = state.cart
        .map((item) => {
          if (item.treatment.id === treatmentId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
      return { cart: updatedCart };
    });
  },

  setItemQuantity: (treatmentId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((item) => item.treatment.id !== treatmentId) };
      }
      return {
        cart: state.cart.map((item) =>
          item.treatment.id === treatmentId ? { ...item, quantity } : item
        )
      };
    });
  },

  clearCart: () => {
    set({ cart: [], patientName: '' });
  },

  setPatientName: (name) => set({ patientName: name }),
  setDoctorName: (name) => {
    set({ doctorName: name });
    get().updateSettings({ doctorName: name });
  },

  // --- Catalog Actions ---
  addTreatment: (newTreatmentData) => {
    const newId = `t-${Date.now()}`;
    const newTreatment: Treatment = { ...newTreatmentData, id: newId };
    set((state) => {
      const updated = [newTreatment, ...state.treatments];
      saveCatalogToStorage(updated);
      return { treatments: updated };
    });
  },

  updateTreatment: (updatedTreatment) => {
    set((state) => {
      const updated = state.treatments.map((t) =>
        t.id === updatedTreatment.id ? updatedTreatment : t
      );
      saveCatalogToStorage(updated);
      return { treatments: updated };
    });
  },

  deleteTreatment: (id) => {
    set((state) => {
      const updated = state.treatments.filter((t) => t.id !== id);
      saveCatalogToStorage(updated);
      return { treatments: updated };
    });
  },

  resetCatalogToDefault: () => {
    saveCatalogToStorage(DEFAULT_TREATMENTS);
    set({ treatments: DEFAULT_TREATMENTS });
  },

  // --- Settings Actions ---
  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      saveSettingsToStorage(updated);
      return { settings: updated };
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  // --- Receipt Generation ---
  prepareCurrentReceipt: () => {
    const { cart, doctorName, patientName, settings } = get();
    if (cart.length === 0) return null;

    const totalAmount = cart.reduce((sum, item) => sum + item.treatment.price * item.quantity, 0);
    const receiptNo = String(Math.floor(1000 + Math.random() * 9000));
    const now = new Date();

    const receiptItems = cart.map((item) => ({
      id: item.treatment.id,
      name: item.treatment.name,
      price: item.treatment.price,
      quantity: item.quantity,
      total: item.treatment.price * item.quantity
    }));

    const receipt: Receipt = {
      id: `rcpt-${Date.now()}`,
      receiptNo,
      dateStr: getCurrentDateStr(now),
      timeStr: getCurrentTimeStr(now),
      doctorName: doctorName || settings.doctorName || 'Dr. Umarov',
      patientName: patientName.trim() || 'Mijoz',
      clinicName: settings.clinicName || 'DENTAL CLINIC',
      clinicPhone: settings.phone || '+998 93 999 95 55',
      items: receiptItems,
      totalAmount,
      createdAt: Date.now()
    };

    return receipt;
  },

  openReceiptModal: (existingReceipt) => {
    if (existingReceipt) {
      set({ activeReceiptForPreview: existingReceipt, isReceiptModalOpen: true });
    } else {
      const newReceipt = get().prepareCurrentReceipt();
      if (newReceipt) {
        set({ activeReceiptForPreview: newReceipt, isReceiptModalOpen: true });
      }
    }
  },

  closeReceiptModal: () => set({ isReceiptModalOpen: false, activeReceiptForPreview: null }),

  openBluetoothModal: () => set({ isBluetoothModalOpen: true }),
  closeBluetoothModal: () => set({ isBluetoothModalOpen: false }),

  confirmReceiptSale: (receipt) => {
    const updatedReceipts = saveReceiptToStorage(receipt);
    set({ receipts: updatedReceipts });
  },

  setPrinterState: (partialState) =>
    set((state) => ({
      printerState: { ...state.printerState, ...partialState }
    }))
}));
