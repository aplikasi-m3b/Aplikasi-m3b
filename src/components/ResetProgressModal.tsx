import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2, User, BookOpen, X, Sparkles } from 'lucide-react';
import { Student, Chapter, StudentProgress, ClassItem } from '../types';
import { lmsService } from '../services/lmsService';

interface ResetProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass?: ClassItem;
  classId?: string;
  students?: Student[];
  chapters?: Chapter[];
  progressList?: StudentProgress[];
  initialStudentId?: string;
  preselectedStudentId?: string;
  initialChapterId?: string;
  preselectedChapterId?: string;
  onSuccess?: (message?: string) => void;
}

export const ResetProgressModal: React.FC<ResetProgressModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  classId,
  students = [],
  chapters = [],
  progressList = [],
  initialStudentId,
  preselectedStudentId,
  initialChapterId,
  preselectedChapterId,
  onSuccess,
}) => {
  const effectiveStudentId = initialStudentId || preselectedStudentId;
  const effectiveChapterId = initialChapterId || preselectedChapterId;

  const [targetScope, setTargetScope] = useState<'individual' | 'class'>('individual');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(effectiveStudentId || students[0]?.id || '');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(effectiveChapterId || chapters[0]?.id || '');

  // Targets to reset
  const [resetQuiz, setResetQuiz] = useState(true);
  const [resetGame, setResetGame] = useState(true);
  const [resetAssessment, setResetAssessment] = useState(true);
  const [resetMaterial, setResetMaterial] = useState(false);
  const [resetPoints, setResetPoints] = useState(true);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (effectiveStudentId) {
        setSelectedStudentId(effectiveStudentId);
        setTargetScope('individual');
      } else if (students.length > 0 && (!selectedStudentId || !students.some(s => s.id === selectedStudentId))) {
        setSelectedStudentId(students[0].id);
      }
      if (effectiveChapterId) {
        setSelectedChapterId(effectiveChapterId);
      } else if (chapters.length > 0 && (!selectedChapterId || !chapters.some(c => c.id === selectedChapterId))) {
        setSelectedChapterId(chapters[0].id);
      }
    }
  }, [isOpen, effectiveStudentId, effectiveChapterId, students, chapters]);

  if (!isOpen) return null;

  const currentStudent = (students || []).find(s => s.id === selectedStudentId);
  const currentChapter = (chapters || []).find(c => c.id === selectedChapterId);
  const effectiveClass = currentClass || { id: classId || 'class-ipa-7a', name: 'Kelas' };

  const safeProgressList = Array.isArray(progressList) ? progressList : [];
  const currentProg = safeProgressList.find(
    p => p.studentId === selectedStudentId && p.chapterId === selectedChapterId
  );

  const handleSelectAll = () => {
    setResetQuiz(true);
    setResetGame(true);
    setResetAssessment(true);
    setResetMaterial(true);
    setResetPoints(true);
  };

  const handleExecuteReset = async () => {
    if (!selectedChapterId) {
      alert('Pilih bab pembelajaran yang ingin direset.');
      return;
    }
    if (targetScope === 'individual' && !selectedStudentId) {
      alert('Pilih siswa yang ingin direset.');
      return;
    }
    if (!resetQuiz && !resetGame && !resetAssessment && !resetMaterial && !resetPoints) {
      alert('Pilih minimal satu bagian yang ingin di-reset.');
      return;
    }

    setLoading(true);
    try {
      const isAll = resetQuiz && resetGame && resetAssessment && resetMaterial;

      if (targetScope === 'individual') {
        if (isAll) {
          await lmsService.resetStudentProgress(selectedStudentId, selectedChapterId, 'all', resetPoints);
        } else {
          if (resetQuiz) await lmsService.resetStudentProgress(selectedStudentId, selectedChapterId, 'quiz', resetPoints);
          if (resetGame) await lmsService.resetStudentProgress(selectedStudentId, selectedChapterId, 'game', resetPoints);
          if (resetAssessment) await lmsService.resetStudentProgress(selectedStudentId, selectedChapterId, 'assessment', resetPoints);
          if (resetMaterial) await lmsService.resetStudentProgress(selectedStudentId, selectedChapterId, 'material', resetPoints);
        }
        if (resetPoints) {
          await lmsService.resetStudentPoints(selectedStudentId, 0);
        }
        if (onSuccess) {
          onSuccess(`Hasil belajar ${currentStudent?.name || 'siswa'} pada "${currentChapter?.title || 'Bab ini'}" dan total poin telah berhasil direset kembali ke 0 poin.`);
        }
      } else {
        // Bulk class reset
        const clsId = effectiveClass.id;
        if (isAll) {
          await lmsService.resetClassChapterProgress(clsId, selectedChapterId, 'all', resetPoints);
        } else {
          if (resetQuiz) await lmsService.resetClassChapterProgress(clsId, selectedChapterId, 'quiz', resetPoints);
          if (resetGame) await lmsService.resetClassChapterProgress(clsId, selectedChapterId, 'game', resetPoints);
          if (resetAssessment) await lmsService.resetClassChapterProgress(clsId, selectedChapterId, 'assessment', resetPoints);
          if (resetMaterial) await lmsService.resetClassChapterProgress(clsId, selectedChapterId, 'material', resetPoints);
        }
        if (resetPoints) {
          await lmsService.resetClassPoints(clsId, 0);
        }
        if (onSuccess) {
          onSuccess(`Hasil seluruh siswa di kelas ${effectiveClass.name} untuk "${currentChapter?.title || 'Bab ini'}" dan total poin telah berhasil direset kembali ke 0 poin.`);
        }
      }
      onClose();
    } catch (err) {
      console.error('Reset error:', err);
      alert('Gagal mereset hasil. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Reset Hasil Pembelajaran</h3>
              <p className="text-xs text-slate-500">
                Izinkan siswa mengulang pengerjaan soal, game, atau asesmen akhir
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          {/* Target Scope */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Reset</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetScope('individual')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition flex items-center gap-2 ${
                  targetScope === 'individual'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 text-emerald-600" />
                Siswa Tertentu
              </button>
              <button
                type="button"
                onClick={() => setTargetScope('class')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition flex items-center gap-2 ${
                  targetScope === 'class'
                    ? 'border-amber-600 bg-amber-50 text-amber-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Seluruh Kelas ({students.length} Siswa)
              </button>
            </div>
          </div>

          {/* Individual Student Picker */}
          {targetScope === 'individual' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Siswa</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (NIS: {s.nis}) - {s.totalPoints} Poin
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chapter Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Bab Pembelajaran</label>
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {chapters.map(c => (
                <option key={c.id} value={c.id}>
                  Bab {c.chapterNumber}: {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Current Status Preview (if individual) */}
          {targetScope === 'individual' && currentProg && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block mb-1">Status Saat Ini:</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <div>• Latihan Soal: <strong className={currentProg.quizCompleted ? 'text-emerald-600' : 'text-slate-400'}>{currentProg.quizCompleted ? `Selesai (${currentProg.quizScore})` : 'Belum'}</strong></div>
                <div>• Game Edukasi: <strong className={currentProg.gameCompleted ? 'text-emerald-600' : 'text-slate-400'}>{currentProg.gameCompleted ? `Selesai (${currentProg.gameScore})` : 'Belum'}</strong></div>
                <div>• Asesmen Akhir: <strong className={currentProg.assessmentCompleted ? 'text-emerald-600' : 'text-slate-400'}>{currentProg.assessmentCompleted ? `Selesai (${currentProg.assessmentScore})` : 'Belum'}</strong></div>
                <div>• Bacaan Materi: <strong className={currentProg.materialCompleted ? 'text-emerald-600' : 'text-slate-400'}>{currentProg.materialCompleted ? 'Sudah Dibaca' : 'Belum'}</strong></div>
              </div>
            </div>
          )}

          {/* Sections to Reset */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">Pilih Bagian yang Direset:</label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Pilih Semua
              </button>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={resetQuiz}
                  onChange={(e) => setResetQuiz(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-medium">Latihan Soal (Hapus skor & izinkan pengerjaan ulang)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={resetGame}
                  onChange={(e) => setResetGame(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-medium">Game Edukasi (Hapus rekor skor & izinkan bermain kembali)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={resetAssessment}
                  onChange={(e) => setResetAssessment(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-medium">Asesmen Akhir Bab (Hapus skor & status kelulusan untuk ujian ulang)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={resetMaterial}
                  onChange={(e) => setResetMaterial(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-medium">Bacaan Materi & Cek Pemahaman (Siswa harus membaca ulang modul)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/70 cursor-pointer text-xs text-amber-950 font-semibold shadow-2xs">
                <input
                  type="checkbox"
                  checked={resetPoints}
                  onChange={(e) => setResetPoints(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <div className="flex-1">
                  <span className="font-bold text-amber-900">Reset Total Poin Siswa (Kembali ke 0 Poin)</span>
                  <p className="text-[11px] text-amber-700 font-normal mt-0.5">
                    Mengembalikan total akumulasi poin siswa kembali ke 0 poin secara tuntas.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Tindakan ini akan mengosongkan status pengerjaan yang dipilih sehingga siswa dapat memulai kembali pengerjaan dari awal.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteReset}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              {loading ? 'Mereset Data...' : 'Konfirmasi Reset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
