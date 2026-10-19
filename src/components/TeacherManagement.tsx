import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  KeyRound, 
  Mail, 
  BookOpen, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Search,
  Lock,
  Phone,
  UserCheck,
  School
} from 'lucide-react';
import { TeacherItem, UserSession } from '../types';
import { lmsService } from '../services/lmsService';
import { SchoolLogo } from './SchoolLogo';
import { FeedbackModal } from './FeedbackModal';

interface TeacherManagementProps {
  teachers: TeacherItem[];
  currentUser: UserSession;
  onRefreshTeachers?: () => void;
  onOpenSchoolSettings?: () => void;
  onOpenMainCredentials?: () => void;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  currentUser,
  onOpenSchoolSettings,
  onOpenMainCredentials,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [nipInput, setNipInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [statusInput, setStatusInput] = useState<'aktif' | 'nonaktif'>('aktif');
  const [formError, setFormError] = useState('');

  // Password reset prompt
  const [resetPromptTeacher, setResetPromptTeacher] = useState<TeacherItem | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetSuccessNotice, setResetSuccessNotice] = useState('');

  // Feedback Modal State
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const isMainTeacher = !!currentUser.isMainTeacher;

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.nip && t.nip.includes(searchQuery)) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setNameInput('');
    setNipInput('');
    setEmailInput('');
    setPasswordInput('guru123');
    setSubjectInput('');
    setPhoneInput('');
    setStatusInput('aktif');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: TeacherItem) => {
    setEditingTeacher(teacher);
    setNameInput(teacher.name);
    setNipInput(teacher.nip || '');
    setEmailInput(teacher.email);
    setPasswordInput(teacher.password || 'guru123');
    setSubjectInput(teacher.subject);
    setPhoneInput(teacher.phone || '');
    setStatusInput(teacher.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nameInput.trim()) {
      setFormError('Nama lengkap guru wajib diisi.');
      return;
    }
    if (!emailInput.trim()) {
      setFormError('Alamat email guru wajib diisi.');
      return;
    }
    if (!passwordInput.trim()) {
      setFormError('Kata sandi login wajib diisi.');
      return;
    }

    if (editingTeacher) {
      const updated: TeacherItem = {
        ...editingTeacher,
        name: nameInput.trim(),
        nip: nipInput.trim() || undefined,
        email: emailInput.trim(),
        password: passwordInput.trim(),
        subject: subjectInput.trim() || 'Mata Pelajaran Umum',
        phone: phoneInput.trim() || undefined,
        status: statusInput,
      };
      await lmsService.updateTeacher(updated);
    } else {
      const newTeacher: TeacherItem = {
        id: `teacher-${Date.now()}`,
        name: nameInput.trim(),
        nip: nipInput.trim() || undefined,
        email: emailInput.trim(),
        password: passwordInput.trim(),
        isMainTeacher: false,
        subject: subjectInput.trim() || 'Mata Pelajaran Umum',
        phone: phoneInput.trim() || undefined,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: Date.now(),
        status: statusInput,
        addedBy: currentUser.id,
        addedByName: currentUser.name,
      };
      await lmsService.addTeacher(newTeacher);
    }

    setIsModalOpen(false);
  };

  const handleDeleteTeacher = async (teacher: TeacherItem) => {
    if (teacher.isMainTeacher) {
      setFeedback({
        isOpen: true,
        type: 'warning',
        title: 'Tidak Dapat Dihapus',
        message: 'Akun Guru Utama dilindungi dan tidak dapat dihapus.',
      });
      return;
    }
    setFeedback({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Hapus Akun Guru',
      message: `Apakah Anda yakin ingin menghapus akun guru "${teacher.name}"? Akses guru tersebut ke sistem akan dicabut.`,
      confirmLabel: 'Ya, Hapus Guru',
      onConfirm: async () => {
        await lmsService.deleteTeacher(teacher.id);
        setFeedback({
          isOpen: true,
          type: 'success',
          title: 'Akun Guru Dihapus',
          message: `Akun guru "${teacher.name}" berhasil dihapus.`,
        });
      },
    });
  };

  const handleResetTeacherPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPromptTeacher || !newPasswordValue.trim()) return;

    const updated: TeacherItem = {
      ...resetPromptTeacher,
      password: newPasswordValue.trim(),
    };
    await lmsService.updateTeacher(updated);
    setResetSuccessNotice(`Password untuk ${resetPromptTeacher.name} berhasil diubah!`);
    setTimeout(() => {
      setResetPromptTeacher(null);
      setResetSuccessNotice('');
      setNewPasswordValue('');
    }, 1500);
  };

  if (!isMainTeacher) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-base font-bold text-slate-900">Hak Akses Terbatas</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Hanya <strong>Guru Utama MTsN 3 Banyuwangi</strong> yang memiliki otorisasi untuk menambah, mengedit, atau menghapus akun guru lain.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <SchoolLogo size="lg" className="flex-shrink-0" />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-700/80 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Otoritas Guru Utama MTsN 3 Banyuwangi</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold">Manajemen Akun Guru & Staf Pengajar</h2>
            <p className="text-xs text-emerald-100/90">
              Kelola daftar guru pengajar, berikan hak akses login, dan atur mata pelajaran yang diampu.
            </p>
          </div>
        </div>

        <button
          id="btn-add-teacher"
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition shadow-sm flex items-center gap-2 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4 text-emerald-700" />
          <span>Tambah Akun Guru Baru</span>
        </button>
      </div>

      {/* Menu Pintasan Khusus Guru Utama (Admin): Ganti Nama Sekolah & Edit Akun Guru Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Identitas & Nama Sekolah</h4>
              <p className="text-[11px] text-slate-500">Ubah nama madrasah / sekolah di seluruh aplikasi</p>
            </div>
          </div>
          {onOpenSchoolSettings && (
            <button
              type="button"
              onClick={onOpenSchoolSettings}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition whitespace-nowrap shadow-2xs"
            >
              Ganti Nama Sekolah
            </button>
          )}
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Akun Guru Utama (Admin)</h4>
              <p className="text-[11px] text-slate-500">Ubah email resmi login dan kata sandi Guru Utama</p>
            </div>
          </div>
          {onOpenMainCredentials && (
            <button
              type="button"
              onClick={onOpenMainCredentials}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition whitespace-nowrap shadow-2xs"
            >
              Edit Email & Password
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari guru berdasarkan nama, NIP, mapel..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Terdaftar: <strong className="text-slate-800">{teachers.length} Guru</strong> ({teachers.filter(t => t.status === 'aktif').length} Aktif)
        </div>
      </div>

      {/* Teachers List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Profil Guru</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Kontak & NIP</th>
                <th className="py-3 px-4">Status & Peran</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {/* Clean Badge without Photo */}
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                        {teacher.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{teacher.name}</span>
                          {teacher.isMainTeacher && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded border border-amber-300">
                              Guru Utama
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{teacher.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-xs">
                      {teacher.subject}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-xs text-slate-600 space-y-0.5">
                    <div>NIP: <span className="font-mono text-slate-800">{teacher.nip || '-'}</span></div>
                    {teacher.phone && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Phone className="w-3 h-3" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      teacher.status === 'aktif'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      <span className="capitalize">{teacher.status}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setResetPromptTeacher(teacher);
                        setNewPasswordValue(teacher.password || 'guru123');
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                      title="Ubah Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(teacher)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="Edit Data Guru"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {!teacher.isMainTeacher && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTeacher(teacher)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus Akun Guru"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">
                  {editingTeacher ? 'Edit Akun Guru' : 'Tambah Guru Pengajar Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Contoh: Siti Aisyah, S.Pd."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP / Kode Guru
                  </label>
                  <input
                    type="text"
                    value={nipInput}
                    onChange={(e) => setNipInput(e.target.value)}
                    placeholder="1985..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mata Pelajaran (Mapel) *
                  </label>
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    placeholder="IPA / Matematika / PAI"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Login *
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="guru@mtsn3banyuwangi.sch.id"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi Login *
                  </label>
                  <input
                    type="text"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="08..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as 'aktif' | 'nonaktif')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="aktif">Aktif (Dapat Login)</option>
                    <option value="nonaktif">Nonaktif (Ditangguhkan)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white shadow-xs transition"
                >
                  {editingTeacher ? 'Simpan Perubahan' : 'Daftarkan Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal for specific Teacher */}
      {resetPromptTeacher && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-sm text-slate-900">Ubah Kata Sandi Guru</h4>
              </div>
              <button
                onClick={() => setResetPromptTeacher(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ubah kata sandi login untuk <strong>{resetPromptTeacher.name}</strong> ({resetPromptTeacher.email}):
            </p>

            {resetSuccessNotice ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{resetSuccessNotice}</span>
              </div>
            ) : (
              <form onSubmit={handleResetTeacherPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="text"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Masukkan password baru"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResetPromptTeacher(null)}
                    className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-xs transition"
                  >
                    Simpan Sandi
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        confirmLabel={feedback.confirmLabel}
        onConfirm={feedback.onConfirm}
        onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
