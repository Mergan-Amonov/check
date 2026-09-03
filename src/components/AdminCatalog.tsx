import React, { useState } from 'react';
import { usePosStore } from '../store/posStore';
import { Treatment } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Save,
  X,
  Stethoscope,
  Building,
  Phone,
  User,
  Check,
  FileText
} from 'lucide-react';

export const AdminCatalog: React.FC = () => {
  const {
    treatments,
    addTreatment,
    updateTreatment,
    deleteTreatment,
    resetCatalogToDefault,
    settings,
    updateSettings
  } = usePosStore();

  // Form states for adding/editing treatment
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New treatment form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Davolash');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  // Settings state
  const [clinicName, setClinicName] = useState(settings.clinicName);
  const [doctorName, setDoctorName] = useState(settings.doctorName);
  const [phone, setPhone] = useState(settings.phone);
  const [footerMessage, setFooterMessage] = useState(settings.footerMessage);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  const categoriesList = ['Konsultatsiya', 'Davolash', 'Jrohlik', 'Protezlash', 'Gigiyena', 'Diagnostika'];

  const handleOpenAdd = () => {
    setName('');
    setCategory('Davolash');
    setPrice('');
    setDescription('');
    setEditingTreatment(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t: Treatment) => {
    setEditingTreatment(t);
    setName(t.name);
    setCategory(t.category);
    setPrice(t.price);
    setDescription(t.description || '');
    setIsAddModalOpen(true);
  };

  const handleSaveTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || Number(price) <= 0) return;

    if (editingTreatment) {
      updateTreatment({
        ...editingTreatment,
        name: name.trim(),
        category,
        price: Number(price),
        description: description.trim()
      });
    } else {
      addTreatment({
        name: name.trim(),
        category,
        price: Number(price),
        description: description.trim()
      });
    }

    setIsAddModalOpen(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      clinicName: clinicName.trim(),
      doctorName: doctorName.trim(),
      phone: phone.trim(),
      footerMessage: footerMessage.trim()
    });
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-sky-400 shrink-0" />
            Katalog va Sozlamalar Boshqaruvi
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Muolajalar ro'yxatini tahrirlash, yangi xizmatlar qo'shish va klinika rekvizitlarini sozlash
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => {
              if (window.confirm("Barcha muolajalar ilk standart holatga qaytarilsinmi?")) {
                resetCatalogToDefault();
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Default holat</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yangi Muolaja</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Treatments Catalog Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Mavjud Muolajalar ({treatments.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-3 py-3 rounded-l-lg">Muolaja</th>
                  <th className="px-3 py-3">Kategoriya</th>
                  <th className="px-3 py-3">Narxi</th>
                  <th className="px-3 py-3 text-right rounded-r-lg">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {treatments.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-3 py-3 font-semibold text-slate-100">
                      <div>{t.name}</div>
                      {t.description && (
                        <div className="text-[11px] font-normal text-slate-400 line-clamp-1">{t.description}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-sky-400 border border-slate-700">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-sky-400">
                      {formatCurrency(t.price)}
                    </td>
                    <td className="px-3 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`"${t.name}" o'chirilsinmi?`)) {
                            deleteTreatment(t.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Clinic Settings Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 h-fit">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-sky-400" />
            Klinika va Chek Revisitlari
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-500" /> Klinika Nomi
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" /> Asosiy Vrach / Shifokor
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> Telefon Raqam
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" /> Chek Pastki Yozuvi (Footer)
              </label>
              <input
                type="text"
                value={footerMessage}
                onChange={(e) => setFooterMessage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition mt-2"
            >
              <Save className="w-4 h-4" />
              <span>Sozlamalarni Saqlash</span>
            </button>

            {settingsSavedToast && (
              <p className="text-center text-xs text-emerald-400 font-semibold animate-in fade-in flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saqlandi!
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Add / Edit Treatment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingTreatment ? "Muolajani Tahrirlash" : "Yangi Muolaja Qo'shish"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTreatment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Muolaja Nomi *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Plomba (kompozit)"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Kategoriya
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Narxi (so'm) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="350000"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Tavsif (ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Qisqacha ma'lumot..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
