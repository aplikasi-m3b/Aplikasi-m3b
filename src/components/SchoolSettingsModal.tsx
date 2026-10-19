import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  Save, 
  School,
  AlertCircle
} from 'lucide-react';
import { SchoolSettings } from '../types';
import { lmsService, DEFAULT_SCHOOL_SETTINGS } from '../services/lmsService';
import { SchoolLogo } from './SchoolLogo';

interface SchoolSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newSettings: SchoolSettings) => void;
}

export const SchoolSettingsModal: React.FC<SchoolSettingsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);
  const [schoolName, setSchoolName] = useState('');
  const [schoolSubtitle, setSchoolSubtitle] = useState('');
  const [schoolTagline, setSchoolTagline] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const current = lmsService.getSchoolSettings();
      setSettings(current);
      setSchoolName(current.schoolName || DEFAULT_SCHOOL_SETTINGS.schoolName);
      setSchoolSubtitle(current.schoolSubtitle || DEFAULT_SCHOOL_SETTINGS.schoolSubtitle);
      setSchoolTagline(current.schoolTagline || DEFAULT_SCHOOL_SETTINGS.schoolTagline || '');
      setSavedSuccess(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      setErrorMsg('Nama sekolah wajib diisi.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      const updated = await lmsService.updateSchoolSettings({
        schoolName: schoolName.trim(),
        schoolSubtitle: schoolSubtitle.trim(),
        schoolTagline: schoolTagline.trim(),
      });
      setSavedSuccess(true);
      if (onSuccess) onSuccess(updated);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg('Gagal menyimpan perubahan pengaturan sekolah.');
    }
  };

  const handleResetToDefault = () => {
    setSchoolName(DEFAULT_SCHOOL_SETTINGS.schoolName);
    setSchoolSubtitle(DEFAULT_SCHOOL_SETTINGS.schoolSubtitle);
    setSchoolTagline(DEFAULT_SCHOOL_SETTINGS.schoolTagline || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <School className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pengaturan Identitas Lembaga</span>
              </span>
              <h2 className="text-xl font-black text-white">Ganti Nama Sekolah</h2>
              <p className="text-xs text-emerald-200">
                Ubah nama madrasah / sekolah yang ditampilkan di seluruh aplikasi LMS
              </p>
            </div>
          </div>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Nama sekolah berhasil diperbarui di seluruh aplikasi!</span>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pratinjau Tampilan Header & Identitas:
            </span>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <SchoolLogo size="md" className="flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-black text-sm text-slate-900 truncate">
                  {schoolName.trim() || 'Nama Sekolah Belum Diisi'}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {schoolSubtitle.trim() || 'Jenjang / Keterangan Lembaga'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Utama Sekolah / Madrasah <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Contoh: MTsN 3 Banyuwangi atau SMP Negeri 1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Nama ini akan muncul pada Navbar, halaman login siswa & guru, sertifikat kuis, dan judul web.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan Lengkap / Sub-judul Lembaga
            </label>
            <input
              type="text"
              value={schoolSubtitle}
              onChange={(e) => setSchoolSubtitle(e.target.value)}
              placeholder="Contoh: Madrasah Tsanawiyah Negeri 3 Banyuwangi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Slogan / Tagline Pembelajaran (Opsional)
            </label>
            <input
              type="text"
              value={schoolTagline}
              onChange={(e) => setSchoolTagline(e.target.value)}
              placeholder="Contoh: Terdepan dalam Prestasi & Akhlak Terpuji"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Default</span>
            </button>

            <div className="w-full sm:w-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Nama Sekolah'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
