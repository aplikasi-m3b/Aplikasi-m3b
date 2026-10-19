import React, { useState } from 'react';
import { 
  GraduationCap, 
  Bell, 
  User, 
  LogOut, 
  BookOpen, 
  CheckCircle2, 
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { UserSession, NotificationItem, ClassItem, SchoolSettings } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { lmsService } from '../services/lmsService';

interface NavbarProps {
  currentUser: UserSession | null;
  classes: ClassItem[];
  activeClass: ClassItem | null;
  onSelectClass: (cls: ClassItem) => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenLogin: (role: 'guru' | 'siswa') => void;
  onLogout: () => void;
  onOpenShare?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  classes,
  activeClass,
  onSelectClass,
  notifications,
  onOpenNotifications,
  onOpenLogin,
  onLogout,
  onOpenShare,
}) => {
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => lmsService.getSchoolSettings());
  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    const unsub = lmsService.subscribeSchoolSettings((s) => setSchoolSettings(s));
    return () => { if (unsub) unsub(); };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Identitas Sekolah */}
        <div className="flex items-center gap-3">
          <SchoolLogo size="md" className="flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                {schoolSettings.schoolName || 'MTsN 3 Banyuwangi'}
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 hidden sm:inline-block">
                LMS Digital
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {schoolSettings.schoolSubtitle || 'Madrasah Tsanawiyah Negeri 3 Banyuwangi'}
            </p>
          </div>
        </div>

        {/* Class Selector (if available) */}
        {currentUser && classes.length > 0 && (
          <div className="relative">
            <button
              id="class-selector-btn"
              onClick={() => setClassDropdownOpen(!classDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-medium transition"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span className="max-w-[140px] sm:max-w-[200px] truncate">
                {activeClass ? activeClass.name : 'Pilih Kelas'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {classDropdownOpen && (
              <div 
                className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setClassDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Daftar Kelas Tersedia
                </div>
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => onSelectClass(cls)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-emerald-50 transition ${
                      activeClass?.id === cls.id ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{cls.name}</span>
                    {activeClass?.id === cls.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bagikan Link / QR Button */}
          {onOpenShare && (
            <button
              id="navbar-share-btn"
              onClick={onOpenShare}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 text-xs font-bold transition shadow-2xs"
              title="Bagikan Link / QR Code Aplikasi untuk Siswa di HP & Laptop"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Bagikan Link</span>
            </button>
          )}

          {currentUser ? (
            <>
              {/* Notification Bell for Guru */}
              {currentUser.role === 'guru' && (
                <button
                  id="teacher-notifications-btn"
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
                  title="Notifikasi Aktivitas Siswa"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-rose-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* User badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border shadow-2xs ${
                  currentUser.role === 'guru'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-teal-100 text-teal-800 border-teal-300'
                }`}>
                  {currentUser.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1">
                    {currentUser.role === 'guru' ? (
                      currentUser.isMainTeacher ? (
                        <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Guru Utama</span>
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                          Guru Pengajar
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
                        Siswa
                      </span>
                    )}
                    {currentUser.nis && (
                      <span className="text-[10px] text-slate-500 font-mono">NISN: {currentUser.nis}</span>
                    )}
                  </div>
                </div>

                {/* Switch / Logout */}
                <button
                  id="user-logout-btn"
                  onClick={onLogout}
                  className="ml-1 p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Ganti Akun / Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="open-student-login-btn"
                onClick={() => onOpenLogin('siswa')}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
              >
                Login Siswa
              </button>
              <button
                id="open-teacher-login-btn"
                onClick={() => onOpenLogin('guru')}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Login Guru
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
