export interface Treatment {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
}

export interface CartItem {
  treatment: Treatment;
  quantity: number;
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  dateStr: string; // e.g. "03.09.2026"
  timeStr: string; // e.g. "19:30"
  doctorName: string;
  patientName: string;
  clinicName: string;
  clinicPhone: string;
  items: ReceiptItem[];
  totalAmount: number;
  createdAt: number; // timestamp
}

export interface ClinicSettings {
  clinicName: string;
  doctorName: string;
  phone: string;
  address: string;
  footerMessage: string;
  columnWidth: number; // default 32
}

export interface BluetoothPrinterState {
  connected: boolean;
  deviceName: string | null;
  isConnecting: boolean;
  isPrinting: boolean;
  error: string | null;
}

export type ActiveTab = 'pos' | 'catalog' | 'settings';
