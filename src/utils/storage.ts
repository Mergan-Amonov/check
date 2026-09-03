import { Treatment, ClinicSettings, Receipt } from '../types';

const STORAGE_KEYS = {
  CATALOG: 'dental_pos_catalog_v1',
  SETTINGS: 'dental_pos_settings_v1',
  RECEIPTS: 'dental_pos_receipts_v1'
};

export const DEFAULT_TREATMENTS: Treatment[] = [
  {
    id: 't-1',
    name: 'Konsultatsiya',
    category: 'Konsultatsiya',
    price: 200000,
    description: "Vrach stomatolog ko'rigi va tashxis"
  },
  {
    id: 't-2',
    name: 'Plomba (kompozit)',
    category: 'Davolash',
    price: 350000,
    description: "Fotopolimer nurlanuvchi plomba"
  },
  {
    id: 't-3',
    name: 'Tish tozalash',
    category: 'Gigiyena',
    price: 150000,
    description: "Ultrasonik skaling va jilolash"
  },
  {
    id: 't-4',
    name: 'Rengen',
    category: 'Diagnostika',
    price: 80000,
    description: "Raqamli radiovizografiya rasmi"
  },
  {
    id: 't-5',
    name: "Tish sug'urish",
    category: 'Jrohlik',
    price: 250000,
    description: "Anesteziya bilan jarrohlik usulida olish"
  },
  {
    id: 't-6',
    name: 'Tish oqartirish',
    category: 'Gigiyena',
    price: 500000,
    description: "Professional LED nurlari bilan oqartirish"
  },
  {
    id: 't-7',
    name: 'Koronka (metallokeramika)',
    category: 'Protezlash',
    price: 600000,
    description: "Mustahkam metallokeramik qoplama"
  },
  {
    id: 't-8',
    name: 'Kanal davolash (1 ta)',
    category: 'Davolash',
    price: 300000,
    description: "Tish ildiz kanalini tozalash va plombalash"
  }
];

export const DEFAULT_SETTINGS: ClinicSettings = {
  clinicName: 'DENTAL CLINIC',
  doctorName: 'Dr. Umarov',
  phone: '+998 93 999 95 55',
  address: 'Toshkent sh., Yunusobod t.',
  footerMessage: "Salomat bo'ling! :)",
  columnWidth: 32
};

export function loadStoredCatalog(): Treatment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATALOG);
    if (!raw) return DEFAULT_TREATMENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TREATMENTS;
  } catch (e) {
    console.error('Catalog yuklashda xatolik:', e);
    return DEFAULT_TREATMENTS;
  }
}

export function saveCatalogToStorage(catalog: Treatment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(catalog));
  } catch (e) {
    console.error('Catalog saqlashda xatolik:', e);
  }
}

export function loadStoredSettings(): ClinicSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: ClinicSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Sozlamalarni saqlashda xatolik:', e);
  }
}

export function loadStoredReceipts(): Receipt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveReceiptToStorage(receipt: Receipt): Receipt[] {
  try {
    const existing = loadStoredReceipts();
    const updated = [receipt, ...existing];
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Chekni saqlashda xatolik:', e);
    return [];
  }
}
