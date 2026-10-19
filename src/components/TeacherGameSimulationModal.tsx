import React, { useState } from 'react';
import { Gamepad2, X, RotateCcw, Trophy, Sparkles, CheckCircle2, Award, Info } from 'lucide-react';
import { Chapter, ChapterGame } from '../types';
import { InteractiveGame } from './InteractiveGame';

interface TeacherGameSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter | null;
  gameOverride?: ChapterGame;
}

export const TeacherGameSimulationModal: React.FC<TeacherGameSimulationModalProps> = ({
  isOpen,
  onClose,
  chapter,
  gameOverride,
}) => {
  if (!isOpen || (!chapter && !gameOverride)) return null;

  const game = gameOverride || chapter?.game;
  if (!game) return null;

  const [simulatedScore, setSimulatedScore] = useState<number | null>(null);
  const [gameKey, setGameKey] = useState<number>(0);

  const getGameTypeName = (type: string) => {
    switch (type) {
      case 'memory_match':
        return 'Kartu Memori Pasangan';
      case 'speed_trivia':
        return 'Kuis Kilat Kecepatan (Speed Trivia)';
      case 'word_scramble':
        return 'Susun Kata Acak (Word Scramble)';
      case 'true_false':
        return 'Tantangan Fakta Benar atau Salah';
      case 'card_sort':
        return 'Pilah Kategori Konsep (Card Sort)';
      default:
        return 'Game Edukasi Interaktif';
    }
  };

  const handleGameComplete = (score: number) => {
    setSimulatedScore(score);
  };

  const handleRestart = () => {
    setSimulatedScore(null);
    setGameKey((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-purple-200 animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-bold">
              <Gamepad2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-purple-950 text-[10px] font-black uppercase tracking-wider">
                  Mode Uji Coba Guru
                </span>
                <span className="text-xs text-purple-200">
                  {chapter ? `Bab ${chapter.chapterNumber}: ${chapter.title}` : 'Pratinjau Game'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Simulasi Game Edukasi: {game.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestart}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title="Mulai Ulang Game"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Ulangi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              title="Tutup Simulasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Banner for Teacher */}
        <div className="px-5 py-2.5 bg-purple-50 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2 text-xs text-purple-950">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span>
              Tipe Game: <strong>{getGameTypeName(game.gameType)}</strong> • Target KKM:{' '}
              <strong>{game.targetScore} Poin</strong>
            </span>
          </div>
          <span className="text-[11px] text-purple-700 font-medium">
            💡 Skor dan progres dalam simulasi ini tidak memengaruhi data nilai riil siswa.
          </span>
        </div>

        {/* Game Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            <InteractiveGame
              key={gameKey}
              game={game}
              onComplete={handleGameComplete}
              previousBestScore={simulatedScore || undefined}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {simulatedScore !== null ? (
              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Uji coba selesai! Skor Anda: {simulatedScore} / {game.targetScore}
              </span>
            ) : (
              <span>Coba mainkan game di atas untuk memverifikasi alur interaksi dan kecocokan materi.</span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleRestart}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              Uji Coba Ulang
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs"
            >
              Selesai Uji Coba
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
