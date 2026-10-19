import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Lock, 
  User, 
  X, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  BookOpen
} from 'lucide-react';
import { ClassItem, Student, UserSession } from '../types';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassItem[];
  students: Student[];
  onLoginSuccess: (session: UserSession) => void;
  initialClassId?: string;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  onLoginSuccess,
  initialClassId
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || (classes[0]?.id ?? ''));
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [step, setStep] = useState<number>(1); // 1: Pilih Kelas, 2: Pilih Siswa & Password

  useEffect(() => {
    if (initialClassId) {
      setSelectedClassId(initialClassId);
    } else if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, initialClassId, selectedClassId]);

  // Students in selected class
  const classStudents = students.filter(s => s.classId === selectedClassId);

  useEffect(() => {
    if (classStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [classStudents, selectedStudentId]);

  if (!isOpen) return null;

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    const relevantStudents = students.filter(s => s.classId === classId);
    if (relevantStudents.length > 0) {
      setSelectedStudentId(relevantStudents[0].id);
    } else {
      setSelectedStudentId('');
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedClassId) {
      setErrorMsg('Silakan pilih kelas terlebih dahulu');
      setStep(1);
      return;
    }

    if (!selectedStudentId) {
      setErrorMsg('Silakan pilih nama siswa');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      setErrorMsg('Data siswa tidak ditemukan');
      return;
    }

    // Check password (default is '123' if not set)
    if (student.password && student.password !== password) {
      setErrorMsg('Password salah! Coba password default "123" atau hubungi guru Anda.');
      return;
    }

    const selectedClass = classes.find(c => c.id === selectedClassId);

    const session: UserSession = {
      role: 'siswa',
      id: student.id,
      name: student.name,
      nis: student.nis,
      classId: student.classId,
      className: selectedClass ? selectedClass.name : undefined,
      avatar: student.avatar,
    };

    onLoginSuccess(session);
    onClose();
  };

  const currentClass = classes.find(c => c.id === selectedClassId);
  const selectedStudentObj = students.find(s => s.id === selectedStudentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-emerald-700 to-teal-800 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center mb-3">
            <GraduationCap className="w-7 h-7 text-emerald-200" />
          </div>
          <h2 className="text-xl font-bold">Portal Masuk Siswa</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Pilih kelas, pilih nama Anda, lalu masukkan kata sandi untuk memulai belajar
          </p>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold">
            <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              step === 1 ? 'bg-white text-emerald-800 shadow-xs' : 'bg-white/20 text-white'
            }`}>
              <span>1. Pilih Kelas</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />
            <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              step === 2 ? 'bg-white text-emerald-800 shadow-xs' : 'bg-white/20 text-white'
            }`}>
              <span>2. Nama & Password</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Langkah 1: Pilih Kelas Anda
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => handleClassSelect(cls.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      selectedClassId === cls.id 
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{cls.name}</div>
                        <div className="text-xs text-slate-500">{cls.grade} • {cls.subject}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Selected Class info badge */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Kelas: <strong className="text-slate-800">{currentClass?.name}</strong></span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-emerald-700 hover:underline font-semibold"
                >
                  Ubah
                </button>
              </div>

              {/* Student Name Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Nama Siswa
                </label>
                {classStudents.length === 0 ? (
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-700 text-xs">
                    Belum ada siswa yang didaftarkan pada kelas ini oleh guru.
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="select-student-name"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                    >
                      {classStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (NISN: {s.nis}) {s.gender ? `[${s.gender}]` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                )}
              </div>

              {/* Student info Preview */}
              {selectedStudentObj && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 ${
                    selectedStudentObj.gender === 'Perempuan'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {selectedStudentObj.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-emerald-950">{selectedStudentObj.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        selectedStudentObj.gender === 'Perempuan'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}>
                        {selectedStudentObj.gender || 'Laki-laki'}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700">NISN: {selectedStudentObj.nis} • Poin: {selectedStudentObj.totalPoints} pts</div>
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Kata Sandi (Password)
                  </label>
                  <span className="text-[10px] text-slate-400">Default: 123</span>
                </div>
                <div className="relative">
                  <input
                    id="student-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Kembali
                </button>
                <button
                  id="student-submit-login-btn"
                  type="submit"
                  disabled={classStudents.length === 0}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>Masuk Belajar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
