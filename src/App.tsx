import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Award, 
  ArrowRight,
  Sparkles,
  Gamepad2,
  CheckCircle2,
  Bell,
  Share2,
  QrCode,
  Smartphone
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentLoginModal } from './components/StudentLoginModal';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { NotificationCenter } from './components/NotificationCenter';
import { ShareAppModal } from './components/ShareAppModal';
import { SchoolLogo } from './components/SchoolLogo';
import { lmsService } from './services/lmsService';
import { 
  ClassItem, 
  Student, 
  Chapter, 
  StudentProgress, 
  NotificationItem, 
  PersonalRecommendation, 
  UserSession,
  TeacherItem
} from './types';
import { INITIAL_CLASSES, INITIAL_STUDENTS } from './data/initialData';

export default function App() {
  // Real-time collections state
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progressList, setProgressList] = useState<StudentProgress[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [recommendations, setRecommendations] = useState<PersonalRecommendation[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [schoolSettings, setSchoolSettings] = useState(() => lmsService.getSchoolSettings());

  // Active Session & Class
  const [activeClass, setActiveClass] = useState<ClassItem | null>(null);
  
  // Active Session & Class (defaults to null so user lands on portal selection screen)
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Modal states
  const [isStudentLoginOpen, setIsStudentLoginOpen] = useState(false);
  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Initialize data service
  useEffect(() => {
    lmsService.initialize();

    const unsubSettings = lmsService.subscribeSchoolSettings((data) => {
      setSchoolSettings(data);
      if (data?.schoolName && typeof document !== 'undefined') {
        document.title = `LMS ${data.schoolName}`;
      }
    });

    const unsubClasses = lmsService.subscribeClasses((data) => {
      setClasses(data);
      if (!activeClass && data.length > 0) {
        setActiveClass(data[0]);
      } else if (activeClass) {
        // Keep active class synced
        const found = data.find(c => c.id === activeClass.id);
        if (found) setActiveClass(found);
      }
    });

    const unsubStudents = lmsService.subscribeStudents((data) => {
      setStudents(data);
    });

    const unsubChapters = lmsService.subscribeChapters((data) => {
      setChapters(data);
    });

    const unsubProgress = lmsService.subscribeProgress((data) => {
      setProgressList(data);
    });

    const unsubNotifications = lmsService.subscribeNotifications('teacher-main', (data) => {
      setNotifications(data);
    });

    const unsubRecommendations = lmsService.subscribeRecommendations(null, (data) => {
      setRecommendations(data);
    });

    const unsubTeachers = lmsService.subscribeTeachers((data) => {
      setTeachers(data);
    });

    return () => {
      if (unsubSettings) unsubSettings();
      if (unsubClasses) unsubClasses();
      if (unsubStudents) unsubStudents();
      if (unsubChapters) unsubChapters();
      if (unsubProgress) unsubProgress();
      if (unsubNotifications) unsubNotifications();
      if (unsubRecommendations) unsubRecommendations();
      if (unsubTeachers) unsubTeachers();
    };
  }, []);

  // Active student object if logged in as student
  const activeStudentObj = currentUser?.role === 'siswa'
    ? students.find(s => s.id === currentUser.id)
    : null;

  // Filter chapters for student: only chapters whose assignedClassIds includes student's class
  const studentAllowedChapters = chapters.filter(c => {
    const studentClassId = activeStudentObj?.classId || activeClass?.id;
    if (!studentClassId) return false;
    if (Array.isArray(c.assignedClassIds) && c.assignedClassIds.length > 0) {
      return c.assignedClassIds.includes(studentClassId);
    }
    return c.classId === studentClassId;
  });

  const classChapters = studentAllowedChapters;

  const handleSelectClass = (cls: ClassItem) => {
    setActiveClass(cls);
  };

  const handleLoginSuccess = (session: UserSession) => {
    setCurrentUser(session);
    if (session.classId) {
      const cls = classes.find(c => c.id === session.classId);
      if (cls) setActiveClass(cls);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Quick switch between demo roles
  const handleQuickSwitchRole = (targetRole: 'guru' | 'siswa') => {
    if (targetRole === 'guru') {
      // Prompt password verification so students cannot bypass teacher login
      setIsTeacherLoginOpen(true);
    } else {
      const sampleStudent = students.find(s => s.classId === activeClass?.id) || students[0] || INITIAL_STUDENTS[0];
      setCurrentUser({
        role: 'siswa',
        id: sampleStudent.id,
        name: sampleStudent.name,
        nis: sampleStudent.nis,
        classId: sampleStudent.classId,
        className: activeClass?.name,
        avatar: sampleStudent.avatar,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        classes={classes}
        activeClass={activeClass}
        onSelectClass={handleSelectClass}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenLogin={(role) => role === 'guru' ? setIsTeacherLoginOpen(true) : setIsStudentLoginOpen(true)}
        onLogout={handleLogout}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      {/* Role Switcher Floating Bar */}
      <div className="bg-slate-800 text-white text-xs py-2 px-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300">Mode Simulasi Pengguna:</span>
          <span className="font-bold text-white uppercase tracking-wider">
            {currentUser ? (
              currentUser.role === 'guru' 
                ? (currentUser.isMainTeacher ? `Guru Utama (${schoolSettings.schoolName || 'Admin'})` : `Guru Pengajar (${currentUser.name})`) 
                : `Siswa (${currentUser.name})`
            ) : 'Tamu (Belum Login)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden sm:inline">Cepat beralih peran:</span>
          <button
            id="switch-to-teacher-btn"
            onClick={() => handleQuickSwitchRole('guru')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              currentUser?.role === 'guru' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' 
                : 'bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600'
            }`}
          >
            Beralih ke Guru Utama
          </button>
          <button
            id="switch-to-student-btn"
            onClick={() => {
              if (currentUser?.role !== 'siswa') {
                setIsStudentLoginOpen(true);
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              currentUser?.role === 'siswa' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600'
            }`}
          >
            Masuk Siswa (Pilih Kelas & Password)
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser ? (
          currentUser.role === 'guru' ? (
            activeClass ? (
              <TeacherDashboard
                currentClass={activeClass}
                allClasses={classes}
                students={students}
                chapters={chapters}
                progressList={progressList}
                notifications={notifications}
                recommendations={recommendations}
                currentUser={currentUser}
                teachers={teachers}
                onSelectClass={handleSelectClass}
              />
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <BookOpen className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <h3 className="font-bold text-slate-800 text-base">Tidak ada kelas aktif</h3>
                <p className="text-xs text-slate-500 mt-1">Silakan tambahkan kelas baru untuk memulai mengajar.</p>
              </div>
            )
          ) : (
            // Student Mode
            activeClass && activeStudentObj ? (
              <StudentDashboard
                currentClass={activeClass}
                currentStudent={activeStudentObj}
                chapters={classChapters}
                progressList={progressList}
                recommendations={recommendations}
                currentUser={currentUser}
                teachers={teachers}
              />
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p className="text-sm text-slate-600">Memuat data kelas siswa...</p>
              </div>
            )
          )
        ) : (
          /* Welcome Screen when logged out */
          <div className="max-w-3xl mx-auto my-12 text-center space-y-8 animate-in fade-in">
            <div className="flex justify-center mb-2">
              <SchoolLogo size="xl" className="filter drop-shadow-lg" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Sistem Manajemen Pembelajaran Digital {schoolSettings.schoolName || 'MTsN 3 Banyuwangi'}</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                LMS {schoolSettings.schoolName || 'MTsN 3 Banyuwangi'}
              </h1>
              <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                Materi terstruktur, latihan soal, game pembelajaran edukatif, obrolan real-time guru-siswa, dan diagnosis akademik cerdas.
              </p>
            </div>

            {/* Two Entry Portals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto text-left">
              {/* Student Portal Card */}
              <div 
                onClick={() => setIsStudentLoginOpen(true)}
                className="p-6 bg-white rounded-3xl border-2 border-emerald-500/30 hover:border-emerald-500 hover:shadow-lg transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-xs">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Portal Siswa</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Pilih kelas Anda, pilih nama siswa, dan masukkan password untuk mengakses materi pelajaran, kuis & tantangan game.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-bold text-emerald-700 gap-1">
                  <span>Masuk Sebagai Siswa</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Teacher Portal Card */}
              <div 
                onClick={() => setIsTeacherLoginOpen(true)}
                className="p-6 bg-white rounded-3xl border-2 border-indigo-500/30 hover:border-indigo-500 hover:shadow-lg transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 shadow-xs">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Portal Guru & Pengajar</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Login Guru Utama dengan password khusus atau akun guru pengajar terdaftar untuk kelola kelas, materi, dan progres siswa.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-bold text-indigo-700 gap-1">
                  <span>Masuk Sebagai Pengajar</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Quick Share Banner */}
            <div className="max-w-xl mx-auto p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Akses LMS Lewat HP & Laptop Siswa</h4>
                  <p className="text-[11px] text-emerald-700">Dapatkan link publik & barcode scan untuk dibagikan ke siswa</p>
                </div>
              </div>
              <button
                id="welcome-share-btn"
                onClick={() => setIsShareModalOpen(true)}
                className="w-full sm:w-auto px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition flex-shrink-0 shadow-xs"
              >
                <QrCode className="w-4 h-4" />
                <span>Buka Link & QR</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <StudentLoginModal
        isOpen={isStudentLoginOpen}
        onClose={() => setIsStudentLoginOpen(false)}
        classes={classes}
        students={students}
        initialClassId={activeClass?.id}
        onLoginSuccess={handleLoginSuccess}
      />

      <TeacherLoginModal
        isOpen={isTeacherLoginOpen}
        onClose={() => setIsTeacherLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
      />

      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
