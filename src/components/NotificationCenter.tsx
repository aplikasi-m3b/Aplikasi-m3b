import React from 'react';
import { 
  Bell, 
  CheckCheck, 
  X, 
  BookOpen, 
  HelpCircle, 
  Gamepad2, 
  Award, 
  Clock 
} from 'lucide-react';
import { NotificationItem } from '../types';
import { lmsService } from '../services/lmsService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onSelectStudent?: (studentId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectStudent
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    lmsService.markAllNotificationsRead();
  };

  const handleItemClick = (notif: NotificationItem) => {
    lmsService.markNotificationRead(notif.id);
    if (onSelectStudent) {
      onSelectStudent(notif.studentId);
      onClose();
    }
  };

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'materi':
        return <BookOpen className="w-4 h-4 text-sky-600" />;
      case 'soal':
        return <HelpCircle className="w-4 h-4 text-amber-600" />;
      case 'game':
        return <Gamepad2 className="w-4 h-4 text-emerald-600" />;
      case 'asesmen':
        return <Award className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTypeBadge = (type: NotificationItem['type']) => {
    switch (type) {
      case 'materi':
        return <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">Materi Selesai</span>;
      case 'soal':
        return <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Latihan Soal</span>;
      case 'game':
        return <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Game Interaktif</span>;
      case 'asesmen':
        return <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">Asesmen Akhir</span>;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/30 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] mt-12 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Notifikasi Aktivitas</h3>
              <p className="text-xs text-slate-500">Laporan real-time progres siswa di kelas</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded hover:bg-emerald-50 transition flex items-center gap-1"
              title="Tandai semua dibaca"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Sudah Baca</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Belum ada notifikasi aktivitas baru</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-3 rounded-xl transition cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                  !notif.read ? 'bg-emerald-50/40 border-l-4 border-emerald-500' : ''
                }`}
              >
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs flex-shrink-0 mt-0.5">
                  {getTypeIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {notif.studentName}
                    </span>
                    {getTypeBadge(notif.type)}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(notif.timestamp)}
                    </span>
                    {notif.score !== undefined && (
                      <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                        notif.score >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Skor: {notif.score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Guru akan otomatis menerima notifikasi setiap siswa menyelesaikan materi, kuis, atau game
          </p>
        </div>
      </div>
    </div>
  );
};
