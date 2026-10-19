import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { TeacherItem, UserSession } from '../types';
import { lmsService } from '../services/lmsService';

interface MainTeacherCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onSuccess?: (updatedSession: Partial<UserSession>) => void;
}

export const MainTeacherCredentialsModal: React.FC<MainTeacherCredentialsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [nipInput, setNipInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const teachers = lmsService.getTeachers();
      const main = teachers.find(t => t.isMainTeacher || t.id === 'teacher-main');
      setEmailInput(main?.email || currentUser.email || 'kegiatanm3b@gmail.com');
      setNameInput(main?.name || currentUser.name || 'Guru Utama');
      setNipInput(main?.nip || currentUser.nip || '');
      setPasswordInput(main?.password || 'Guru-13531');
      setConfirmPasswordInput(main?.password || 'Guru-13531');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailInput.trim()) {
      setErrorMsg('Alamat email wajib diisi.');
      return;
    }
    if (!nameInput.trim()) {
      setErrorMsg('Nama lengkap Guru Utama wajib diisi.');
      return;
    }
    if (passwordInput && passwordInput.length < 5) {
      setErrorMsg('Kata sandi minimal 5 karakter demi keamanan akun.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedTeacher = await lmsService.updateMainTeacherCredentials({
        email: emailInput.trim(),
        password: passwordInput.trim(),
        name: nameInput.trim(),
        nip: nipInput.trim(),
      });

      setSuccessMsg('Email dan kata sandi Guru Utama berhasil diperbarui!');
      if (onSuccess) {
        onSuccess({
          email: updatedTeacher.email,
          name: updatedTeacher.name,
          nip: updatedTeacher.nip,
        });
      }
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg('Gagal memperbarui data akun Guru Utama.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <KeyRound className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Kredensial Akun Administrator</span>
              </span>
              <h2 className="text-xl font-black text-white">Edit Akun Guru Utama</h2>
              <p className="text-xs text-amber-200/90">
                Ubah email login resmi dan kata sandi untuk Guru Utama (Admin)
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            Perubahan email atau password akan langsung berlaku saat login berikutnya melalui portal Guru Utama.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Resmi Guru Utama <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="kegiatanm3b@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Guru Utama <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Guru Utama (MTsN 3 Banyuwangi)"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              NIP (Nomor Induk Pegawai)
            </label>
            <input
              type="text"
              value={nipInput}
              onChange={(e) => setNipInput(e.target.value)}
              placeholder="197508122002121003"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Kata Sandi Baru <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan kata sandi baru"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Kredensial Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
