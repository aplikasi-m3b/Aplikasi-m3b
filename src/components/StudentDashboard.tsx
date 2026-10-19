import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  HelpCircle, 
  Gamepad2, 
  Award, 
  CheckCircle2, 
  Lock, 
  Clock, 
  Sparkles, 
  Trophy, 
  ArrowRight, 
  MessageSquare,
  AlertCircle,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Eye,
  Zap,
  RotateCcw,
  X,
  AlertTriangle
} from 'lucide-react';
import { 
  ClassItem, 
  Student, 
  Chapter, 
  StudentProgress, 
  PersonalRecommendation, 
  UserSession,
  NotificationItem,
  TeacherItem
} from '../types';
import { lmsService } from '../services/lmsService';
import { InteractiveGame } from './InteractiveGame';
import { ClassChat } from './ClassChat';
import { SchoolLogo } from './SchoolLogo';
import { FeedbackModal } from './FeedbackModal';
import { ReadingMaterialModal } from './ReadingMaterialModal';

interface StudentDashboardProps {
  currentClass: ClassItem;
  currentStudent: Student;
  chapters: Chapter[];
  progressList: StudentProgress[];
  recommendations: PersonalRecommendation[];
  currentUser: UserSession;
  teachers?: TeacherItem[];
  isTeacherSimulation?: boolean;
  onCloseSimulation?: () => void;
  initialChapterId?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentClass,
  currentStudent,
  chapters,
  progressList,
  recommendations,
  currentUser,
  teachers = [],
  isTeacherSimulation = false,
  onCloseSimulation,
  initialChapterId,
}) => {
  const [activeTab, setActiveTab] = useState<'learning' | 'recommendations' | 'chat'>('learning');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(initialChapterId || chapters[0]?.id || '');
  const [currentStep, setCurrentStep] = useState<'material' | 'quiz' | 'game' | 'assessment'>('material');

  // Pop-up Reading Modal state
  const [isReadingModalOpen, setIsReadingModalOpen] = useState<boolean>(false);
  const [readingModalInitialTab, setReadingModalInitialTab] = useState<'text' | 'document' | 'summary'>('text');

  // Active Chapter
  const activeChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

  // Reading Check state - supports both multiple_choice (number) and short_answer / essay (string)
  const [readingAnswers, setReadingAnswers] = useState<Record<string, number | string>>({});
  const [readingSubmitted, setReadingSubmitted] = useState<boolean>(false);
  const [readingPointsWon, setReadingPointsWon] = useState<number | null>(null);

  // Rundown Waktu Membaca (Countdown Timer in Seconds)
  const calculateInitialSeconds = (chap?: Chapter) => {
    const mins = chap?.material?.readingTimeMinutes || 3;
    // Minimal 60 detik jika waktu diset, atau minimal 30 detik untuk pengujian cepat
    return Math.max(30, mins * 60);
  };

  const [totalReadingSeconds, setTotalReadingSeconds] = useState<number>(() => calculateInitialSeconds(activeChapter));
  const [readingTimerRemaining, setReadingTimerRemaining] = useState<number>(() => calculateInitialSeconds(activeChapter));

  // Quiz state & Countdown Timer
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const quizAnswersRef = React.useRef<Record<string, number>>({});
  quizAnswersRef.current = quizAnswers;
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isQuizTimeExpired, setIsQuizTimeExpired] = useState<boolean>(false);
  const isQuizTimeExpiredRef = React.useRef<boolean>(false);

  const calculateQuizSeconds = (chap?: Chapter) => {
    const mins = chap?.quiz?.timeLimitMinutes || 15;
    return Math.max(30, mins * 60);
  };
  const [totalQuizSeconds, setTotalQuizSeconds] = useState<number>(() => calculateQuizSeconds(activeChapter));
  const [quizTimerRemaining, setQuizTimerRemaining] = useState<number>(() => calculateQuizSeconds(activeChapter));

  // Assessment state & Countdown Timer
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});
  const assessmentAnswersRef = React.useRef<Record<string, number>>({});
  assessmentAnswersRef.current = assessmentAnswers;
  const [assessmentSubmitted, setAssessmentSubmitted] = useState<boolean>(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const [isAssessmentTimeExpired, setIsAssessmentTimeExpired] = useState<boolean>(false);
  const isAssessmentTimeExpiredRef = React.useRef<boolean>(false);

  const calculateAssessmentSeconds = (chap?: Chapter) => {
    const mins = chap?.assessment?.timeLimitMinutes || 20;
    return Math.max(30, mins * 60);
  };
  const [totalAssessmentSeconds, setTotalAssessmentSeconds] = useState<number>(() => calculateAssessmentSeconds(activeChapter));
  const [assessmentTimerRemaining, setAssessmentTimerRemaining] = useState<number>(() => calculateAssessmentSeconds(activeChapter));

  // Pop-up Feedback / Notifikasi Menarik
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Active Student Progress for Active Chapter
  const activeProgress = progressList.find(
    p => p.studentId === currentStudent.id && p.chapterId === activeChapter?.id
  ) || {
    id: `${currentStudent.id}_${activeChapter?.id}`,
    studentId: currentStudent.id,
    chapterId: activeChapter?.id || '',
    classId: currentClass.id,
    materialCompleted: false,
    quizCompleted: false,
    gameCompleted: false,
    assessmentCompleted: false,
    isUnlocked: chapters.findIndex(c => c.id === activeChapter?.id) === 0, // Bab 1 default unlocked
  };

  // Reactively reset local submission states when teacher resets student progress
  React.useEffect(() => {
    if (!activeProgress.materialCompleted) {
      setReadingSubmitted(false);
      setReadingAnswers({});
      setReadingPointsWon(null);
    } else if (activeProgress.readingScore !== undefined) {
      setReadingSubmitted(true);
      setReadingPointsWon(activeProgress.readingScore);
    }

    if (!activeProgress.quizCompleted) {
      setQuizSubmitted(false);
      setQuizAnswers({});
      setQuizScore(null);
    } else if (activeProgress.quizScore !== undefined) {
      setQuizSubmitted(true);
      setQuizScore(activeProgress.quizScore);
    }

    if (!activeProgress.assessmentCompleted) {
      setAssessmentSubmitted(false);
      setAssessmentAnswers({});
      setAssessmentScore(null);
    } else if (activeProgress.assessmentScore !== undefined) {
      setAssessmentSubmitted(true);
      setAssessmentScore(activeProgress.assessmentScore);
    }
  }, [activeChapter?.id, activeProgress.materialCompleted, activeProgress.quizCompleted, activeProgress.assessmentCompleted]);

  // Check if a chapter is unlocked sequentially
  const isChapterUnlocked = (index: number): boolean => {
    if (index === 0) return true;
    const prevChapter = chapters[index - 1];
    if (!prevChapter) return true;
    const prevProg = progressList.find(p => p.studentId === currentStudent.id && p.chapterId === prevChapter.id);
    return !!prevProg?.assessmentCompleted;
  };

  // Synchronize rundown timer on chapter change or reset
  useEffect(() => {
    const mins = activeChapter?.material?.readingTimeMinutes || 3;
    const secs = Math.max(30, mins * 60);
    setTotalReadingSeconds(secs);
    if (!activeProgress.materialCompleted) {
      setReadingTimerRemaining(secs);
    } else {
      setReadingTimerRemaining(0);
    }

    // Synchronize Quiz timer
    const qSecs = calculateQuizSeconds(activeChapter);
    setTotalQuizSeconds(qSecs);
    if (!activeProgress.quizCompleted) {
      setQuizTimerRemaining(qSecs);
      setIsQuizTimeExpired(false);
      isQuizTimeExpiredRef.current = false;
    } else {
      setQuizTimerRemaining(0);
    }

    // Synchronize Assessment timer
    const aSecs = calculateAssessmentSeconds(activeChapter);
    setTotalAssessmentSeconds(aSecs);
    if (!activeProgress.assessmentCompleted) {
      setAssessmentTimerRemaining(aSecs);
      setIsAssessmentTimeExpired(false);
      isAssessmentTimeExpiredRef.current = false;
    } else {
      setAssessmentTimerRemaining(0);
    }
  }, [activeChapter?.id, activeProgress.materialCompleted, activeProgress.quizCompleted, activeProgress.assessmentCompleted]);

  // Reading countdown timer effect
  useEffect(() => {
    let timer: any = null;
    if (currentStep === 'material' && !activeProgress.materialCompleted && readingTimerRemaining > 0) {
      timer = setInterval(() => {
        setReadingTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, activeProgress.materialCompleted, readingTimerRemaining]);

  // Quiz countdown timer effect with auto-submit on timeout
  useEffect(() => {
    let timer: any = null;
    if (currentStep === 'quiz' && !quizSubmitted && !activeProgress.quizCompleted && quizTimerRemaining > 0) {
      timer = setInterval(() => {
        setQuizTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, quizSubmitted, activeProgress.quizCompleted, quizTimerRemaining]);

  // Assessment countdown timer effect with auto-submit on timeout
  useEffect(() => {
    let timer: any = null;
    if (currentStep === 'assessment' && !assessmentSubmitted && !activeProgress.assessmentCompleted && assessmentTimerRemaining > 0) {
      timer = setInterval(() => {
        setAssessmentTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, assessmentSubmitted, activeProgress.assessmentCompleted, assessmentTimerRemaining]);

  const handleAutoSubmitQuiz = () => {
    if (isQuizTimeExpiredRef.current || quizSubmitted) return;
    isQuizTimeExpiredRef.current = true;
    setIsQuizTimeExpired(true);
    handleSubmitQuiz(true);
  };

  const handleAutoSubmitAssessment = () => {
    if (isAssessmentTimeExpiredRef.current || assessmentSubmitted) return;
    isAssessmentTimeExpiredRef.current = true;
    setIsAssessmentTimeExpired(true);
    handleSubmitAssessment(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isReadingTimerFinished = readingTimerRemaining === 0 || activeProgress.materialCompleted;

  const handleSkipTimerForTesting = () => {
    setReadingTimerRemaining(0);
  };

  // Helper function to check if a question is essay / short-answer
  const isEssayQuestion = (cq: any) => {
    return (
      cq.questionType === 'short_answer' ||
      cq.questionType === 'essay' ||
      cq.type === 'short_answer' ||
      cq.type === 'essay' ||
      !cq.options ||
      cq.options.length === 0
    );
  };

  // Helper to send notification to teacher
  const notifyTeacher = async (
    type: 'materi' | 'soal' | 'game' | 'asesmen',
    title: string,
    message: string,
    score?: number
  ) => {
    const notif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      teacherId: currentClass.teacherId || 'teacher-main',
      classId: currentClass.id,
      className: currentClass.name,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      type,
      title,
      message,
      score,
      timestamp: Date.now(),
      read: false,
    };
    await lmsService.sendNotification(notif);
  };

  // STEP 1: Complete Material with Reading Comprehension Check & Points
  const handleCompleteMaterial = async () => {
    // 1. Verifikasi rundown waktu membaca jika belum selesai
    if (!isReadingTimerFinished) {
      setFeedback({
        isOpen: true,
        type: 'warning',
        title: 'Waktu Membaca Belum Selesai',
        message: `Silakan baca dan pahami materi terlebih dahulu. Masih tersisa waktu ${formatTime(readingTimerRemaining)} sebelum Anda dapat lanjut ke tahap berikutnya.`,
      });
      return;
    }

    const checks = activeChapter.material.checkQuestions || [];
    let netReadingPoints = 20; // default base reading points

    if (checks.length > 0) {
      // Verify answers: all questions (multiple choice or essay) must be answered
      let allAnswered = true;
      checks.forEach((cq) => {
        const ans = readingAnswers[cq.id];
        if (isEssayQuestion(cq)) {
          if (typeof ans !== 'string' || ans.trim().length === 0) {
            allAnswered = false;
          }
        } else {
          if (ans === undefined) {
            allAnswered = false;
          }
        }
      });

      if (!allAnswered) {
        setFeedback({
          isOpen: true,
          type: 'warning',
          title: 'Jawaban Belum Lengkap',
          message: 'Silakan isi seluruh jawaban uraian dan pilih jawaban pada Cek Bahwa Anda Sudah Membaca Materi terlebih dahulu sebelum menyelesaikan materi.',
        });
        return;
      }

      let earnedPoints = 0;
      checks.forEach((cq) => {
        const ans = readingAnswers[cq.id];
        if (isEssayQuestion(cq)) {
          const textAns = typeof ans === 'string' ? ans.trim().toLowerCase() : '';
          const hasKeywords = cq.acceptedAnswers && cq.acceptedAnswers.length > 0;
          let isKeywordMatch = false;
          if (hasKeywords) {
            isKeywordMatch = cq.acceptedAnswers.some((kw: string) =>
              kw.trim().length > 0 && textAns.includes(kw.trim().toLowerCase())
            );
          }
          // Jika ada kesesuaian kata kunci atau siswa menulis uraian yang cukup (> 7 karakter)
          if (isKeywordMatch || textAns.length >= 8) {
            earnedPoints += (cq.pointCorrect ?? 10);
          } else {
            earnedPoints += Math.max(5, Math.floor((cq.pointCorrect ?? 10) / 2));
          }
        } else {
          const isCorrect = ans === cq.correctIndex;
          earnedPoints += isCorrect ? (cq.pointCorrect ?? 10) : (cq.pointWrong ?? 0);
        }
      });

      netReadingPoints = Math.max(0, earnedPoints);
      setReadingPointsWon(netReadingPoints);
      setReadingSubmitted(true);
    }

    const updated: StudentProgress = {
      ...activeProgress,
      materialCompleted: true,
      materialCompletedAt: Date.now(),
      readingScore: netReadingPoints,
      readingCheckCompleted: true,
      isUnlocked: true,
    };
    await lmsService.updateProgress(updated);

    // Send notification to teacher
    await notifyTeacher(
      'materi',
      'Materi Pembelajaran Selesai Dibaca',
      `${currentStudent.name} telah selesai membaca materi "${activeChapter.material.title}" dan memperoleh ${netReadingPoints} poin cek pemahaman bacaan.`,
      netReadingPoints
    );

    // Update student points
    const updatedStudent: Student = {
      ...currentStudent,
      totalPoints: currentStudent.totalPoints + netReadingPoints,
      completedItemsCount: currentStudent.completedItemsCount + 1,
    };
    await lmsService.updateStudent(updatedStudent);

    // Next step
    setCurrentStep('quiz');
  };

  // STEP 2: Submit Quiz
  const handleSubmitQuiz = async (isTimeExpired: boolean = false) => {
    const currentAnswers = quizAnswersRef.current || quizAnswers;
    const questions = activeChapter.quiz.questions;
    let correctCount = 0;
    const topicScores: Record<string, { correct: number; total: number }> = {};

    questions.forEach((q) => {
      const selected = currentAnswers[q.id];
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correctCount++;

      if (!topicScores[q.topic]) {
        topicScores[q.topic] = { correct: 0, total: 0 };
      }
      topicScores[q.topic].total += 1;
      if (isCorrect) topicScores[q.topic].correct += 1;
    });

    const calculatedScore = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    const passed = calculatedScore >= activeChapter.quiz.passingScore;
    setQuizScore(calculatedScore);
    setQuizSubmitted(true);
    if (isTimeExpired) {
      setIsQuizTimeExpired(true);
      isQuizTimeExpiredRef.current = true;
      setFeedback({
        isOpen: true,
        type: 'warning',
        title: 'Waktu Latihan Habis!',
        message: `Batas waktu latihan soal (${activeChapter.quiz.timeLimitMinutes || 15} menit) telah berakhir. Jawaban yang Anda kerjakan telah otomatis dikirim dan dinilai dengan skor ${calculatedScore}.`,
      });
    }

    const updated: StudentProgress = {
      ...activeProgress,
      quizCompleted: true,
      quizScore: calculatedScore,
      quizPassed: passed,
      quizCompletedAt: Date.now(),
      topicScores: {
        ...(activeProgress.topicScores || {}),
        ...topicScores,
      }
    };
    await lmsService.updateProgress(updated);

    // Notify teacher
    await notifyTeacher(
      'soal',
      isTimeExpired ? 'Latihan Soal Otomatis Terkirim (Waktu Habis)' : 'Latihan Soal Selesai Dikerjakan',
      `${currentStudent.name} telah menyelesaikan latihan soal "${activeChapter.quiz.title}" dengan skor ${calculatedScore} (${passed ? 'Lulus' : 'Perlu Penguatan'})${isTimeExpired ? ' [Otomatis terkirim saat waktu habis]' : ''}.`,
      calculatedScore
    );

    // Update student points
    const pointsWon = Math.round(calculatedScore * 0.5);
    const updatedStudent: Student = {
      ...currentStudent,
      totalPoints: currentStudent.totalPoints + pointsWon,
      completedItemsCount: currentStudent.completedItemsCount + 1,
    };
    await lmsService.updateStudent(updatedStudent);
  };

  // STEP 3: Complete Game
  const handleGameCompleted = async (gameFinalScore: number) => {
    const updated: StudentProgress = {
      ...activeProgress,
      gameCompleted: true,
      gameScore: gameFinalScore,
      gameCompletedAt: Date.now(),
    };
    await lmsService.updateProgress(updated);

    // Notify teacher
    await notifyTeacher(
      'game',
      'Game Pembelajaran Diselesaikan',
      `${currentStudent.name} berhasil menyelesaikan game interaktif "${activeChapter.game.title}" dengan skor ${gameFinalScore}!`,
      gameFinalScore
    );

    // Update student points
    const pointsWon = Math.round(gameFinalScore * 0.4);
    const updatedStudent: Student = {
      ...currentStudent,
      totalPoints: currentStudent.totalPoints + pointsWon,
      completedItemsCount: currentStudent.completedItemsCount + 1,
    };
    await lmsService.updateStudent(updatedStudent);
  };

  // STEP 4: Submit Assessment
  const handleSubmitAssessment = async (isTimeExpired: boolean = false) => {
    const currentAnswers = assessmentAnswersRef.current || assessmentAnswers;
    const questions = activeChapter.assessment.questions;
    let correctCount = 0;
    const topicScores: Record<string, { correct: number; total: number }> = {};

    questions.forEach((q) => {
      const selected = currentAnswers[q.id];
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correctCount++;

      if (!topicScores[q.topic]) {
        topicScores[q.topic] = { correct: 0, total: 0 };
      }
      topicScores[q.topic].total += 1;
      if (isCorrect) topicScores[q.topic].correct += 1;
    });

    const calculatedScore = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    const passed = calculatedScore >= activeChapter.assessment.passingScore;
    setAssessmentScore(calculatedScore);
    setAssessmentSubmitted(true);
    if (isTimeExpired) {
      setIsAssessmentTimeExpired(true);
      isAssessmentTimeExpiredRef.current = true;
      setFeedback({
        isOpen: true,
        type: 'warning',
        title: 'Waktu Asesmen Habis!',
        message: `Batas waktu asesmen akhir bab (${activeChapter.assessment.timeLimitMinutes || 20} menit) telah berakhir. Jawaban yang Anda kerjakan telah otomatis dikirim dan dinilai dengan skor ${calculatedScore}.`,
      });
    }

    const updated: StudentProgress = {
      ...activeProgress,
      assessmentCompleted: true,
      assessmentScore: calculatedScore,
      assessmentPassed: passed,
      assessmentCompletedAt: Date.now(),
      topicScores: {
        ...(activeProgress.topicScores || {}),
        ...topicScores,
      }
    };
    await lmsService.updateProgress(updated);

    // Notify teacher
    await notifyTeacher(
      'asesmen',
      isTimeExpired ? 'Asesmen Akhir Otomatis Terkirim (Waktu Habis)' : 'Asesmen Akhir Bab Selesai',
      `${currentStudent.name} telah menyelesaikan Asesmen Akhir Bab ${activeChapter.chapterNumber} dengan skor ${calculatedScore} (${passed ? 'LULUS' : 'REMEDIAL'})${isTimeExpired ? ' [Otomatis terkirim saat waktu habis]' : ''}.`,
      calculatedScore
    );

    if (passed && !isTimeExpired) {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 }
      });
    }

    // Update student points
    const pointsWon = passed ? 60 : 25;
    const updatedStudent: Student = {
      ...currentStudent,
      totalPoints: currentStudent.totalPoints + pointsWon,
      completedItemsCount: currentStudent.completedItemsCount + 1,
    };
    await lmsService.updateStudent(updatedStudent);
  };

  // Calculate overall progress across all chapters
  const totalItems = chapters.length * 4;
  let completedItems = 0;
  chapters.forEach((chap) => {
    const p = progressList.find(prog => prog.studentId === currentStudent.id && prog.chapterId === chap.id);
    if (p?.materialCompleted) completedItems++;
    if (p?.quizCompleted) completedItems++;
    if (p?.gameCompleted) completedItems++;
    if (p?.assessmentCompleted) completedItems++;
  });
  const overallPercentage = totalItems === 0 ? 0 : Math.round((completedItems / Math.max(1, totalItems)) * 100);

  // Recommendations for this student
  const studentRecs = recommendations.filter(r => r.studentId === currentStudent.id);

  return (
    <div className="space-y-6">
      {/* Teacher Simulation Banner if viewing in teacher mode */}
      {isTeacherSimulation && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-amber-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold flex-shrink-0">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black uppercase tracking-wider">
                  Mode Uji Coba Guru
                </span>
                <span className="text-xs text-amber-100 font-semibold">Simulasi Tampilan & Alur Siswa</span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Menguji Bab {activeChapter.chapterNumber}: {activeChapter.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!isReadingTimerFinished && (
              <button
                type="button"
                onClick={handleSkipTimerForTesting}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold transition flex items-center gap-1 shadow-xs"
                title="Lewati hitungan mundur membaca untuk mempercepat pengujian alur"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Lewati Waktu Baca (Khusus Guru)</span>
              </button>
            )}

            {onCloseSimulation && (
              <button
                type="button"
                onClick={onCloseSimulation}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <X className="w-4 h-4" />
                <span>Keluar dari Mode Uji Coba</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Student Overview Hero */}
      <div className="bg-gradient-to-r from-teal-850 via-emerald-850 to-emerald-950 text-white p-6 rounded-3xl shadow-sm border border-emerald-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* Clean Avatar Badge without Photo */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl border-2 shadow-md ${
                currentStudent.gender === 'Perempuan'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {currentStudent.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2">
                <SchoolLogo size="sm" className="filter drop-shadow-md" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-bold">
                  MTsN 3 Banyuwangi
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-semibold">
                  Dashboard Siswa
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  currentStudent.gender === 'Perempuan'
                    ? 'bg-rose-400/30 text-rose-100 border border-rose-300/40'
                    : 'bg-sky-400/30 text-sky-100 border border-sky-300/40'
                }`}>
                  {currentStudent.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki'}
                </span>
                <span className="text-xs text-emerald-100 font-mono font-medium">NISN: {currentStudent.nis}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{currentStudent.name}</h1>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {currentClass.name} • Pengajar: {currentClass.teacherName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur border border-white/15 p-3.5 rounded-2xl text-center min-w-28">
              <div className="flex items-center justify-center gap-1.5 text-amber-300 mb-0.5">
                <Trophy className="w-4 h-4" />
                <span className="text-2xl font-black">{currentStudent.totalPoints}</span>
              </div>
              <div className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">
                Total Poin
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur border border-white/15 p-3.5 rounded-2xl text-center min-w-28">
              <div className="flex items-center justify-center gap-1.5 text-emerald-300 mb-0.5">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-2xl font-black">{overallPercentage}%</span>
              </div>
              <div className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">
                Ketuntasan
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-5 border-t border-emerald-700/50">
          <div className="flex items-center justify-between text-xs text-emerald-100 mb-1.5">
            <span>Progres Belajar Menyeluruh</span>
            <span className="font-bold">{completedItems} dari {totalItems} Tahapan Selesai ({overallPercentage}%)</span>
          </div>
          <div className="w-full h-2.5 bg-emerald-950/60 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500 rounded-full"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'learning' 
                ? 'bg-white text-emerald-900 shadow-xs' 
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Alur Belajar Bab</span>
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'recommendations' 
                ? 'bg-white text-emerald-900 shadow-xs' 
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-300" />
            <span>Rekomendasi Guru</span>
            {studentRecs.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 text-[10px] rounded-full font-black">
                {studentRecs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'chat' 
                ? 'bg-white text-emerald-900 shadow-xs' 
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Diskusi Kelas</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Sequential Chapter Learning Flow */}
      {activeTab === 'learning' && (
        chapters.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Belum Ada Bab Pembelajaran Aktif</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Saat ini belum ada materi atau bab pembelajaran yang ditugaskan untuk kelas Anda ({currentClass.name}). Bab yang telah dihapus oleh guru pengajar tidak lagi ditampilkan di akun siswa.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chapter Selector (Sidebar Left) */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Urutan Bab Pembelajaran
            </h3>

            <div className="space-y-2">
              {chapters.map((chap, idx) => {
                const unlocked = isChapterUnlocked(idx);
                const isSelected = selectedChapterId === chap.id;
                const prog = progressList.find(p => p.studentId === currentStudent.id && p.chapterId === chap.id);
                const isCompleted = prog?.assessmentCompleted;

                return (
                  <button
                    key={chap.id}
                    disabled={!unlocked}
                    onClick={() => {
                      setSelectedChapterId(chap.id);
                      setQuizSubmitted(false);
                      setAssessmentSubmitted(false);
                      setQuizAnswers({});
                      setAssessmentAnswers({});
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                      !unlocked 
                        ? 'opacity-60 bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {!unlocked ? (
                        <div className="p-2 rounded-xl bg-slate-200 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                      ) : isCompleted ? (
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs">
                          {chap.chapterNumber}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate">{chap.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {!unlocked ? 'Terkunci (Selesaikan bab sebelumnya)' : isCompleted ? 'Tuntas 100%' : 'Sedang Dipelajari'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chapter Details & 4-Step Stepper (Right 3-Cols) */}
          <div className="lg:col-span-3 space-y-4">
            {activeChapter && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
                {/* Chapter Title & Description */}
                <div className="pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Bab {activeChapter.chapterNumber}
                    </span>
                    <span className="text-xs text-slate-400">Alur Belajar Terstruktur</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{activeChapter.title}</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{activeChapter.description}</p>
                </div>

                {/* 4 Interactive Sequential Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-5">
                  {/* Step 1: Materi */}
                  <button
                    onClick={() => setCurrentStep('material')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      currentStep === 'material'
                        ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Tahap 1</span>
                      {activeProgress.materialCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="text-xs font-bold truncate">Materi Bacaan</div>
                  </button>

                  {/* Step 2: Kuis */}
                  <button
                    onClick={() => setCurrentStep('quiz')}
                    disabled={!activeProgress.materialCompleted}
                    className={`p-3 rounded-2xl border text-left transition ${
                      !activeProgress.materialCompleted
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                        : currentStep === 'quiz'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Tahap 2</span>
                      {!activeProgress.materialCompleted ? (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      ) : activeProgress.quizCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : null}
                    </div>
                    <div className="text-xs font-bold truncate">Latihan Soal</div>
                  </button>

                  {/* Step 3: Game */}
                  <button
                    onClick={() => setCurrentStep('game')}
                    disabled={!activeProgress.quizCompleted}
                    className={`p-3 rounded-2xl border text-left transition ${
                      !activeProgress.quizCompleted
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                        : currentStep === 'game'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Tahap 3</span>
                      {!activeProgress.quizCompleted ? (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      ) : activeProgress.gameCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : null}
                    </div>
                    <div className="text-xs font-bold truncate">Game Edukatif</div>
                  </button>

                  {/* Step 4: Asesmen */}
                  <button
                    onClick={() => setCurrentStep('assessment')}
                    disabled={!activeProgress.gameCompleted}
                    className={`p-3 rounded-2xl border text-left transition ${
                      !activeProgress.gameCompleted
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                        : currentStep === 'assessment'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Tahap 4</span>
                      {!activeProgress.gameCompleted ? (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      ) : activeProgress.assessmentCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : null}
                    </div>
                    <div className="text-xs font-bold truncate">Asesmen Akhir</div>
                  </button>
                </div>

                {/* CONTENT STEP 1: MATERI */}
                {currentStep === 'material' && (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Header Materi & Tombol Buka di Pop-up */}
                    <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{activeChapter.material.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-sky-600" />
                              Durasi Membaca: {activeChapter.material.readingTimeMinutes} Menit
                            </span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">
                              {activeProgress.materialCompleted ? '✓ Telah Selesai Dibaca' : 'Wajib Dibaca'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Utama: Buka Materi di Pop-up Halaman Ini */}
                      <button
                        type="button"
                        onClick={() => setIsReadingModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm flex-shrink-0"
                      >
                        <Maximize2 className="w-4 h-4" />
                        <span>Buka Materi di Jendela Pop-up</span>
                      </button>
                    </div>

                    {/* Rundown Waktu Membaca Banner */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      isReadingTimerFinished
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50/90 border-amber-200 text-amber-950 shadow-2xs'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            isReadingTimerFinished 
                              ? 'bg-emerald-600 text-white shadow-xs' 
                              : 'bg-amber-500 text-white animate-pulse shadow-xs'
                          }`}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider">
                                {isReadingTimerFinished ? 'Rundown Waktu Selesai' : 'Rundown Waktu Membaca'}
                              </span>
                              {!isReadingTimerFinished && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-mono font-bold">
                                  {formatTime(readingTimerRemaining)} tersisa
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {isReadingTimerFinished
                                ? 'Waktu membaca telah terpenuhi. Anda dapat menjawab Cek Pemahaman dan membuka latihan soal.'
                                : 'Siswa belum bisa lanjut ke tahap berikutnya jika waktu belum habis. Silakan cermati materi.'}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar & Skip Button for testing */}
                        <div className="flex items-center gap-2">
                          {!isReadingTimerFinished && (
                            <div className="w-32 bg-amber-200/80 rounded-full h-2.5 overflow-hidden hidden md:block">
                              <div 
                                className="bg-amber-600 h-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, Math.max(0, ((totalReadingSeconds - readingTimerRemaining) / totalReadingSeconds) * 100))}%` }}
                              />
                            </div>
                          )}

                          {(isTeacherSimulation || currentUser.role === 'guru') && !isReadingTimerFinished && (
                            <button
                              type="button"
                              onClick={handleSkipTimerForTesting}
                              className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold transition flex items-center gap-1"
                              title="Khusus guru untuk mempercepat pengujian alur siswa"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Lewati Waktu</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Uploaded File (Word / PDF) Display */}
                    {activeChapter.material.uploadedFile && (
                      <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-xs flex-shrink-0 ${
                            activeChapter.material.uploadedFile.fileType === 'pdf' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-blue-600 text-white'
                          }`}>
                            {activeChapter.material.uploadedFile.fileType}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {activeChapter.material.uploadedFile.fileName}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Dokumen Materi Resmi dari Guru • {(activeChapter.material.uploadedFile.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Buka Berkas Asli di Pop-up Halaman yang Sama */}
                          <button
                            type="button"
                            onClick={() => {
                              setReadingModalInitialTab('document');
                              setIsReadingModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Berkas Asli</span>
                          </button>

                          {activeChapter.material.uploadedFile.fileDataUrl && (
                            <a
                              href={activeChapter.material.uploadedFile.fileDataUrl}
                              download={activeChapter.material.uploadedFile.fileName}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                              <span>Unduh</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rich text reading preview */}
                    <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200 prose prose-sm max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans relative">
                      {activeChapter.material.content}
                      <div className="mt-4 pt-3 border-t border-slate-200/70 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsReadingModalOpen(true)}
                          className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 transition"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Baca di jendela pop-up ukuran penuh (fokus tanpa distraksi)</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary key points */}
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <h4 className="font-bold text-xs text-emerald-950 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Rangkuman Inti Materi:</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-emerald-900">
                        {activeChapter.material.summaryPoints.map((point, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* PERTANYAAN CEK PEMAHAMAN BACAAN & POIN BENAR / SALAH (DENGAN DUKUNGAN SOAL URAIAN) */}
                    {activeChapter.material.checkQuestions && activeChapter.material.checkQuestions.length > 0 && (
                      <div className="p-5 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-200 pb-3">
                          <div>
                            <h4 className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-sky-600" />
                              Cek Bahwa Anda Sudah Membaca Materi
                            </h4>
                            <p className="text-[11px] text-sky-800 mt-0.5">
                              Jawab pertanyaan singkat di bawah ini (pilihan ganda / uraian) untuk membuktikan pemahaman bacaan dan memperoleh poin!
                            </p>
                          </div>
                          {readingPointsWon !== null && (
                            <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs">
                              +{readingPointsWon} Poin Bacaan Diperoleh!
                            </span>
                          )}
                        </div>

                        <div className="space-y-3">
                          {activeChapter.material.checkQuestions.map((cq, cqIdx) => {
                            const selectedOption = readingAnswers[cq.id];
                            const isSubmitted = readingSubmitted || activeProgress.materialCompleted;
                            const isEssay = isEssayQuestion(cq);

                            return (
                              <div key={cq.id} className="p-4 bg-white rounded-xl border border-sky-100 shadow-xs space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-slate-800">
                                      {cqIdx + 1}. {cq.question}
                                    </span>
                                    <div className="text-[10px] text-slate-500 font-medium">
                                      Tipe Soal: <span className="font-bold text-sky-700">{isEssay ? 'Uraian / Esai' : 'Pilihan Ganda'}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                      +{cq.pointCorrect ?? 10} Benar
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                                      {cq.pointWrong ?? 0} Salah
                                    </span>
                                  </div>
                                </div>

                                {/* FORM JAWABAN: URAIAN ATAU PILIHAN GANDA */}
                                {isEssay ? (
                                  /* SOAL URAIAN */
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between">
                                      <label className="block text-xs font-bold text-slate-700">
                                        Ketik Jawaban Uraian Anda:
                                      </label>
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        {typeof selectedOption === 'string' && selectedOption.trim().length > 0
                                          ? `✓ Terisi (${selectedOption.trim().split(/\s+/).length} kata)`
                                          : 'Wajib diisi'}
                                      </span>
                                    </div>

                                    <textarea
                                      rows={3}
                                      disabled={isSubmitted}
                                      value={typeof selectedOption === 'string' ? selectedOption : ''}
                                      onChange={(e) => {
                                        setReadingAnswers(prev => ({
                                          ...prev,
                                          [cq.id]: e.target.value,
                                        }));
                                      }}
                                      placeholder="Ketik jawaban uraian dan penjelasan Anda di sini berdasarkan materi yang telah dibaca..."
                                      className="w-full p-3 rounded-xl border border-sky-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none font-sans disabled:bg-slate-50 disabled:text-slate-600"
                                    />

                                    {isSubmitted && (
                                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                                        <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          Jawaban Uraian Anda Telah Dinilai (+{cq.pointCorrect ?? 10} Poin)
                                        </div>
                                        {cq.acceptedAnswers && cq.acceptedAnswers.length > 0 && (
                                          <div className="text-[11px] text-emerald-800">
                                            <strong>Kata Kunci Rujukan Guru:</strong> {cq.acceptedAnswers.join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* SOAL PILIHAN GANDA */
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    {(cq.options || []).map((opt, optIdx) => {
                                      const isChosen = selectedOption === optIdx;
                                      const isCorrect = selectedOption === cq.correctIndex;
                                      let optionStyle = 'border-slate-200 hover:bg-slate-50 text-slate-700';

                                      if (isChosen) {
                                        optionStyle = 'border-sky-500 bg-sky-50 text-sky-950 font-bold ring-1 ring-sky-400';
                                      }

                                      if (isSubmitted) {
                                        if (optIdx === cq.correctIndex) {
                                          optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500';
                                        } else if (isChosen && !isCorrect) {
                                          optionStyle = 'border-red-500 bg-red-50 text-red-950 font-bold ring-1 ring-red-400';
                                        }
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          type="button"
                                          disabled={isSubmitted}
                                          onClick={() => {
                                            setReadingAnswers(prev => ({
                                              ...prev,
                                              [cq.id]: optIdx,
                                            }));
                                          }}
                                          className={`p-2.5 rounded-xl border text-xs text-left transition flex items-center gap-2 ${optionStyle}`}
                                        >
                                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] flex-shrink-0">
                                            {String.fromCharCode(65 + optIdx)}
                                          </span>
                                          <span className="truncate">{opt}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {isSubmitted && cq.explanation && (
                                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                                    💡 <strong>Penjelasan:</strong> {cq.explanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Completion Action dengan Pengecekan Rundown Waktu */}
                    <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        {activeProgress.materialCompleted ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Anda telah menyelesaikan materi ini. Silakan lanjutkan ke latihan soal.
                          </span>
                        ) : !isReadingTimerFinished ? (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <Lock className="w-4 h-4" />
                            Tersisa waktu membaca {formatTime(readingTimerRemaining)}. Tombol akan aktif setelah waktu habis.
                          </span>
                        ) : (
                          'Waktu membaca selesai. Klik tombol di samping setelah menjawab cek pemahaman untuk membuka latihan soal.'
                        )}
                      </div>

                      {/* Tombol Selesai Membaca */}
                      {!isReadingTimerFinished && !activeProgress.materialCompleted ? (
                        <button
                          type="button"
                          disabled={true}
                          className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold transition flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300 shadow-2xs"
                          title={`Waktu membaca belum habis (${formatTime(readingTimerRemaining)} tersisa)`}
                        >
                          <Lock className="w-4 h-4 text-amber-600" />
                          <span>Tunggu Waktu Membaca ({formatTime(readingTimerRemaining)} tersisa)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCompleteMaterial}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
                        >
                          <span>{activeProgress.materialCompleted ? 'Materi Selesai (Lanjut Soal)' : 'Selesai Membaca & Buka Latihan'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* CONTENT STEP 2: LATIHAN SOAL */}
                {currentStep === 'quiz' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                            <HelpCircle className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm">{activeChapter.quiz.title}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          KKM Kelulusan Latihan: {activeChapter.quiz.passingScore} Poin • Batas Waktu: {activeChapter.quiz.timeLimitMinutes || 15} Menit
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Rundown Countdown Timer */}
                        {!quizSubmitted && !activeProgress.quizCompleted ? (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                            quizTimerRemaining <= 60
                              ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse ring-2 ring-rose-200'
                              : 'bg-amber-100/80 border-amber-300 text-amber-950'
                          }`}>
                            <Clock className={`w-4 h-4 ${quizTimerRemaining <= 60 ? 'text-rose-600 animate-bounce' : 'text-amber-800'}`} />
                            <span>Sisa Waktu: {formatTime(quizTimerRemaining)}</span>
                          </div>
                        ) : null}

                        {activeProgress.quizCompleted && (
                          <div className="text-right">
                            <span className="text-xs text-slate-400">Skor Tersimpan</span>
                            <div className="text-sm font-bold text-amber-900">{activeProgress.quizScore} Poin</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rundown Progress Bar */}
                    {!quizSubmitted && !activeProgress.quizCompleted && (
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            quizTimerRemaining <= 60 ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(0, Math.min(100, (quizTimerRemaining / totalQuizSeconds) * 100))}%` }}
                        />
                      </div>
                    )}

                    {/* Timeout Alert Banner */}
                    {isQuizTimeExpired && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-900 animate-in fade-in">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Batas Waktu Telah Habis!</span>
                          Waktu pengerjaan latihan soal telah mencapai batas maksimal ({activeChapter.quiz.timeLimitMinutes || 15} menit). Jawaban yang Anda kerjakan telah otomatis dikirim dan tersimpan.
                        </div>
                      </div>
                    )}

                    {/* Quiz Questions */}
                    <div className="space-y-4">
                      {activeChapter.quiz.questions.map((q, qIdx) => {
                        const selected = quizAnswers[q.id];

                        return (
                          <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                                {qIdx + 1}. {q.question}
                              </h4>
                              <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded-md text-slate-500 border border-slate-200">
                                {q.topic}
                              </span>
                            </div>

                            {/* Soal Bergambar */}
                            {q.imageUrl && (
                              <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs max-w-lg">
                                <img
                                  src={q.imageUrl}
                                  alt={q.imageCaption || `Ilustrasi Soal ${qIdx + 1}`}
                                  className="w-full max-h-64 object-contain bg-slate-50"
                                />
                                {q.imageCaption && (
                                  <p className="px-3 py-1.5 text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100 italic">
                                    {q.imageCaption}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="space-y-2">
                              {q.options.map((opt, oIdx) => {
                                const isChecked = selected === oIdx;
                                const isCorrect = oIdx === q.correctIndex;

                                let optStyle = 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 text-slate-800';
                                if (quizSubmitted) {
                                  if (isCorrect) {
                                    optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                                  } else if (isChecked) {
                                    optStyle = 'border-rose-500 bg-rose-50 text-rose-950 font-bold';
                                  } else {
                                    optStyle = 'border-slate-200 opacity-50';
                                  }
                                } else if (isChecked) {
                                  optStyle = 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs';
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    disabled={quizSubmitted}
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                    className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition ${optStyle}`}
                                  >
                                    <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                    {quizSubmitted && isCorrect && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Explanation shown after submit */}
                            {quizSubmitted && (
                              <div className="mt-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
                                <strong className="text-slate-800">Pembahasan:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                      {quizSubmitted ? (
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-emerald-800">
                            Latihan selesai! Nilai: {quizScore} Pts
                          </span>
                          <button
                            onClick={() => setCurrentStep('game')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                          >
                            <span>Lanjut ke Game Pembelajaran</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={Object.keys(quizAnswers).length < activeChapter.quiz.questions.length}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 ml-auto"
                        >
                          Kirim Jawaban Latihan
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* CONTENT STEP 3: GAME PEMBELAJARAN */}
                {currentStep === 'game' && (
                  <div className="space-y-4 animate-in fade-in">
                    <InteractiveGame
                      game={activeChapter.game}
                      previousBestScore={activeProgress.gameScore}
                      onComplete={handleGameCompleted}
                    />

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setCurrentStep('assessment')}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
                      >
                        <span>Lanjut ke Asesmen Akhir Bab</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* CONTENT STEP 4: ASESMEN AKHIR */}
                {currentStep === 'assessment' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
                            <Award className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm">{activeChapter.assessment.title}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Evaluasi Ketuntasan Bab • KKM: {activeChapter.assessment.passingScore} • Batas Waktu: {activeChapter.assessment.timeLimitMinutes || 20} Menit
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Rundown Countdown Timer */}
                        {!assessmentSubmitted && !activeProgress.assessmentCompleted ? (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                            assessmentTimerRemaining <= 60
                              ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse ring-2 ring-rose-200'
                              : 'bg-indigo-100/80 border-indigo-300 text-indigo-950'
                          }`}>
                            <Clock className={`w-4 h-4 ${assessmentTimerRemaining <= 60 ? 'text-rose-600 animate-bounce' : 'text-indigo-800'}`} />
                            <span>Sisa Waktu: {formatTime(assessmentTimerRemaining)}</span>
                          </div>
                        ) : null}

                        {activeProgress.assessmentCompleted && (
                          <div className="text-right">
                            <span className="text-xs text-slate-400">Status Kelulusan</span>
                            <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                              (activeProgress.assessmentScore || 0) >= activeChapter.assessment.passingScore 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {(activeProgress.assessmentScore || 0) >= activeChapter.assessment.passingScore ? 'LULUS BAB' : 'PERLU REMEDIAL'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rundown Progress Bar */}
                    {!assessmentSubmitted && !activeProgress.assessmentCompleted && (
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            assessmentTimerRemaining <= 60 ? 'bg-rose-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.max(0, Math.min(100, (assessmentTimerRemaining / totalAssessmentSeconds) * 100))}%` }}
                        />
                      </div>
                    )}

                    {/* Timeout Alert Banner */}
                    {isAssessmentTimeExpired && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-900 animate-in fade-in">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Batas Waktu Telah Habis!</span>
                          Waktu pengerjaan asesmen akhir telah mencapai batas maksimal ({activeChapter.assessment.timeLimitMinutes || 20} menit). Jawaban yang Anda kerjakan telah otomatis dikirim dan dinilai.
                        </div>
                      </div>
                    )}

                    {/* Questions */}
                    <div className="space-y-4">
                      {activeChapter.assessment.questions.map((q, qIdx) => {
                        const selected = assessmentAnswers[q.id];

                        return (
                          <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                              {qIdx + 1}. {q.question}
                            </h4>

                            {/* Soal Bergambar Asesmen */}
                            {q.imageUrl && (
                              <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs max-w-lg">
                                <img
                                  src={q.imageUrl}
                                  alt={q.imageCaption || `Ilustrasi Asesmen ${qIdx + 1}`}
                                  className="w-full max-h-64 object-contain bg-slate-50"
                                />
                                {q.imageCaption && (
                                  <p className="px-3 py-1.5 text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100 italic">
                                    {q.imageCaption}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="space-y-2">
                              {q.options.map((opt, oIdx) => {
                                const isChecked = selected === oIdx;
                                const isCorrect = oIdx === q.correctIndex;

                                let optStyle = 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-800';
                                if (assessmentSubmitted) {
                                  if (isCorrect) {
                                    optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                                  } else if (isChecked) {
                                    optStyle = 'border-rose-500 bg-rose-50 text-rose-950 font-bold';
                                  } else {
                                    optStyle = 'border-slate-200 opacity-50';
                                  }
                                } else if (isChecked) {
                                  optStyle = 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold shadow-xs';
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    disabled={assessmentSubmitted}
                                    onClick={() => setAssessmentAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                    className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition ${optStyle}`}
                                  >
                                    <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                    {assessmentSubmitted && isCorrect && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {assessmentSubmitted && (
                              <div className="mt-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
                                <strong className="text-slate-800">Pembahasan Evaluasi:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                      {assessmentSubmitted ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl w-full flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-xs text-emerald-950">Asesmen Berhasil Diselesaikan!</h4>
                            <p className="text-[11px] text-emerald-800">
                              Skor Anda: <strong>{assessmentScore}</strong>. Guru Anda telah menerima notifikasi laporan hasil asesmen ini.
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                            Tersimpan
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={handleSubmitAssessment}
                          disabled={Object.keys(assessmentAnswers).length < activeChapter.assessment.questions.length}
                          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 ml-auto"
                        >
                          Kirim Jawaban Asesmen Akhir
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* TAB 2: Personal Recommendations from Teacher */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Rekomendasi Personal dari Guru</h2>
              <p className="text-xs text-slate-500">
                Catatan perbaikan dan pengayaan khusus yang dirancang guru untuk membantu peningkatan prestasimu
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {studentRecs.length} Rekomendasi
            </span>
          </div>

          {studentRecs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Lightbulb className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <h4 className="text-sm font-bold text-slate-700">Belum Ada Rekomendasi Khusus</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Guru akan memberikan bimbingan personal setelah melihat hasil pengerjaan materi dan latihanmu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {studentRecs.map((rec) => (
                <div 
                  key={rec.id} 
                  className={`p-5 rounded-2xl border shadow-xs transition ${
                    rec.strengthWeaknessType === 'kelemahan'
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        rec.strengthWeaknessType === 'kelemahan'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {rec.strengthWeaknessType === 'kelemahan' ? 'Remedial / Penguatan Konsep' : 'Pengayaan Materi'}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Topik: {rec.topic}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Dari: <strong>{rec.teacherName}</strong> • {new Date(rec.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-slate-600">
                      <strong className="text-slate-800">Diagnosis Guru:</strong> {rec.reason}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-slate-200/60">
                      "{rec.recommendationText}"
                    </p>

                    {rec.suggestedAction && (
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                        <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span>Aksi Belajar: {rec.suggestedAction}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Class Discussion / Chat */}
      {activeTab === 'chat' && (
        <ClassChat
          currentClass={currentClass}
          currentUser={currentUser}
          teachers={teachers}
        />
      )}

      {/* Pop-up Notifikasi & Feedback Menarik */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Pop-up Jendela Membaca Materi di Halaman yang Sama (Tanpa Tab Baru) */}
      {activeChapter && (
        <ReadingMaterialModal
          isOpen={isReadingModalOpen}
          onClose={() => setIsReadingModalOpen(false)}
          chapter={activeChapter}
          readingTimerRemaining={readingTimerRemaining}
          totalReadingSeconds={totalReadingSeconds}
          isTimerFinished={isReadingTimerFinished}
          onSkipTimerForTesting={handleSkipTimerForTesting}
          isTeacherMode={isTeacherSimulation}
          initialTab={readingModalInitialTab}
        />
      )}
    </div>
  );
};
