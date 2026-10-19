import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  MessageSquare, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Gamepad2, 
  Award, 
  HelpCircle, 
  ChevronRight, 
  Search,
  Sparkles,
  ShieldCheck,
  Eye,
  FileText,
  Share2,
  QrCode,
  RotateCcw,
  FileSpreadsheet,
  Download,
  UploadCloud,
  UserCheck,
  GraduationCap,
  AlertTriangle,
  School,
  KeyRound
} from 'lucide-react';
import { 
  ClassItem, 
  Student, 
  Chapter, 
  StudentProgress, 
  NotificationItem, 
  PersonalRecommendation, 
  UserSession,
  TeacherItem,
  SchoolSettings
} from '../types';
import { lmsService } from '../services/lmsService';
import { AnalyticsView } from './AnalyticsView';
import { ClassChat } from './ClassChat';
import { TeacherManagement } from './TeacherManagement';
import { SchoolLogo } from './SchoolLogo';
import { ShareAppModal } from './ShareAppModal';
import { ChapterContentEditorModal } from './ChapterContentEditorModal';
import { ResetProgressModal } from './ResetProgressModal';
import { FeedbackModal, FeedbackType } from './FeedbackModal';
import { StudentExcelUploadModal } from './StudentExcelUploadModal';
import { downloadStudentTemplateExcel } from '../utils/excelStudentHelper';
import { StudentDashboard } from './StudentDashboard';
import { TeacherGameSimulationModal } from './TeacherGameSimulationModal';
import { SchoolSettingsModal } from './SchoolSettingsModal';
import { MainTeacherCredentialsModal } from './MainTeacherCredentialsModal';

interface TeacherDashboardProps {
  currentClass: ClassItem;
  allClasses: ClassItem[];
  students: Student[];
  chapters: Chapter[];
  progressList: StudentProgress[];
  notifications: NotificationItem[];
  recommendations: PersonalRecommendation[];
  currentUser: UserSession;
  teachers?: TeacherItem[];
  onSelectClass: (cls: ClassItem) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentClass,
  allClasses,
  students,
  chapters,
  progressList,
  notifications,
  recommendations,
  currentUser,
  teachers = [],
  onSelectClass,
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'analytics' | 'classes_students' | 'chapters' | 'chat' | 'teachers'>('progress');
  const [searchStudent, setSearchStudent] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Class Modal state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [classNameInput, setClassNameInput] = useState('');
  const [classSubjectInput, setClassSubjectInput] = useState('');
  const [classGradeInput, setClassGradeInput] = useState('');
  const [classDescInput, setClassDescInput] = useState('');

  // Student Modal state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentNisInput, setStudentNisInput] = useState('');
  const [studentGenderInput, setStudentGenderInput] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [studentPasswordInput, setStudentPasswordInput] = useState('123');

  // Excel Upload Modal state
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);

  // Chapter Content Editor Modal (Full editing for Material, Reading Check, Quiz, Game, Assessment)
  const [isContentEditorOpen, setIsContentEditorOpen] = useState(false);
  const [contentEditorChapter, setContentEditorChapter] = useState<Chapter | null>(null);
  const [contentEditorInitialTab, setContentEditorInitialTab] = useState<'material' | 'reading_check' | 'quiz' | 'game' | 'assessment'>('material');
  const [aiGeneratorMenuChapterId, setAiGeneratorMenuChapterId] = useState<string | null>(null);

  // Teacher Simulation & Testing States
  const [previewStudentChapter, setPreviewStudentChapter] = useState<Chapter | null>(null);
  const [simulatedGameChapter, setSimulatedGameChapter] = useState<Chapter | null>(null);

  // Reset Progress Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPreselectedStudentId, setResetPreselectedStudentId] = useState<string | undefined>(undefined);
  const [resetPreselectedChapterId, setResetPreselectedChapterId] = useState<string | undefined>(undefined);

  // Modals for Guru Utama (Admin)
  const [isSchoolSettingsModalOpen, setIsSchoolSettingsModalOpen] = useState(false);
  const [isMainCredentialsModalOpen, setIsMainCredentialsModalOpen] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => lmsService.getSchoolSettings());

  React.useEffect(() => {
    const unsub = lmsService.subscribeSchoolSettings((s) => setSchoolSettings(s));
    return () => { if (unsub) unsub(); };
  }, []);

  // Attractive Feedback Modal State
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: FeedbackType;
    title: string;
    message: string;
    onConfirmAction?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showFeedback = (
    type: FeedbackType,
    title: string,
    message: string,
    onConfirmAction?: () => void,
    confirmLabel?: string
  ) => {
    setFeedback({
      isOpen: true,
      type,
      title,
      message,
      onConfirmAction,
      confirmLabel,
      cancelLabel: 'Batal',
    });
  };

  const hideFeedback = () => {
    setFeedback(prev => ({ ...prev, isOpen: false }));
  };

  const handleOpenContentEditor = (
    chap?: Chapter,
    initialTab: 'material' | 'reading_check' | 'quiz' | 'game' | 'assessment' = 'material'
  ) => {
    setContentEditorChapter(chap || null);
    setContentEditorInitialTab(initialTab);
    setIsContentEditorOpen(true);
  };

  const handleOpenResetModal = (studentId?: string, chapterId?: string) => {
    setResetPreselectedStudentId(studentId);
    setResetPreselectedChapterId(chapterId);
    setIsResetModalOpen(true);
  };

  // Filter students for active class
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const filteredStudents = classStudents.filter(s => 
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) || 
    s.nis.includes(searchStudent)
  );

  // Filter chapters so that a teacher only sees chapters they created (Guru Utama can manage all school chapters)
  const myTeacherChapters = chapters.filter(chap => {
    if (currentUser.isMainTeacher || currentUser.id === 'teacher-main') {
      return true;
    }
    if (chap.teacherId) {
      return chap.teacherId === currentUser.id;
    }
    return false;
  });

  // Class CRUD Handlers
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassNameInput('');
    setClassSubjectInput('');
    setClassGradeInput('Kelas 7 SMP');
    setClassDescInput('');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassItem) => {
    setEditingClass(cls);
    setClassNameInput(cls.name);
    setClassSubjectInput(cls.subject);
    setClassGradeInput(cls.grade);
    setClassDescInput(cls.description);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) return;

    if (editingClass) {
      const updated: ClassItem = {
        ...editingClass,
        name: classNameInput.trim(),
        subject: classSubjectInput.trim(),
        grade: classGradeInput.trim(),
        description: classDescInput.trim(),
      };
      await lmsService.updateClass(updated);
    } else {
      const newCls: ClassItem = {
        id: `class-${Date.now()}`,
        name: classNameInput.trim(),
        subject: classSubjectInput.trim(),
        grade: classGradeInput.trim(),
        description: classDescInput.trim(),
        code: `${classSubjectInput.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        createdAt: Date.now(),
      };
      await lmsService.addClass(newCls);
      onSelectClass(newCls);
    }
    setIsClassModalOpen(false);
    showFeedback('success', editingClass ? 'Kelas Diperbarui' : 'Kelas Berhasil Dibuat', `Data kelas "${classNameInput.trim()}" telah berhasil disimpan.`);
  };

  const handleDeleteClass = (clsId: string, clsName: string) => {
    showFeedback(
      'confirm',
      'Hapus Kelas',
      `Apakah Anda yakin ingin menghapus kelas "${clsName}" beserta seluruh data siswa dan materinya? Tindakan ini tidak dapat dibatalkan.`,
      async () => {
        await lmsService.deleteClass(clsId);
        const remaining = allClasses.filter(c => c.id !== clsId);
        if (remaining.length > 0) {
          onSelectClass(remaining[0]);
        }
        showFeedback('success', 'Kelas Dihapus', `Kelas "${clsName}" telah berhasil dihapus.`);
      },
      'Ya, Hapus Kelas'
    );
  };

  // Student CRUD Handlers
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentNameInput('');
    setStudentNisInput('');
    setStudentGenderInput('Laki-laki');
    setStudentPasswordInput('123');
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentNameInput(student.name);
    setStudentNisInput(student.nis);
    setStudentGenderInput(student.gender || 'Laki-laki');
    setStudentPasswordInput(student.password || '123');
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNameInput.trim() || !studentNisInput.trim()) {
      showFeedback('warning', 'Data Belum Lengkap', 'Nama Siswa dan NISN wajib diisi.');
      return;
    }

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        name: studentNameInput.trim(),
        nis: studentNisInput.trim(),
        gender: studentGenderInput,
        password: studentPasswordInput.trim() || '123',
      };
      await lmsService.updateStudent(updated);
      showFeedback('success', 'Data Siswa Diperbarui', `Informasi siswa "${updated.name}" berhasil diperbarui.`);
    } else {
      const newStu: Student = {
        id: `student-${Date.now()}`,
        classId: currentClass.id,
        name: studentNameInput.trim(),
        nis: studentNisInput.trim(),
        gender: studentGenderInput,
        password: studentPasswordInput.trim() || '123',
        totalPoints: 0,
        completedItemsCount: 0,
      };
      await lmsService.addStudent(newStu);
      showFeedback('success', 'Siswa Ditambahkan', `Siswa "${newStu.name}" (NISN: ${newStu.nis}) berhasil ditambahkan ke kelas ${currentClass.name}.`);
    }
    setIsStudentModalOpen(false);
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    showFeedback(
      'confirm',
      'Hapus Siswa Dari Kelas',
      `Apakah Anda yakin ingin menghapus data siswa "${studentName}" dari kelas ${currentClass.name}? Seluruh riwayat dan progres belajarnya akan dihapus.`,
      async () => {
        await lmsService.deleteStudent(studentId);
        showFeedback('success', 'Siswa Dihapus', `Siswa "${studentName}" berhasil dihapus dari kelas.`);
      },
      'Ya, Hapus'
    );
  };

  // Chapter CRUD Handlers (Always open full editor with complete editing for Material, Quiz, Game, Assessment)
  const handleOpenAddChapter = () => {
    handleOpenContentEditor(undefined, 'material');
  };

  const handleOpenEditChapter = (
    chap: Chapter, 
    tab: 'material' | 'reading_check' | 'quiz' | 'game' | 'assessment' = 'material'
  ) => {
    handleOpenContentEditor(chap, tab);
  };

  const handleDeleteChapter = (chapId: string, chapTitle: string) => {
    showFeedback(
      'confirm',
      'Hapus Alur Bab Pembelajaran',
      `Apakah Anda yakin ingin menghapus bab "${chapTitle}" beserta seluruh materi bacaan, latihan soal, game edukasi, dan asesmen akhirnya?`,
      async () => {
        await lmsService.deleteChapter(chapId);
        showFeedback('success', 'Bab Pembelajaran Dihapus', `Bab "${chapTitle}" telah berhasil dihapus.`);
      },
      'Ya, Hapus Bab'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-6 rounded-3xl shadow-sm border border-emerald-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <SchoolLogo size="xl" className="flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                  {schoolSettings.schoolName || 'MTsN 3 Banyuwangi'}
                </span>
                {currentUser.isMainTeacher ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black tracking-wide flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Akun Guru Utama (Admin)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-[11px] font-semibold">
                    Guru Pengajar: {currentUser.name}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">{currentClass.name}</h1>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
                {currentClass.description || 'Kelola bab, materi terstruktur, kuis, game interaktif, dan pantau perkembangan siswa secara real-time.'}
              </p>

              {/* Menu Khusus Guru Utama (Admin): Ganti Nama Sekolah & Edit Email/Password */}
              {currentUser.isMainTeacher && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    id="btn-banner-school-settings"
                    type="button"
                    onClick={() => setIsSchoolSettingsModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    title="Menu untuk mengganti nama madrasah / sekolah di seluruh sistem LMS"
                  >
                    <School className="w-3.5 h-3.5" />
                    <span>Ganti Nama Sekolah</span>
                  </button>

                  <button
                    id="btn-banner-main-credentials"
                    type="button"
                    onClick={() => setIsMainCredentialsModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500/60 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    title="Menu untuk mengubah email resmi login dan kata sandi Guru Utama"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                    <span>Edit Email & Password Guru Utama</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center min-w-20">
              <div className="text-2xl font-black text-white">{classStudents.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Siswa</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center min-w-20">
              <div className="text-2xl font-black text-emerald-400">{chapters.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Bab</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center min-w-20">
              <div className="text-2xl font-black text-amber-400">{notifications.filter(n => !n.read).length}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Notif Baru</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-6 pt-5 border-t border-white/10 overflow-x-auto pb-1">
          <button
            id="tab-progress"
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'progress' 
                ? 'bg-emerald-500 text-white shadow-xs' 
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pantau Progres Siswa</span>
          </button>

          <button
            id="tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analytics' 
                ? 'bg-indigo-500 text-white shadow-xs' 
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analisis Performa & Diagnosis</span>
          </button>

          <button
            id="tab-chapters"
            onClick={() => setActiveTab('chapters')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'chapters' 
                ? 'bg-indigo-500 text-white shadow-xs' 
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Alur Bab & Materi</span>
          </button>

          <button
            id="tab-classes-students"
            onClick={() => setActiveTab('classes_students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'classes_students' 
                ? 'bg-indigo-500 text-white shadow-xs' 
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kelola Kelas & Siswa</span>
          </button>

          <button
            id="tab-chat"
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'chat' 
                ? 'bg-emerald-500 text-white shadow-xs' 
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ruang Diskusi & Chat</span>
          </button>

          {/* Tab Kelola Guru - Khusus Guru Utama / Staff MTsN 3 */}
          <button
            id="tab-teachers"
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'teachers' 
                ? 'bg-amber-400 text-slate-950 shadow-xs font-black' 
                : 'text-amber-300 hover:text-white hover:bg-amber-500/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:text-amber-200" />
            <span>Kelola Guru & Staf Pengajar</span>
            {currentUser.isMainTeacher && (
              <span className="text-[9px] bg-amber-200 text-amber-950 px-1 py-0.2 rounded font-extrabold">
                Utama
              </span>
            )}
          </button>

          {/* Quick Share Link button */}
          <div className="ml-auto pl-2">
            <button
              id="teacher-share-link-btn"
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan Link / QR Siswa</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Real-time Progress Tracking per Student & per Chapter Item */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          {/* Class Selection Bar for Progress Monitoring */}
          {allClasses.length > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-700 text-white rounded-xl shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider block">
                    Pilih Kelas untuk Dipantau:
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">
                    Menampilkan progres siswa untuk kelas: <strong className="text-emerald-900 font-bold">{currentClass.name}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {allClasses.map((cls) => {
                  const isSelected = cls.id === currentClass.id;
                  const count = students.filter(s => s.classId === cls.id).length;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => onSelectClass(cls)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-950'
                      }`}
                    >
                      <span>{cls.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600 font-semibold'
                      }`}>
                        {count} Siswa
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Pemantauan Progres Siswa Real-Time</h2>
              <p className="text-xs text-slate-500">
                Memantau secara detail setiap aktivitas: membaca materi, pengerjaan kuis, game interaktif, dan asesmen akhir
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  placeholder="Cari nama atau NISN..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <button
                type="button"
                onClick={() => handleOpenResetModal()}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
                title="Reset hasil jika siswa ingin mengulang materi / latihan / asesmen"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Reset Hasil Siswa</span>
              </button>
            </div>
          </div>

          {/* Table of students & chapter items */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4">NISN</th>
                    {chapters.map((chap) => (
                      <th key={chap.id} className="py-3.5 px-4 text-center min-w-[220px]">
                        Bab {chap.chapterNumber}: {chap.title.split(':')[1] || chap.title}
                      </th>
                    ))}
                    <th className="py-3.5 px-4 text-center">Poin & Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={chapters.length + 4} className="py-8 text-center text-slate-400">
                        Tidak ada siswa yang sesuai pencarian
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 transition">
                          {/* Student name & clean badge (No photo needed) */}
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${
                                student.gender === 'Perempuan' 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                  : 'bg-sky-50 text-sky-700 border-sky-200'
                              }`}>
                                {student.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-800">{student.name}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    student.gender === 'Perempuan' 
                                      ? 'bg-rose-100 text-rose-700' 
                                      : 'bg-sky-100 text-sky-700'
                                  }`}>
                                    {student.gender === 'Perempuan' ? 'P' : 'L'}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400">Password: {student.password || '123'}</div>
                              </div>
                            </div>
                          </td>

                          {/* NISN */}
                          <td className="py-3 px-4 font-mono font-medium text-slate-600">
                            {student.nis}
                          </td>

                          {/* Chapter Details */}
                          {chapters.map((chap) => {
                            const prog = progressList.find(p => p.studentId === student.id && p.chapterId === chap.id);

                            return (
                              <td key={chap.id} className="py-3 px-4">
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                                  {/* Step 1: Materi */}
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 flex items-center gap-1">
                                      <BookOpen className="w-3 h-3 text-sky-600" />
                                      Materi:
                                    </span>
                                    {prog?.materialCompleted ? (
                                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Selesai
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-medium">Belum</span>
                                    )}
                                  </div>

                                  {/* Step 2: Soal Kuis */}
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 flex items-center gap-1">
                                      <HelpCircle className="w-3 h-3 text-amber-600" />
                                      Latihan:
                                    </span>
                                    {prog?.quizCompleted ? (
                                      <span className="font-bold text-slate-800">
                                        {prog.quizScore} pts
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">Belum</span>
                                    )}
                                  </div>

                                  {/* Step 3: Game */}
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 flex items-center gap-1">
                                      <Gamepad2 className="w-3 h-3 text-emerald-600" />
                                      Game:
                                    </span>
                                    {prog?.gameCompleted ? (
                                      <span className="font-bold text-emerald-700">
                                        {prog.gameScore} pts
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">Belum</span>
                                    )}
                                  </div>

                                  {/* Step 4: Asesmen */}
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 flex items-center gap-1">
                                      <Award className="w-3 h-3 text-indigo-600" />
                                      Asesmen:
                                    </span>
                                    {prog?.assessmentCompleted ? (
                                      <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                        (prog.assessmentScore || 0) >= chap.assessment.passingScore
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}>
                                        {prog.assessmentScore} pts
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">Belum</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            );
                          })}

                          {/* Points & Badge */}
                          <td className="py-3 px-4 text-center">
                            <div className="font-bold text-sm text-emerald-700">
                              {student.totalPoints} pts
                            </div>
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                              Aktif Belajar
                            </span>
                          </td>

                          {/* Reset Action */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenResetModal(student.id)}
                              className="px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center gap-1 mx-auto shadow-2xs"
                              title="Reset hasil pengerjaan siswa ini jika ingin mengulang"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-700" />
                              <span>Reset</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Performance Analytics with Recharts and Strengths/Weaknesses */}
      {activeTab === 'analytics' && (
        <AnalyticsView
          currentClass={currentClass}
          allClasses={allClasses}
          students={students}
          chapters={chapters}
          progressList={progressList}
          recommendations={recommendations}
          teacherName={currentUser.name}
          onSelectClass={onSelectClass}
        />
      )}

      {/* TAB 3: Structured Chapters & Curriculum Creator */}
      {activeTab === 'chapters' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="font-bold text-slate-900 text-base">Alur Bab & Materi Terstruktur</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                  Akun Guru: {currentUser.name}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Menampilkan <strong>{myTeacherChapters.length}</strong> bab milik Anda. Materi hanya tampil di akun Anda dan kelas yang Anda tambahkan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleOpenContentEditor()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Kelola Materi & Generator AI</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddChapter}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Bab Baru</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myTeacherChapters.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Belum Ada Bab yang Anda Buat</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Anda masuk sebagai <strong>{currentUser.name}</strong>. Materi atau bab yang Anda buat bersifat privat dan hanya tampil di akun Anda. Klik tombol di bawah untuk membuat bab baru dan memilih kelas yang dapat mengaksesnya.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddChapter}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Bab Pembelajaran Pertama</span>
                </button>
              </div>
            ) : (
              myTeacherChapters.map((chap, idx) => {
                const assignedClassesList = allClasses.filter(c => 
                  (chap.assignedClassIds && chap.assignedClassIds.includes(c.id)) || c.id === chap.classId
                );

                return (
                  <div key={chap.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:border-slate-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                          {chap.chapterNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-base">{chap.title}</h3>
                            {chap.material.uploadedFile && (
                              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold uppercase">
                                {chap.material.uploadedFile.fileType}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{chap.description}</p>

                          {/* Hak Akses Kelas */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                              Hak Akses Kelas:
                            </span>
                            {assignedClassesList.length > 0 ? (
                              assignedClassesList.map(c => (
                                <span key={c.id} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                                  {c.name}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Belum ada kelas yang ditambahkan (Siswa belum dapat membaca)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Tombol Simulasi & Uji Coba Tampilan Siswa */}
                    <button
                      type="button"
                      onClick={() => setPreviewStudentChapter(chap)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      title="Uji coba tampilan materi pop-up, soal latihan, game, dan asesmen seperti yang dilihat siswa"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-700" />
                      <span>Uji Coba Tampilan Siswa</span>
                    </button>

                    {/* Tombol Simulasi Game Edukasi Khusus */}
                    <button
                      type="button"
                      onClick={() => setSimulatedGameChapter(chap)}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      title="Simulasikan dan mainkan game edukasi bab ini langsung"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-purple-700" />
                      <span>Simulasi Game</span>
                    </button>

                    {/* Dropdown Generator AI Terintegrasi */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setAiGeneratorMenuChapterId(aiGeneratorMenuChapterId === chap.id ? null : chap.id)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                        title="Pilih fitur AI Generator: Latihan Soal, Game Edukasi, Asesmen Akhir, atau Cek Pemahaman"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Generator AI ▾</span>
                      </button>

                      {aiGeneratorMenuChapterId === chap.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-30" 
                            onClick={() => setAiGeneratorMenuChapterId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-indigo-100 p-2 z-40 animate-in fade-in zoom-in-95">
                            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Pilih Fitur Generator AI:
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAiGeneratorMenuChapterId(null);
                                handleOpenEditChapter(chap, 'quiz');
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-blue-50 text-xs font-semibold text-blue-950 flex items-center gap-2 transition"
                            >
                              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                              <div>
                                <div className="font-bold text-blue-900">Generate Latihan Soal (AI)</div>
                                <div className="text-[10px] text-slate-500 font-normal">Buat butir soal dari teks materi bab</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAiGeneratorMenuChapterId(null);
                                handleOpenEditChapter(chap, 'game');
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-purple-50 text-xs font-semibold text-purple-950 flex items-center gap-2 transition"
                            >
                              <Gamepad2 className="w-4 h-4 text-purple-600 shrink-0" />
                              <div>
                                <div className="font-bold text-purple-900">Generate Game Edukasi (AI)</div>
                                <div className="text-[10px] text-slate-500 font-normal">5 model game interaktif & prompt guru</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAiGeneratorMenuChapterId(null);
                                handleOpenEditChapter(chap, 'assessment');
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-amber-50 text-xs font-semibold text-amber-950 flex items-center gap-2 transition"
                            >
                              <Award className="w-4 h-4 text-amber-600 shrink-0" />
                              <div>
                                <div className="font-bold text-amber-900">Generate Asesmen Akhir (AI)</div>
                                <div className="text-[10px] text-slate-500 font-normal">Evaluasi komprehensif ketuntasan bab</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAiGeneratorMenuChapterId(null);
                                handleOpenEditChapter(chap, 'reading_check');
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 text-xs font-semibold text-emerald-950 flex items-center gap-2 transition"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div>
                                <div className="font-bold text-emerald-900">Generate Cek Bacaan (AI)</div>
                                <div className="text-[10px] text-slate-500 font-normal">Pilihan ganda & isian pemahaman</div>
                              </div>
                            </button>
                            <div className="border-t border-slate-100 my-1"></div>
                            <button
                              type="button"
                              onClick={() => {
                                setAiGeneratorMenuChapterId(null);
                                handleOpenEditChapter(chap, 'material');
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition"
                            >
                              <BookOpen className="w-4 h-4 text-slate-600 shrink-0" />
                              <div>
                                <div className="font-bold text-slate-800">Edit Materi & Upload File</div>
                                <div className="text-[10px] text-slate-500 font-normal">Ganti teks bacaan atau upload Word/PDF</div>
                              </div>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenResetModal(undefined, chap.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                      title="Reset Hasil Seluruh Siswa di Bab Ini"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditChapter(chap, 'material')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      title="Edit Seluruh Alur Bab (Materi, Latihan, Game, Asesmen)"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Edit Bab</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChapter(chap.id, chap.title)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Hapus Bab"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4 Structured Steps in this chapter - Clickable to directly edit that component */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  {/* Step 1: Materi */}
                  <div 
                    role="button"
                    onClick={() => handleOpenEditChapter(chap, 'material')}
                    className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 hover:border-sky-400 hover:bg-sky-50 transition cursor-pointer group shadow-2xs"
                    title="Klik untuk mengedit Materi Bacaan & Poin Inti"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-sky-600" />
                        <span className="font-bold text-xs text-sky-950">1. Materi Bacaan</span>
                      </div>
                      <span className="text-[10px] text-sky-600 font-bold opacity-0 group-hover:opacity-100 transition">
                        Edit ✎
                      </span>
                    </div>
                    <p className="text-xs text-sky-900 font-medium truncate">{chap.material.title}</p>
                    <div className="text-[11px] text-sky-700 mt-1">
                      {chap.material.readingTimeMinutes} mnt • {chap.material.summaryPoints.length} poin inti
                    </div>
                    {chap.material.checkQuestions && chap.material.checkQuestions.length > 0 && (
                      <div className="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                        ✓ {chap.material.checkQuestions.length} Soal Cek Bacaan
                      </div>
                    )}
                  </div>

                  {/* Step 2: Soal Latihan */}
                  <div 
                    role="button"
                    onClick={() => handleOpenEditChapter(chap, 'quiz')}
                    className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition cursor-pointer group shadow-2xs"
                    title="Klik untuk mengedit Latihan Soal, Kunci Jawaban & Pembahasan"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-xs text-amber-950">2. Latihan Soal</span>
                      </div>
                      <span className="text-[10px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition">
                        Edit ✎
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 font-medium truncate">{chap.quiz.title}</p>
                    <div className="text-[11px] text-amber-700 mt-1">
                      {chap.quiz.questions.length} Soal • KKM: {chap.quiz.passingScore}
                    </div>
                  </div>

                  {/* Step 3: Game Pembelajaran */}
                  <div 
                    className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 transition group shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div 
                          role="button"
                          onClick={() => handleOpenEditChapter(chap, 'game')}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <Gamepad2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-xs text-emerald-950">3. Game Edukasi</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenEditChapter(chap, 'game')}
                          className="text-[10px] text-emerald-600 font-bold hover:underline"
                        >
                          Edit ✎
                        </button>
                      </div>
                      <p className="text-xs text-emerald-900 font-medium truncate">{chap.game.title}</p>
                      <div className="text-[11px] text-emerald-700 mt-1">
                        Tipe: {chap.game.gameType || chap.game.type || 'Interaktif'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSimulatedGameChapter(chap)}
                      className="mt-2 w-full py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-2xs"
                    >
                      <Gamepad2 className="w-3 h-3 text-amber-300" />
                      <span>Simulasikan Game</span>
                    </button>
                  </div>

                  {/* Step 4: Asesmen Akhir */}
                  <div 
                    role="button"
                    onClick={() => handleOpenEditChapter(chap, 'assessment')}
                    className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer group shadow-2xs"
                    title="Klik untuk mengedit Asesmen Akhir & Soal Evaluasi"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-xs text-indigo-950">4. Asesmen Akhir</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition">
                        Edit ✎
                      </span>
                    </div>
                    <p className="text-xs text-indigo-900 font-medium truncate">{chap.assessment.title}</p>
                    <div className="text-[11px] text-indigo-700 mt-1">
                      {chap.assessment.questions.length} Soal • KKM: {chap.assessment.passingScore}
                    </div>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      </div>
      )}

      {/* TAB 4: Manage Classes & Students */}
      {activeTab === 'classes_students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class List & Actions (Left Column) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Daftar Kelas</h3>
                <p className="text-xs text-slate-500">Total {allClasses.length} kelas terdaftar</p>
              </div>
              <button
                onClick={handleOpenAddClass}
                className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                title="Tambah Kelas"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {allClasses.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => onSelectClass(cls)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    currentClass.id === cls.id 
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{cls.name}</div>
                    <div className="text-[11px] text-slate-500">{cls.grade} • {cls.subject}</div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {allClasses.length > 1 && (
                      <button
                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student List in this Class (Right 2-Columns) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Daftar Siswa di {currentClass.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Total {classStudents.length} siswa terdaftar. Anda dapat menambah satu-per-satu atau import sekaligus via Excel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => downloadStudentTemplateExcel(currentClass.name)}
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                  title="Unduh template format Excel (.xlsx) untuk upload data siswa satu kelas"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Format Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExcelUploadModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                  title="Upload data siswa satu kelas dari file Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-200" />
                  <span>Upload Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddStudent}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Manual</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classStudents.length === 0 ? (
                <div className="sm:col-span-2 py-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-xs text-slate-600">Belum ada siswa di kelas ini</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gunakan tombol "Upload Excel" atau "Tambah Manual" untuk menambahkan siswa
                  </p>
                </div>
              ) : (
                classStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3">
                      {/* Gender-colored clean badge without photo */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 ${
                        student.gender === 'Perempuan' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}>
                        {student.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{student.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            student.gender === 'Perempuan' 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-sky-100 text-sky-700'
                          }`}>
                            {student.gender || 'Laki-laki'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          NISN: <strong className="font-mono text-slate-700">{student.nis}</strong> • Password: <strong>{student.password || '123'}</strong>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          Poin Belajar: {student.totalPoints} pts
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditStudent(student)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                        title="Edit Siswa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Class Chat Real-Time */}
      {activeTab === 'chat' && (
        <ClassChat
          currentClass={currentClass}
          allClasses={allClasses}
          currentUser={currentUser}
          teachers={teachers}
          onSelectClass={onSelectClass}
        />
      )}

      {/* TAB 6: Teacher & Staff Management */}
      {activeTab === 'teachers' && (
        <TeacherManagement
          teachers={teachers}
          currentUser={currentUser}
          onOpenSchoolSettings={() => setIsSchoolSettingsModalOpen(true)}
          onOpenMainCredentials={() => setIsMainCredentialsModalOpen(true)}
        />
      )}

      {/* MODAL: Tambah / Edit Kelas */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingClass ? 'Edit Informasi Kelas' : 'Tambah Kelas Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Isi data detail kelas yang akan dikelola oleh pengajar.
            </p>

            <form onSubmit={handleSaveClass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  placeholder="Contoh: Kelas 7B - Ilmu Pengetahuan Alam"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={classSubjectInput}
                  onChange={(e) => setClassSubjectInput(e.target.value)}
                  placeholder="Contoh: IPA Biologi"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat / Jenjang</label>
                <input
                  type="text"
                  value={classGradeInput}
                  onChange={(e) => setClassGradeInput(e.target.value)}
                  placeholder="Contoh: Kelas 7 SMP"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={classDescInput}
                  onChange={(e) => setClassDescInput(e.target.value)}
                  placeholder="Keterangan tujuan kurikulum kelas..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Siswa */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru ke Kelas'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Data siswa tidak memerlukan foto. Siswa dapat login dengan memilih kelas, nama, dan kata sandi.
            </p>

            <form onSubmit={handleSaveStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  placeholder="Contoh: Muhammad Rizky"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Jenis Kelamin: Laki-laki / Perempuan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentGenderInput('Laki-laki')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      studentGenderInput === 'Laki-laki'
                        ? 'bg-sky-50 border-sky-500 text-sky-700 ring-2 ring-sky-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>👦 Laki-laki</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentGenderInput('Perempuan')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      studentGenderInput === 'Perempuan'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>👧 Perempuan</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Siswa Nasional (NISN)
                </label>
                <input
                  type="text"
                  value={studentNisInput}
                  onChange={(e) => setStudentNisInput(e.target.value)}
                  placeholder="Contoh: 0081234567"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi (Password Login Siswa)</label>
                <input
                  type="text"
                  value={studentPasswordInput}
                  onChange={(e) => setStudentPasswordInput(e.target.value)}
                  placeholder="Default: 123"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Upload Excel Siswa untuk 1 Kelas */}
      <StudentExcelUploadModal
        isOpen={isExcelUploadModalOpen}
        onClose={() => setIsExcelUploadModalOpen(false)}
        className={currentClass.name}
        onConfirmImport={async (importedStudents) => {
          const newStudents: Student[] = importedStudents.map(s => ({
            id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            classId: currentClass.id,
            name: s.name,
            nis: s.nis,
            nisn: s.nis,
            gender: s.gender,
            password: s.password || '123',
            totalPoints: 0,
            completedItemsCount: 0,
          }));
          await lmsService.addStudentsBatch(newStudents);
        }}
        onShowFeedback={(type, title, message) => {
          showFeedback(type, title, message);
        }}
      />

      {/* MODAL: Editor Lengkap Seluruh Alur Bab (Materi, Dokumen/PDF, Latihan Soal, Game, & Asesmen) */}
      <ChapterContentEditorModal
        isOpen={isContentEditorOpen}
        onClose={() => setIsContentEditorOpen(false)}
        classId={currentClass.id}
        allClasses={allClasses}
        currentUser={currentUser}
        chapter={contentEditorChapter}
        initialTab={contentEditorInitialTab}
        onSave={async (savedChapter) => {
          await lmsService.saveChapter(savedChapter);
          setIsContentEditorOpen(false);
          showFeedback(
            'success',
            'Bab Pembelajaran Berhasil Disimpan!',
            `Seluruh komponen Bab "${savedChapter.title}" (Materi, Latihan Soal, Game Pembelajaran, dan Asesmen Akhir) berhasil diperbarui dan ditugaskan ke kelas pilihan Anda.`
          );
        }}
        onSimulateStudent={async (currentChapter) => {
          await lmsService.saveChapter(currentChapter);
          setIsContentEditorOpen(false);
          setPreviewStudentChapter(currentChapter);
        }}
      />

      {/* MODAL: Reset Hasil Pembelajaran Siswa */}
      <ResetProgressModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        currentClass={currentClass}
        classId={currentClass.id}
        students={classStudents}
        chapters={myTeacherChapters.length > 0 ? myTeacherChapters : chapters}
        progressList={progressList}
        initialStudentId={resetPreselectedStudentId}
        preselectedStudentId={resetPreselectedStudentId}
        initialChapterId={resetPreselectedChapterId}
        preselectedChapterId={resetPreselectedChapterId}
        onSuccess={(msg) => {
          showFeedback(
            'success',
            'Progres Berhasil Direset!',
            msg || 'Data aktivitas pengerjaan siswa yang dipilih telah direset kembali ke awal.'
          );
        }}
      />

      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* MODAL SIMULASI GAME EDUKASI KHUSUS GURU */}
      <TeacherGameSimulationModal
        isOpen={!!simulatedGameChapter}
        onClose={() => setSimulatedGameChapter(null)}
        chapter={simulatedGameChapter}
      />

      {/* MODAL FULLSCREEN SIMULASI & UJI COBA TAMPILAN SISWA (Materi, Soal, Game, Asesmen) */}
      {previewStudentChapter && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto p-2 sm:p-5 flex flex-col animate-in fade-in">
          <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col my-auto min-h-0">
            {/* Header Kontrol Simulasi Guru */}
            <div className="bg-slate-900 text-white px-5 py-3.5 rounded-t-3xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-2xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      Mode Uji Coba Guru
                    </span>
                    <span className="text-xs text-slate-300">
                      Bab {previewStudentChapter.chapterNumber}: {previewStudentChapter.title}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    Pratinjau Tampilan Siswa: Materi Pop-up, Soal Latihan, Game Edukatif, & Asesmen
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimulatedGameChapter(previewStudentChapter)}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  title="Buka simulasi game interaktif secara mandiri"
                >
                  <Gamepad2 className="w-4 h-4 text-amber-300" />
                  <span>Simulasi Game Mandiri</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewStudentChapter(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
                >
                  <XCircle className="w-4 h-4 text-rose-300" />
                  <span>Keluar dari Uji Coba</span>
                </button>
              </div>
            </div>

            {/* Container Tampilan Siswa Lengkap */}
            <div className="bg-slate-100 p-3 sm:p-5 rounded-b-3xl border-x border-b border-slate-700 shadow-2xl overflow-y-auto max-h-[85vh]">
              <StudentDashboard
                currentClass={currentClass}
                currentStudent={
                  classStudents[0] || {
                    id: 'demo-student',
                    name: `Siswa Uji Coba (${currentUser.name})`,
                    nis: 'DEMO-01',
                    classId: currentClass.id,
                    gender: 'Laki-laki',
                    totalPoints: 0,
                    completedChapters: 0,
                    weakTopics: [],
                  }
                }
                chapters={chapters}
                progressList={progressList}
                recommendations={recommendations}
                currentUser={{
                  role: 'siswa',
                  id: 'demo-student',
                  name: `Simulasi Guru (${currentUser.name})`,
                  nis: 'SIM-GURU',
                  classId: currentClass.id,
                  className: currentClass.name,
                }}
                teachers={teachers}
                isTeacherSimulation={true}
                initialChapterId={previewStudentChapter.id}
                onCloseSimulation={() => setPreviewStudentChapter(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL GURU UTAMA: Ganti Nama Sekolah */}
      <SchoolSettingsModal
        isOpen={isSchoolSettingsModalOpen}
        onClose={() => setIsSchoolSettingsModalOpen(false)}
        onSuccess={(updated) => {
          setSchoolSettings(updated);
          showFeedback('success', 'Nama Sekolah Diperbarui', `Identitas sekolah telah berhasil diubah menjadi "${updated.schoolName}".`);
        }}
      />

      {/* MODAL GURU UTAMA: Edit Email & Password */}
      <MainTeacherCredentialsModal
        isOpen={isMainCredentialsModalOpen}
        onClose={() => setIsMainCredentialsModalOpen(false)}
        currentUser={currentUser}
        onSuccess={(updated) => {
          showFeedback('success', 'Kredensial Guru Utama Diperbarui', `Akun Guru Utama berhasil diperbarui dengan email: ${updated.email || currentUser.email}.`);
        }}
      />

      {/* MODAL FEEDBACK / KONFIRMASI MENARIK (Ganti browser alert/confirm bawaan) */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        confirmText={feedback.confirmLabel}
        cancelText={feedback.cancelLabel}
        onConfirm={feedback.onConfirmAction}
        onClose={hideFeedback}
      />
    </div>
  );
};
