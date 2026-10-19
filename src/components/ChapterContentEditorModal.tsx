import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  HelpCircle, 
  Gamepad2, 
  Award, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileUp, 
  Eye, 
  BookOpen, 
  ArrowRight, 
  Clock, 
  Layers, 
  Check, 
  Download,
  AlertCircle,
  Image as ImageIcon,
  Grid3X3,
  GraduationCap,
  Users
} from 'lucide-react';
import { 
  Chapter, 
  QuestionItem, 
  ReadingCheckQuestion, 
  UploadedFileInfo, 
  ChapterGame, 
  GamePair,
  WordScrambleItem,
  TrueFalseItem,
  SortCategoryItem,
  MaterialImage,
  CrosswordClue,
  CrosswordGameConfig,
  ImageMatchItem,
  ImageMatchConfig,
  ClassItem,
  UserSession
} from '../types';
import { parseUploadedDocument } from '../utils/documentParser';
import { FeedbackModal, FeedbackType } from './FeedbackModal';
import { TeacherGameSimulationModal } from './TeacherGameSimulationModal';

interface ChapterContentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter?: Chapter | null;
  classId: string;
  allClasses?: ClassItem[];
  currentUser?: UserSession;
  onSave: (chapter: Chapter) => Promise<void>;
  initialTab?: 'material' | 'reading_check' | 'quiz' | 'game' | 'assessment';
  onSimulateStudent?: (chapter: Chapter) => void;
}

export const ChapterContentEditorModal: React.FC<ChapterContentEditorModalProps> = ({
  isOpen,
  onClose,
  chapter,
  classId,
  allClasses = [],
  currentUser,
  onSave,
  initialTab = 'material',
  onSimulateStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'material' | 'reading_check' | 'quiz' | 'game' | 'assessment'>(initialTab);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([classId]);
  const [isGameSimulationOpen, setIsGameSimulationOpen] = useState<boolean>(false);

  // Feedback Modal State
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: FeedbackType;
    title: string;
    message: string;
    onConfirmAction?: () => void;
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
    onConfirmAction?: () => void
  ) => {
    setFeedback({
      isOpen: true,
      type,
      title,
      message,
      onConfirmAction,
    });
  };

  // Basic Info
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [chapterDescription, setChapterDescription] = useState<string>('');

  // Material Info
  const [materialTitle, setMaterialTitle] = useState<string>('');
  const [readingTime, setReadingTime] = useState<number>(10);
  const [materialContent, setMaterialContent] = useState<string>('');
  const [summaryPointsText, setSummaryPointsText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | undefined>(undefined);
  const [uploadSuccessBanner, setUploadSuccessBanner] = useState<string | null>(null);
  const [materialImages, setMaterialImages] = useState<MaterialImage[]>([]);

  // Reading Check Questions (Multiple Choice & Short Answer)
  const [checkQuestions, setCheckQuestions] = useState<ReadingCheckQuestion[]>([]);

  // Quiz / Latihan Soal
  const [quizTitle, setQuizTitle] = useState<string>('Latihan Pemahaman Materi');
  const [quizPassingScore, setQuizPassingScore] = useState<number>(70);
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(15);
  const [quizQuestions, setQuizQuestions] = useState<QuestionItem[]>([]);
  const [quizGenerateCount, setQuizGenerateCount] = useState<number>(5);

  // Game Edukasi with 7 varied types (including crossword and image_match)
  const [gamePrompt, setGamePrompt] = useState<string>('');
  const [gameTitle, setGameTitle] = useState<string>('Game Edukasi Bab');
  const [gameType, setGameType] = useState<'memory_match' | 'speed_trivia' | 'word_scramble' | 'true_false' | 'card_sort' | 'crossword' | 'image_match'>('memory_match');
  const [gameDescription, setGameDescription] = useState<string>('');
  const [gameInstructions, setGameInstructions] = useState<string>('');
  const [gameTargetScore, setGameTargetScore] = useState<number>(100);
  const [gameTimeLimit, setGameTimeLimit] = useState<number>(10);
  const [gamePairs, setGamePairs] = useState<GamePair[]>([]);
  const [gameTrivia, setGameTrivia] = useState<any[]>([]);
  const [gameScrambleWords, setGameScrambleWords] = useState<WordScrambleItem[]>([]);
  const [gameTrueFalse, setGameTrueFalse] = useState<TrueFalseItem[]>([]);
  const [gameSortCategories, setGameSortCategories] = useState<SortCategoryItem[]>([]);
  
  // Crossword (Teka-Teki Silang) Config State
  const [crosswordAcrossCount, setCrosswordAcrossCount] = useState<number>(3);
  const [crosswordDownCount, setCrosswordDownCount] = useState<number>(3);
  const [crosswordTotalPoints, setCrosswordTotalPoints] = useState<number>(100);
  const [crosswordClues, setCrosswordClues] = useState<CrosswordClue[]>([]);

  // Image Match (Menjodohkan Gambar dan Nama) Config State
  const [imageMatchItems, setImageMatchItems] = useState<ImageMatchItem[]>([]);
  const [imageMatchTargetScore, setImageMatchTargetScore] = useState<number>(100);

  // Assessment / Asesmen Akhir
  const [assessmentTitle, setAssessmentTitle] = useState<string>('Asesmen Akhir Bab');
  const [assessmentPassingScore, setAssessmentPassingScore] = useState<number>(75);
  const [assessmentTimeLimit, setAssessmentTimeLimit] = useState<number>(20);
  const [assessmentQuestions, setAssessmentQuestions] = useState<QuestionItem[]>([]);
  const [assessmentGenerateCount, setAssessmentGenerateCount] = useState<number>(5);

  // State loading indicators
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingCheck, setIsGeneratingCheck] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingGame, setIsGeneratingGame] = useState(false);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when chapter or modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (chapter) {
      if (Array.isArray(chapter.assignedClassIds) && chapter.assignedClassIds.length > 0) {
        setSelectedClassIds(chapter.assignedClassIds);
      } else if (chapter.classId) {
        setSelectedClassIds([chapter.classId]);
      } else {
        setSelectedClassIds([classId]);
      }

      setChapterNumber(chapter.chapterNumber || 1);
      setChapterTitle(chapter.title || '');
      setChapterDescription(chapter.description || '');

      setMaterialTitle(chapter.material?.title || chapter.title || '');
      setReadingTime(chapter.material?.readingTimeMinutes || 10);
      setMaterialContent(chapter.material?.content || '');
      setSummaryPointsText((chapter.material?.summaryPoints || []).join('\n'));
      setUploadedFile(chapter.material?.uploadedFile);
      setMaterialImages(
        chapter.material?.images || 
        chapter.material?.uploadedFile?.extractedImages || 
        []
      );

      setCheckQuestions(chapter.material?.checkQuestions || [
        {
          id: `check-${Date.now()}-1`,
          question: 'Apakah pemahaman inti materi yang dipelajari pada bab ini?',
          questionType: 'multiple_choice',
          options: [
            'Konsep dasar dan penerapan praktis materi',
            'Informasi di luar cakupan materi',
            'Pernyataan yang keliru',
            'Catatan tambahan tidak penting'
          ],
          correctIndex: 0,
          explanation: 'Terdapat pada pokok bahasan materi bab.',
          pointCorrect: 10,
          pointWrong: 0,
        }
      ]);

      setQuizTitle(chapter.quiz?.title || 'Latihan Pemahaman Materi');
      setQuizPassingScore(chapter.quiz?.passingScore || 70);
      setQuizTimeLimit(chapter.quiz?.timeLimitMinutes ?? 15);
      setQuizQuestions(chapter.quiz?.questions || []);

      setGamePrompt(chapter.game?.prompt || '');
      setGameTitle(chapter.game?.title || `Game Edukasi: ${chapter.title}`);
      setGameType((chapter.game?.type as any) || 'memory_match');
      setGameDescription(chapter.game?.description || '');
      setGameInstructions(chapter.game?.instructions || '');
      setGameTargetScore(chapter.game?.targetScore || 100);
      setGameTimeLimit(chapter.game?.timeLimitMinutes ?? 10);
      setGamePairs(chapter.game?.pairs || []);
      setGameTrivia(chapter.game?.triviaQuestions || []);
      setGameScrambleWords(chapter.game?.scrambleWords || []);
      setGameTrueFalse(chapter.game?.trueFalseItems || []);
      setGameSortCategories(chapter.game?.sortCategories || []);

      // Crossword init
      setCrosswordAcrossCount(chapter.game?.crosswordConfig?.acrossCount ?? 3);
      setCrosswordDownCount(chapter.game?.crosswordConfig?.downCount ?? 3);
      setCrosswordTotalPoints(chapter.game?.crosswordConfig?.totalPoints ?? 100);
      setCrosswordClues(chapter.game?.crosswordConfig?.clues || []);

      // Image match init
      setImageMatchItems(chapter.game?.imageMatchConfig?.items || []);
      setImageMatchTargetScore(chapter.game?.imageMatchConfig?.targetScore ?? 100);

      setAssessmentTitle(chapter.assessment?.title || 'Asesmen Akhir Bab');
      setAssessmentPassingScore(chapter.assessment?.passingScore || 75);
      setAssessmentTimeLimit(chapter.assessment?.timeLimitMinutes ?? 20);
      setAssessmentQuestions(chapter.assessment?.questions || []);
    } else {
      // New Chapter Defaults
      setSelectedClassIds([classId]);
      setChapterNumber(1);
      setChapterTitle('');
      setChapterDescription('');
      setMaterialTitle('');
      setReadingTime(10);
      setMaterialContent('');
      setSummaryPointsText('');
      setUploadedFile(undefined);
      setMaterialImages([]);
      setCheckQuestions([
        {
          id: `check-${Date.now()}-1`,
          question: 'Apakah ide pokok utama yang dipelajari pada materi ini?',
          questionType: 'multiple_choice',
          options: [
            'Konsep dasar dan prinsip utama materi',
            'Riwayat biografi pengarang',
            'Pernyataan yang keliru di luar materi',
            'Catatan tambahan tidak penting'
          ],
          correctIndex: 0,
          explanation: 'Dipaparkan pada bagian pembuka materi bacaan.',
          pointCorrect: 10,
          pointWrong: 0,
        }
      ]);
      setQuizTitle('Latihan Pemahaman Materi');
      setQuizPassingScore(70);
      setQuizTimeLimit(15);
      setQuizQuestions([]);
      setGamePrompt('');
      setGameTitle('Game Edukasi Bab');
      setGameType('memory_match');
      setGameDescription('');
      setGameInstructions('Selesaikan tantangan game untuk meraih poin tertinggi!');
      setGameTargetScore(100);
      setGameTimeLimit(10);
      setGamePairs([]);
      setGameTrivia([]);
      setGameScrambleWords([]);
      setGameTrueFalse([]);
      setGameSortCategories([]);

      setCrosswordAcrossCount(3);
      setCrosswordDownCount(3);
      setCrosswordTotalPoints(100);
      setCrosswordClues([]);

      setImageMatchItems([]);
      setImageMatchTargetScore(100);

      setAssessmentTitle('Asesmen Akhir Bab');
      setAssessmentPassingScore(75);
      setAssessmentTimeLimit(20);
      setAssessmentQuestions([]);
    }
    setUploadSuccessBanner(null);
  }, [isOpen, chapter]);

  // Synchronize active tab whenever modal opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle File Upload (Word / PDF)
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadSuccessBanner(null);
    try {
      const parsed = await parseUploadedDocument(file);
      const extractedImgs: MaterialImage[] = (parsed.extractedImages || []).map((img, i) => ({
        id: img.id || `img-${Date.now()}-${i}`,
        url: img.url,
        name: img.name || `Gambar ${i + 1}`,
        caption: img.caption || `Ilustrasi materi dari ${parsed.fileName}`,
      }));

      if (extractedImgs.length > 0) {
        setMaterialImages(extractedImgs);
      }

      setUploadedFile({
        fileName: parsed.fileName,
        fileType: parsed.fileType,
        fileSize: parsed.fileSize,
        extractedText: parsed.extractedText,
        fileDataUrl: parsed.fileDataUrl,
        extractedImages: extractedImgs,
      });

      // Deduse title if empty or default
      if (!materialTitle || materialTitle.startsWith('Bab')) {
        const cleanName = parsed.fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setMaterialTitle(cleanName);
      }
      if (!chapterTitle) {
        const cleanName = parsed.fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setChapterTitle(cleanName);
      }

      // Automatically fill Konten Teks Bacaan Materi with extracted document text!
      if (parsed.extractedText && parsed.extractedText.trim().length > 0) {
        setMaterialContent(parsed.extractedText);
        setUploadSuccessBanner(
          `Dokumen "${parsed.fileName}" berhasil diunggah! ${parsed.extractedText.length} karakter teks${extractedImgs.length > 0 ? ` & ${extractedImgs.length} gambar materi` : ''} otomatis diekstrak untuk materi bacaan, soal latihan, dan game edukasi.`
        );
      } else {
        setUploadSuccessBanner(`Dokumen "${parsed.fileName}" berhasil diunggah.`);
      }
    } catch (err) {
      console.error('Failed to parse file:', err);
      showFeedback('error', 'Gagal Membaca File', 'Pastikan file berupa dokumen Word (.docx) atau PDF (.pdf) yang valid dan tidak terenkripsi.');
    } finally {
      setIsUploading(false);
    }
  };

  // AI 1: Generate Cek Bacaan Otomatis dari Materi
  const handleGenerateReadingCheck = async () => {
    const textToAnalyze = materialContent || uploadedFile?.extractedText;
    if (!textToAnalyze || !textToAnalyze.trim()) {
      showFeedback('warning', 'Materi Bacaan Belum Diisi', 'Unggah file Word/PDF atau tuliskan teks materi bacaan terlebih dahulu agar pertanyaan cek pemahaman dapat dianalisis.');
      return;
    }

    setIsGeneratingCheck(true);
    try {
      const res = await fetch('/api/ai/generate-reading-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialTitle: materialTitle || chapterTitle || 'Materi Bab',
          materialContent: textToAnalyze,
        }),
      });
      const data = await res.json();
      if (data.checkQuestions && Array.isArray(data.checkQuestions) && data.checkQuestions.length > 0) {
        setCheckQuestions(data.checkQuestions);
        showFeedback('success', 'Pertanyaan Cek Bacaan Siap!', `Berhasil membuat ${data.checkQuestions.length} butir pertanyaan cek pemahaman dari teks materi bacaan.`);
      } else {
        showFeedback('error', 'Gagal Menyusun Pertanyaan', 'Gagal membuat pertanyaan cek bacaan. Silakan coba kembali.');
      }
    } catch (err) {
      console.error('Error generating reading check:', err);
      showFeedback('error', 'Terjadi Gangguan', 'Terjadi kesalahan sistem saat membuat pertanyaan cek bacaan.');
    } finally {
      setIsGeneratingCheck(false);
    }
  };

  // AI 2: Generate Latihan Soal dari Materi yang Diupload
  const handleGenerateQuiz = async () => {
    const textToAnalyze = materialContent || uploadedFile?.extractedText;
    if (!textToAnalyze || !textToAnalyze.trim()) {
      showFeedback('warning', 'Materi Bacaan Kosong', 'Unggah file Word/PDF atau isi konten materi bacaan terlebih dahulu agar latihan soal dapat disusun berdasar teks materi.');
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const res = await fetch('/api/ai/generate-latihan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialTitle: materialTitle || chapterTitle || 'Materi Bab',
          materialContent: textToAnalyze,
          count: quizGenerateCount,
          materialImages: materialImages,
        }),
      });
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        const imgQuestionsCount = data.questions.filter((q: any) => q.imageUrl).length;
        showFeedback(
          'success', 
          'Latihan Soal Berhasil Dihasilkan!', 
          `Berhasil menyusun ${data.questions.length} butir soal latihan dari materi${imgQuestionsCount > 0 ? ` (${imgQuestionsCount} soal dilengkapi gambar visual)` : ''}!`
        );
      } else {
        showFeedback('error', 'Gagal Menyusun Soal', 'Gagal menghasilkan latihan soal. Silakan periksa kelengkapan isi materi dan coba kembali.');
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      showFeedback('error', 'Terjadi Kesalahan', 'Terjadi kendala jaringan atau sistem saat generate latihan soal.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // AI 3: Generate Game Edukasi Sesuai Prompt Guru & Tipe Game
  const handleGenerateGame = async () => {
    if (!gamePrompt.trim()) {
      showFeedback('warning', 'Prompt Perintah Diperlukan', 'Masukkan instruksi atau tema game edukasi terlebih dahulu.');
      return;
    }

    setIsGeneratingGame(true);
    try {
      const res = await fetch('/api/ai/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: gamePrompt,
          materialTitle: materialTitle || chapterTitle || 'Materi Bab',
          materialContent: materialContent || uploadedFile?.extractedText || '',
          gameType: gameType,
          acrossCount: crosswordAcrossCount,
          downCount: crosswordDownCount,
          totalPoints: crosswordTotalPoints,
          materialImages: materialImages,
        }),
      });
      const data = await res.json();
      if (data.game) {
        setGameTitle(data.game.title);
        setGameType(data.game.type || gameType);
        setGameDescription(data.game.description);
        setGameInstructions(data.game.instructions);
        setGameTargetScore(data.game.targetScore || 100);
        if (data.game.pairs) setGamePairs(data.game.pairs);
        if (data.game.triviaQuestions) setGameTrivia(data.game.triviaQuestions);
        if (data.game.scrambleWords) setGameScrambleWords(data.game.scrambleWords);
        if (data.game.trueFalseItems) setGameTrueFalse(data.game.trueFalseItems);
        if (data.game.sortCategories) setGameSortCategories(data.game.sortCategories);
        if (data.game.crosswordConfig) {
          setCrosswordClues(data.game.crosswordConfig.clues || []);
          setCrosswordAcrossCount(data.game.crosswordConfig.acrossCount || crosswordAcrossCount);
          setCrosswordDownCount(data.game.crosswordConfig.downCount || crosswordDownCount);
          setCrosswordTotalPoints(data.game.crosswordConfig.totalPoints || crosswordTotalPoints);
        }
        if (data.game.imageMatchConfig) {
          setImageMatchItems(data.game.imageMatchConfig.items || []);
          setImageMatchTargetScore(data.game.imageMatchConfig.targetScore || imageMatchTargetScore);
        }
        showFeedback('success', 'Game Edukasi Berhasil Dibuat!', `Game "${data.game.title}" tipe ${data.game.type} siap dimainkan oleh siswa.`);
      } else {
        showFeedback('error', 'Gagal Membuat Game', 'Gagal membuat game edukasi. Silakan ulangi dengan instruksi yang lebih jelas.');
      }
    } catch (err) {
      console.error('Error generating game:', err);
      showFeedback('error', 'Terjadi Kesalahan', 'Terjadi gangguan sistem saat membuat game edukasi.');
    } finally {
      setIsGeneratingGame(false);
    }
  };

  // AI 4: Generate Asesmen Akhir dari Materi yang Diupload
  const handleGenerateAssessment = async () => {
    const textToAnalyze = materialContent || uploadedFile?.extractedText;
    if (!textToAnalyze || !textToAnalyze.trim()) {
      showFeedback('warning', 'Materi Bacaan Kosong', 'Unggah file Word/PDF atau isi teks materi bacaan terlebih dahulu agar asesmen akhir dapat disusun.');
      return;
    }

    setIsGeneratingAssessment(true);
    try {
      const res = await fetch('/api/ai/generate-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialTitle: materialTitle || chapterTitle || 'Materi Bab',
          materialContent: textToAnalyze,
          count: assessmentGenerateCount,
          materialImages: materialImages,
        }),
      });
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setAssessmentQuestions(data.questions);
        const imgQuestionsCount = data.questions.filter((q: any) => q.imageUrl).length;
        showFeedback(
          'success', 
          'Asesmen Akhir Berhasil Disusun!', 
          `Berhasil menyusun ${data.questions.length} butir soal asesmen evaluasi HOTS dari materi${imgQuestionsCount > 0 ? ` (${imgQuestionsCount} butir dilengkapi ilustrasi gambar)` : ''}!`
        );
      } else {
        showFeedback('error', 'Gagal Menyusun Asesmen', 'Gagal menyusun butir asesmen akhir. Silakan coba kembali.');
      }
    } catch (err) {
      console.error('Error generating assessment:', err);
      showFeedback('error', 'Terjadi Kesalahan', 'Terjadi gangguan saat menyusun butir asesmen akhir.');
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  // Build complete Chapter object from current inputs
  const buildChapterObject = (): Chapter => {
    const summaryPoints = summaryPointsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const effectiveClassIds = selectedClassIds.length > 0 ? selectedClassIds : [classId];

    return {
      id: chapter?.id || `chapter-${Date.now()}`,
      classId: effectiveClassIds[0] || classId,
      assignedClassIds: effectiveClassIds,
      teacherId: chapter?.teacherId || currentUser?.id || 'teacher-1',
      teacherName: chapter?.teacherName || currentUser?.name || 'Guru Pengajar',
      chapterNumber: Number(chapterNumber) || 1,
      title: chapterTitle.trim() || 'Bab Pembelajaran Baru',
      description: chapterDescription.trim(),
      order: Number(chapterNumber) || 1,
      material: {
        id: chapter?.material?.id || `mat-${Date.now()}`,
        title: materialTitle.trim() || chapterTitle.trim() || 'Materi Bab',
        readingTimeMinutes: Number(readingTime) || 10,
        content: materialContent || 'Materi pembelajaran madrasah.',
        summaryPoints: summaryPoints.length > 0 ? summaryPoints : ['Materi pembelajaran resmi MTsN 3 Banyuwangi'],
        uploadedFile: uploadedFile || undefined,
        images: materialImages.length > 0 ? materialImages : undefined,
        checkQuestions: checkQuestions.length > 0 ? checkQuestions : [
          {
            id: `check-${Date.now()}-1`,
            question: `Apakah konsep utama dari materi ${chapterTitle || 'ini'}?`,
            questionType: 'multiple_choice',
            options: ['Penguasaan konsep dan penerapannya', 'Hafalan tanpa makna', 'Informasi keliru', 'Tidak relevan'],
            correctIndex: 0,
            explanation: 'Mencerminkan kompetensi dasar materi.',
            pointCorrect: 10,
            pointWrong: 0,
          }
        ],
      },
      quiz: {
        id: chapter?.quiz?.id || `quiz-${Date.now()}`,
        title: quizTitle.trim() || 'Latihan Pemahaman Materi',
        passingScore: Number(quizPassingScore) || 70,
        timeLimitMinutes: Math.max(1, Number(quizTimeLimit) || 15),
        questions: quizQuestions.length > 0 ? quizQuestions : [
          {
            id: `q-default-1`,
            question: `Apakah pemahaman utama dari bab "${chapterTitle || 'ini'}"?`,
            options: ['Penguasaan konsep dan penerapan praktis', 'Hafalan tanpa praktik', 'Informasi di luar materi', 'Tidak relevan'],
            correctIndex: 0,
            explanation: 'Jawaban A mencerminkan tujuan kompetensi.',
            topic: chapterTitle || 'Umum',
            points: 20,
          }
        ],
      },
      game: {
        id: chapter?.game?.id || `game-${Date.now()}`,
        title: gameTitle.trim() || `Game Edukasi ${chapterTitle || 'Bab'}`,
        type: gameType,
        prompt: gamePrompt.trim(),
        description: gameDescription.trim() || `Game pembelajaran interaktif untuk ${chapterTitle}`,
        instructions: gameInstructions.trim() || 'Selesaikan tantangan game untuk meraih poin tertinggi!',
        targetScore: Number(gameTargetScore) || 100,
        timeLimitMinutes: Math.max(1, Number(gameTimeLimit) || 10),
        pairs: gamePairs.length > 0 ? gamePairs : [
          { id: 'p-1', term: 'Konsep Dasar', definition: 'Pengertian konsep dasar materi ini', topic: chapterTitle || 'Umum' },
          { id: 'p-2', term: 'Penerapan Praktis', definition: 'Implementasi dalam kehidupan sehari-hari', topic: chapterTitle || 'Umum' },
          { id: 'p-3', term: 'Karakter Madrasah', definition: 'Nilai moral dan adab berilmu', topic: chapterTitle || 'Umum' },
          { id: 'p-4', term: 'Evaluasi Tuntas', definition: 'Tolak ukur pencapaian kompetensi siswa', topic: chapterTitle || 'Umum' },
        ],
        triviaQuestions: gameTrivia,
        scrambleWords: gameScrambleWords,
        trueFalseItems: gameTrueFalse,
        sortCategories: gameSortCategories,
        crosswordConfig: gameType === 'crossword' ? {
          acrossCount: crosswordAcrossCount,
          downCount: crosswordDownCount,
          totalPoints: crosswordTotalPoints,
          clues: crosswordClues,
        } : undefined,
        imageMatchConfig: gameType === 'image_match' ? {
          items: imageMatchItems,
          targetScore: imageMatchTargetScore,
        } : undefined,
      },
      assessment: {
        id: chapter?.assessment?.id || `assess-${Date.now()}`,
        title: assessmentTitle.trim() || 'Asesmen Akhir Bab',
        passingScore: Number(assessmentPassingScore) || 75,
        timeLimitMinutes: Math.max(1, Number(assessmentTimeLimit) || 20),
        questions: assessmentQuestions.length > 0 ? assessmentQuestions : [
          {
            id: `a-default-1`,
            question: `Evaluasi komprehensif: Bagaimana keterkaitan konsep dalam ${chapterTitle || 'bab ini'}?`,
            options: ['Membangun pemahaman menyeluruh dan nalar kritis', 'Terpisah tanpa hubungan', 'Hanya formalitas', 'Mengabaikan evaluasi'],
            correctIndex: 0,
            explanation: 'Asesmen menguji kemampuan berpikir kritis siswa.',
            topic: 'Evaluasi Komprehensif',
            points: 20,
          }
        ],
      },
    };
  };

  // Save full Chapter
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim()) {
      showFeedback('warning', 'Judul Bab Wajib Diisi', 'Silakan masukkan judul bab sebelum menyimpan.');
      return;
    }
    if (selectedClassIds.length === 0) {
      showFeedback('warning', 'Pilih Kelas Akses', 'Silakan pilih minimal 1 kelas yang dapat membaca dan mengakses bab pembelajaran ini.');
      return;
    }

    setIsSaving(true);
    try {
      const finalChapter = buildChapterObject();
      await onSave(finalChapter);
      onClose();
    } catch (err) {
      console.error('Error saving chapter:', err);
      showFeedback('error', 'Gagal Menyimpan Bab', 'Terjadi kendala saat menyimpan seluruh data bab pembelajaran. Silakan periksa kembali isian form.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateGameFromEditor = () => {
    setIsGameSimulationOpen(true);
  };

  const handleSimulateStudentFromEditor = () => {
    if (!chapterTitle.trim()) {
      showFeedback('warning', 'Judul Bab Belum Diisi', 'Silakan masukkan judul bab sebelum melakukan uji coba tampilan siswa.');
      return;
    }
    const currentBuilt = buildChapterObject();
    if (onSimulateStudent) {
      onSimulateStudent(currentBuilt);
    } else {
      showFeedback('info', 'Uji Coba Tampilan Siswa', 'Simpan bab ini terlebih dahulu untuk melihat tampilan lengkap siswa di dashboard.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {chapter ? `Edit Bab ${chapter.chapterNumber}: ${chapter.title}` : 'Buat Bab Pembelajaran Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                Upload materi (Word/PDF), atur cek pemahaman bacaan & poin, generate latihan, game & asesmen otomatis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2 gap-1 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('material')}
            className={`px-3 py-2.5 rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'material'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            1. Materi & Upload Word/PDF
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reading_check')}
            className={`px-3 py-2.5 rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reading_check'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            2. Cek Pemahaman Bacaan & Poin
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
              {checkQuestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-2.5 rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            3. Latihan Soal Otomatis
            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
              {quizQuestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('game')}
            className={`px-3 py-2.5 rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'game'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            4. Game Edukasi (Prompt AI)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className={`px-3 py-2.5 rounded-t-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'assessment'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4" />
            5. Asesmen Akhir Otomatis
            <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">
              {assessmentQuestions.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: MATERI & UPLOAD WORD / PDF */}
          {activeTab === 'material' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Bab</label>
                  <input
                    type="number"
                    min={1}
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Bab Pembelajaran</label>
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="Contoh: Klasifikasi Makhluk Hidup & Keanekaragaman Hayati"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat / Tujuan Pembelajaran</label>
                <input
                  type="text"
                  value={chapterDescription}
                  onChange={(e) => setChapterDescription(e.target.value)}
                  placeholder="Keterangan capaian kompetensi dasar siswa..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* TARGET KELAS YANG MEMILIKI HAK AKSES */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>Target Kelas yang Memiliki Hak Akses Materi & Bab Ini</span>
                    </label>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      Pilih kelas yang diizinkan untuk membaca materi ini. Kelas yang belum ditambahkan tidak akan dapat membaca atau mengakses materi ini di akun siswa mereka.
                    </p>
                  </div>
                  {allClasses && allClasses.length > 1 && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedClassIds(allClasses.map(c => c.id))}
                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline"
                      >
                        Pilih Semua Kelas
                      </button>
                      <span className="text-indigo-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedClassIds([classId])}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline"
                      >
                        Hanya Kelas Ini
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {(allClasses && allClasses.length > 0 ? allClasses : [{ id: classId, name: 'Kelas Saat Ini', code: 'AKTIF' }]).map((cls) => {
                    const isChecked = selectedClassIds.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                          isChecked 
                            ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs' 
                            : 'border-indigo-100 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClassIds(prev => [...prev, cls.id]);
                            } else {
                              if (selectedClassIds.length <= 1) {
                                showFeedback('warning', 'Minimal 1 Kelas', 'Materi ini harus ditugaskan ke minimal 1 kelas agar dapat dibaca oleh siswa.');
                                return;
                              }
                              setSelectedClassIds(prev => prev.filter(id => id !== cls.id));
                            }
                          }}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isChecked ? 'text-indigo-950' : 'text-slate-700'}`}>
                            {cls.name}
                          </p>
                          <p className="text-[11px] text-slate-500">{cls.grade || cls.subject}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {selectedClassIds.length === 0 && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Pilih minimal 1 kelas agar materi ini dapat diakses oleh siswa.
                  </p>
                )}
              </div>

              {/* UPLOAD FILE WORD / PDF BOX */}
              <div className="p-4 bg-emerald-50/50 border-2 border-dashed border-emerald-300 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                      <FileUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Upload File Materi (Word / PDF)</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Dukung format Microsoft Word (.docx, .doc) dan Adobe PDF (.pdf). File akan tampil di dashboard siswa dan teksnya otomatis diekstrak untuk generate soal & game.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Mengekstrak Dokumen...' : 'Pilih File Word / PDF'}
                    </button>
                  </div>
                </div>

                {/* Uploaded File Badge Preview */}
                {/* Uploaded File Badge Preview & Success Banner */}
                {uploadSuccessBanner && (
                  <div className="mt-3 p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{uploadSuccessBanner}</span>
                  </div>
                )}

                {/* Uploaded File Badge Preview & Controls */}
                {uploadedFile ? (
                  <div className="mt-3 p-3.5 bg-white rounded-xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        uploadedFile.fileType === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {uploadedFile.fileType}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{uploadedFile.fileName}</p>
                        <p className="text-[10px] text-slate-500">
                          {(uploadedFile.fileSize / 1024).toFixed(1)} KB • Teks berhasil diekstrak ke formulir materi di bawah
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {uploadedFile.fileDataUrl && (
                        <a
                          href={uploadedFile.fileDataUrl}
                          download={uploadedFile.fileName}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 transition"
                          title="Unduh File Materi"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                        title="Unggah ulang dokumen untuk memperbarui materi"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Upload Ulang File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(undefined);
                          setUploadSuccessBanner(null);
                        }}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                        title="Hapus file dokumen lampiran dari bab ini"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus Lampiran</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-2.5 bg-white/70 rounded-xl border border-dashed border-emerald-200 text-center text-xs text-slate-500">
                    Belum ada file lampiran Word/PDF. Guru dapat mengunggah file di atas atau menuliskan materi secara langsung pada formulir di bawah.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Dokumen / Modul Bacaan</label>
                  <input
                    type="text"
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="Contoh: Modul Bacaan Bab 1: Dasar Klasifikasi"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Waktu Baca (Menit)</label>
                  <input
                    type="number"
                    min={1}
                    value={readingTime}
                    onChange={(e) => setReadingTime(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700">Konten Teks Bacaan Materi</label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {materialContent.length} Karakter • ±{materialContent.trim().split(/\s+/).filter(Boolean).length} Kata
                    </span>
                  </div>
                  {materialContent.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMaterialContent('')}
                      className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Kosongkan Teks</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={7}
                  value={materialContent}
                  onChange={(e) => setMaterialContent(e.target.value)}
                  placeholder="Tuliskan uraian materi lengkap, atau otomatis terisi saat mengunggah file Word / PDF di atas..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Poin-Poin Rangkuman (1 per baris)</label>
                <textarea
                  rows={3}
                  value={summaryPointsText}
                  onChange={(e) => setSummaryPointsText(e.target.value)}
                  placeholder="Rangkuman 1&#10;Rangkuman 2&#10;Rangkuman 3"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* GAMBAR-GAMBAR DALAM MATERI (DARI DOKUMEN / UPLOAD MANUAL) */}
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-700" />
                      Galeri Gambar Materi Bacaan ({materialImages.length} Gambar)
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Gambar yang diekstrak dari dokumen Word/PDF atau diunggah guru. Otomatis dipakai saat generate soal latihan bergambar dan game menjodohkan gambar!
                    </p>
                  </div>
                  <label className="cursor-pointer px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs shrink-0">
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Gambar Materi</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const dataUrl = reader.result as string;
                            setMaterialImages([
                              ...materialImages,
                              {
                                id: `img-${Date.now()}-${materialImages.length + 1}`,
                                url: dataUrl,
                                name: file.name.replace(/\.[^/.]+$/, ''),
                                caption: `Ilustrasi ${file.name.replace(/\.[^/.]+$/, '')}`,
                              }
                            ]);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {materialImages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {materialImages.map((img, idx) => (
                      <div key={img.id || idx} className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                        <div className="relative h-28 w-full bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                          <img
                            src={img.url}
                            alt={img.name || `Gambar ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setMaterialImages(materialImages.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 p-1 bg-white/90 hover:bg-rose-600 hover:text-white text-slate-600 rounded-md shadow-xs transition"
                            title="Hapus Gambar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nama Istilah / Konsep</label>
                          <input
                            type="text"
                            value={img.name || ''}
                            onChange={(e) => {
                              const updated = [...materialImages];
                              updated[idx].name = e.target.value;
                              setMaterialImages(updated);
                            }}
                            placeholder="Contoh: Kloroplas / Jantung"
                            className="w-full p-1.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-800 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Keterangan Gambar</label>
                          <input
                            type="text"
                            value={img.caption || ''}
                            onChange={(e) => {
                              const updated = [...materialImages];
                              updated[idx].caption = e.target.value;
                              setMaterialImages(updated);
                            }}
                            placeholder="Keterangan gambar..."
                            className="w-full p-1.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white/80 rounded-xl border border-dashed border-emerald-200 text-center text-xs text-emerald-800">
                    Belum ada gambar dalam materi ini. Anda dapat mengunggah file Word yang berisi gambar atau klik tombol <strong>"+ Tambah Gambar Materi"</strong> di atas.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CEK PEMAHAMAN BACAAN & POIN BENAR / SALAH (PILIHAN GANDA & ISIAN SINGKAT) */}
          {activeTab === 'reading_check' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Cek Bahwa Siswa Sudah Membaca Materi (Pilihan Ganda & Isian Singkat)
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Guru dapat menambahkan pertanyaan pilihan ganda maupun isian singkat untuk memastikan pemahaman bacaan siswa. Lengkap dengan reward poin benar dan poin salah.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateReadingCheck}
                  disabled={isGeneratingCheck}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {isGeneratingCheck ? 'Menganalisis Materi...' : 'Generate Otomatis dari Materi'}
                </button>
              </div>

              {/* Action Buttons for Adding Questions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCheckQuestions([
                      ...checkQuestions,
                      {
                        id: `check-${Date.now()}-${checkQuestions.length + 1}`,
                        question: '',
                        questionType: 'multiple_choice',
                        options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                        correctIndex: 0,
                        pointCorrect: 10,
                        pointWrong: 0,
                      }
                    ]);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  + Tambah Soal Pilihan Ganda
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckQuestions([
                      ...checkQuestions,
                      {
                        id: `check-${Date.now()}-${checkQuestions.length + 1}`,
                        question: '',
                        questionType: 'short_answer',
                        options: [],
                        acceptedAnswers: [''],
                        pointCorrect: 10,
                        pointWrong: 0,
                      }
                    ]);
                  }}
                  className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  + Tambah Soal Isian Singkat
                </button>
              </div>

              <div className="space-y-3">
                {checkQuestions.map((cq, qIndex) => {
                  const isShortAnswer = cq.questionType === 'short_answer';

                  return (
                    <div key={cq.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            Pertanyaan #{qIndex + 1}
                          </span>
                          {/* Type toggle pill */}
                          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...checkQuestions];
                                updated[qIndex].questionType = 'multiple_choice';
                                if (!updated[qIndex].options || updated[qIndex].options.length === 0) {
                                  updated[qIndex].options = ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'];
                                  updated[qIndex].correctIndex = 0;
                                }
                                setCheckQuestions(updated);
                              }}
                              className={`px-2 py-0.5 transition ${
                                !isShortAnswer ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Pilihan Ganda
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...checkQuestions];
                                updated[qIndex].questionType = 'short_answer';
                                if (!updated[qIndex].acceptedAnswers) {
                                  updated[qIndex].acceptedAnswers = [''];
                                }
                                setCheckQuestions(updated);
                              }}
                              className={`px-2 py-0.5 transition ${
                                isShortAnswer ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Isian Singkat
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCheckQuestions(checkQuestions.filter((_, idx) => idx !== qIndex))}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Hapus Pertanyaan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={cq.question}
                        onChange={(e) => {
                          const updated = [...checkQuestions];
                          updated[qIndex].question = e.target.value;
                          setCheckQuestions(updated);
                        }}
                        placeholder={
                          isShortAnswer
                            ? "Contoh: Sebutkan organel sel yang berfungsi sebagai tempat berlangsungnya fotosintesis..."
                            : "Contoh: Apakah fungsi utama dari klorofil dalam proses fotosintesis?"
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />

                      {/* Multiple Choice Options */}
                      {!isShortAnswer && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(cq.options && cq.options.length > 0 ? cq.options : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D']).map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-slate-50/50">
                              <input
                                type="radio"
                                name={`correct-${cq.id}`}
                                checked={cq.correctIndex === optIndex}
                                onChange={() => {
                                  const updated = [...checkQuestions];
                                  updated[qIndex].correctIndex = optIndex;
                                  setCheckQuestions(updated);
                                }}
                                className="text-emerald-600 focus:ring-emerald-500 ml-2"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...checkQuestions];
                                  const opts = [...(updated[qIndex].options || [])];
                                  opts[optIndex] = e.target.value;
                                  updated[qIndex].options = opts;
                                  setCheckQuestions(updated);
                                }}
                                placeholder={`Pilihan ${String.fromCharCode(65 + optIndex)}`}
                                className="w-full p-1.5 text-xs text-slate-800 bg-transparent focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Short Answer Key */}
                      {isShortAnswer && (
                        <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200 space-y-1.5">
                          <label className="block text-[11px] font-bold text-sky-900">
                            Kunci Jawaban Singkat yang Diterima (Pisahkan dengan koma jika ada beberapa ejaan/sinonim):
                          </label>
                          <input
                            type="text"
                            value={(cq.acceptedAnswers || []).join(', ')}
                            onChange={(e) => {
                              const updated = [...checkQuestions];
                              updated[qIndex].acceptedAnswers = e.target.value.split(',').map(s => s.trim());
                              setCheckQuestions(updated);
                            }}
                            placeholder="Contoh: Kloroplas, Plastida kloroplas, Chloroplast"
                            className="w-full p-2 rounded-lg border border-sky-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                          />
                          <p className="text-[10px] text-sky-700">
                            * Siswa akan mengetik langsung jawabannya di dashboard saat membaca materi. Pengecekan tidak sensitif huruf besar/kecil.
                          </p>
                        </div>
                      )}

                      {/* Points setup: Benar vs Salah & Penjelasan */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
                        <div>
                          <label className="block text-[11px] font-bold text-emerald-800 mb-0.5">
                            Poin Jika Jawab Benar (+)
                          </label>
                          <input
                            type="number"
                            value={cq.pointCorrect ?? 10}
                            onChange={(e) => {
                              const updated = [...checkQuestions];
                              updated[qIndex].pointCorrect = Number(e.target.value);
                              setCheckQuestions(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-emerald-300 bg-emerald-50/50 text-xs font-bold text-emerald-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-red-800 mb-0.5">
                            Poin Jika Jawab Salah (-)
                          </label>
                          <input
                            type="number"
                            value={cq.pointWrong ?? 0}
                            onChange={(e) => {
                              const updated = [...checkQuestions];
                              updated[qIndex].pointWrong = Number(e.target.value);
                              setCheckQuestions(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-red-300 bg-red-50/50 text-xs font-bold text-red-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                            Penjelasan / Petunjuk
                          </label>
                          <input
                            type="text"
                            value={cq.explanation || ''}
                            onChange={(e) => {
                              const updated = [...checkQuestions];
                              updated[qIndex].explanation = e.target.value;
                              setCheckQuestions(updated);
                            }}
                            placeholder="Dikutip dari paragraf 2 materi..."
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {checkQuestions.length === 0 && (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                    Belum ada pertanyaan cek pemahaman bacaan. Silakan klik tombol "Generate Otomatis dari Materi" atau tambah pertanyaan di atas.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LATIHAN SOAL (OTOMATIS DIAMBIL DARI MATERI & TAMBAH MANUAL) */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Latihan Soal Otomatis Diambil dari Materi
                  </h4>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Sistem menganalisis teks materi/dokumen yang diupload dan menyusun soal latihan lengkap dengan kunci jawaban dan pembahasan.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-bold text-blue-950">Jumlah Soal:</span>
                    <select
                      value={quizGenerateCount}
                      onChange={(e) => setQuizGenerateCount(Number(e.target.value))}
                      className="p-1.5 rounded-lg border border-blue-300 bg-white font-bold text-blue-900 text-xs"
                    >
                      <option value={3}>3 Soal</option>
                      <option value={5}>5 Soal</option>
                      <option value={10}>10 Soal</option>
                      <option value={15}>15 Soal</option>
                      <option value={20}>20 Soal</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateQuiz}
                    disabled={isGeneratingQuiz}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    {isGeneratingQuiz ? `Menyusun ${quizGenerateCount} Soal...` : `Generate ${quizGenerateCount} Soal dari Materi`}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Latihan Soal</label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">KKM / Nilai Kelulusan</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={quizPassingScore}
                    onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Batasan Waktu Pengerjaan (Menit)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2.5 rounded-xl border border-blue-300 bg-blue-50/40 text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Hitung mundur aktif. Jawaban otomatis dikirim jika waktu habis.
                  </span>
                </div>
              </div>

              {/* Action: Add Question Manually */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">
                  Daftar Soal Latihan ({quizQuestions.length} Butir Soal):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setQuizQuestions([
                      ...quizQuestions,
                      {
                        id: `soal-custom-${Date.now()}-${quizQuestions.length + 1}`,
                        question: '',
                        options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                        correctIndex: 0,
                        explanation: '',
                        topic: chapterTitle || 'Materi Bab',
                        points: 20,
                      }
                    ]);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  + Tambah Soal Latihan Manual
                </button>
              </div>

              {/* Quiz Questions List */}
              <div className="space-y-3">
                {quizQuestions.map((q, qIndex) => (
                  <div key={q.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Soal Latihan #{qIndex + 1}</span>
                      <button
                        type="button"
                        onClick={() => setQuizQuestions(quizQuestions.filter((_, idx) => idx !== qIndex))}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Hapus Soal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...quizQuestions];
                        updated[qIndex].question = e.target.value;
                        setQuizQuestions(updated);
                      }}
                      placeholder="Tuliskan butir soal latihan..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />

                    {/* Gambar Soal (Jika ada dari materi atau diunggah guru) */}
                    {q.imageUrl ? (
                      <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                            Ilustrasi Gambar Soal #{qIndex + 1} (Dari Materi yang Diupload)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...quizQuestions];
                              updated[qIndex].imageUrl = undefined;
                              updated[qIndex].imageCaption = undefined;
                              setQuizQuestions(updated);
                            }}
                            className="text-[10px] text-rose-600 hover:underline font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus Gambar
                          </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                          <img
                            src={q.imageUrl}
                            alt={q.imageCaption || 'Gambar soal'}
                            className="w-32 h-24 object-contain rounded-lg border border-blue-200 bg-white"
                          />
                          <div className="flex-1 w-full space-y-1">
                            <label className="block text-[10px] font-bold text-slate-600">Keterangan / Caption Gambar:</label>
                            <input
                              type="text"
                              value={q.imageCaption || ''}
                              onChange={(e) => {
                                const updated = [...quizQuestions];
                                updated[qIndex].imageCaption = e.target.value;
                                setQuizQuestions(updated);
                              }}
                              placeholder="Keterangan gambar..."
                              className="w-full p-1.5 rounded border border-blue-200 bg-white text-xs text-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {materialImages.length > 0 && (
                          <div className="relative group">
                            <button
                              type="button"
                              className="px-2.5 py-1 text-[11px] rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold flex items-center gap-1 transition"
                            >
                              <ImageIcon className="w-3 h-3 text-blue-600" />
                              <span>Pilih Gambar dari Materi ({materialImages.length})</span>
                            </button>
                            <div className="hidden group-hover:flex absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 flex-col gap-1 max-h-48 overflow-y-auto">
                              <span className="text-[10px] font-bold text-slate-400 px-1">Pilih gambar materi:</span>
                              {materialImages.map((mImg, mIdx) => (
                                <button
                                  key={mIdx}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...quizQuestions];
                                    updated[qIndex].imageUrl = mImg.url;
                                    updated[qIndex].imageCaption = mImg.caption || mImg.name;
                                    setQuizQuestions(updated);
                                  }}
                                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-blue-50 text-left text-xs transition"
                                >
                                  <img src={mImg.url} alt={mImg.name} className="w-8 h-8 object-cover rounded" />
                                  <span className="truncate font-semibold text-slate-800">{mImg.name || `Gambar ${mIdx + 1}`}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <label className="cursor-pointer px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 transition">
                          <Plus className="w-3 h-3 text-slate-500" />
                          <span>+ Sisipkan Gambar Soal</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const updated = [...quizQuestions];
                                  updated[qIndex].imageUrl = reader.result as string;
                                  updated[qIndex].imageCaption = file.name.replace(/\.[^/.]+$/, '');
                                  setQuizQuestions(updated);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/50">
                          <input
                            type="radio"
                            name={`quiz-correct-${q.id}`}
                            checked={q.correctIndex === optIndex}
                            onChange={() => {
                              const updated = [...quizQuestions];
                              updated[qIndex].correctIndex = optIndex;
                              setQuizQuestions(updated);
                            }}
                            className="text-blue-600 focus:ring-blue-500 ml-1"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...quizQuestions];
                              updated[qIndex].options[optIndex] = e.target.value;
                              setQuizQuestions(updated);
                            }}
                            placeholder={`Pilihan ${String.fromCharCode(65 + optIndex)}`}
                            className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Penjelasan / Pembahasan Jawaban</label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => {
                            const updated = [...quizQuestions];
                            updated[qIndex].explanation = e.target.value;
                            setQuizQuestions(updated);
                          }}
                          placeholder="Pembahasan materi..."
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Bobot Poin</label>
                        <input
                          type="number"
                          value={q.points || 20}
                          onChange={(e) => {
                            const updated = [...quizQuestions];
                            updated[qIndex].points = Number(e.target.value);
                            setQuizQuestions(updated);
                          }}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {quizQuestions.length === 0 && (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                    Belum ada soal latihan. Pilih jumlah soal di atas dan klik "Generate Soal dari Materi" atau tambahkan soal secara manual.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: GAME EDUKASI DENGAN PILIHAN MODEL / TIPE BANYAK & ISIAN PROMPT */}
          {activeTab === 'game' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Gamepad2 className="w-4 h-4 text-purple-600" />
                    Pilihan Model Game & Isian Perintah / Prompt Game Edukasi
                  </h4>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                    7 Model Game Interaktif Tersedia
                  </span>
                </div>
                <p className="text-[11px] text-purple-800 mb-3">
                  Pilih model permainan di bawah ini dan masukkan instruksi/perintah spesifik guru. Sistem otomatis merancang game edukasi interaktif sesuai materi.
                </p>

                {/* Model / Tipe Game Selection Buttons */}
                <div className="space-y-2 mb-3">
                  <label className="block text-xs font-bold text-purple-950">Pilih Model / Tipe Game Edukasi:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGameType('memory_match');
                        setGamePrompt('Buat game kartu memori mencocokkan istilah dan definisi kunci materi secara interaktif');
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-left transition ${
                        gameType === 'memory_match'
                          ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-xs'
                          : 'border-purple-200 bg-white hover:bg-purple-100 text-purple-900'
                      }`}
                    >
                      <div className="font-bold">1. Kartu Memori Pasangan</div>
                      <div className="text-[10px] opacity-80">Mencocokkan istilah & definisi</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGameType('speed_trivia');
                        setGamePrompt('Buat kuis kilat kecepatan (speed trivia) 5 level pertanyaan cepat dengan batasan waktu');
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-left transition ${
                        gameType === 'speed_trivia'
                          ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-xs'
                          : 'border-purple-200 bg-white hover:bg-purple-100 text-purple-900'
                      }`}
                    >
                      <div className="font-bold">2. Kuis Kilat Kecepatan</div>
                      <div className="text-[10px] opacity-80">Speed trivia pilihan ganda cepat</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGameType('word_scramble');
                        setGamePrompt('Buat game tebak kata kunci / susun huruf acak (word scramble) berdasarkan istilah penting materi');
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-left transition ${
                        gameType === 'word_scramble'
                          ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-xs'
                          : 'border-purple-200 bg-white hover:bg-purple-100 text-purple-900'
                      }`}
                    >
                      <div className="font-bold">3. Susun Kata Acak</div>
                      <div className="text-[10px] opacity-80">Tebak istilah huruf teracak</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGameType('true_false');
                        setGamePrompt('Buat game tantangan cepat Benar atau Salah (True or False) untuk menguji fakta penting bab ini');
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-left transition ${
                        gameType === 'true_false'
                          ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-xs'
                          : 'border-purple-200 bg-white hover:bg-purple-100 text-purple-900'
                      }`}
                    >
                      <div className="font-bold">4. Tantangan Benar / Salah</div>
                      <div className="text-[10px] opacity-80">Cepat tentukan fakta valid/keliru</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGameType('card_sort');
                        setGamePrompt('Buat game klasifikasi / pilah kategori materi (card sort) memilah konsep ke dalam kelompok yang tepat');
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-left transition ${
                        gameType === 'card_sort'
                          ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-xs'
                          : 'border-purple-200 bg-white hover:bg-purple-100 text-purple-900'
                      }`}
                    >
                      <div className="font-bold">5. Pilah Kategori Konsep</div>
                      <div className="text-[10px] opacity-80">Klasifikasi kelompok materi</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGameType('crossword');
                        setGamePrompt(`Buat game Teka-Teki Silang (TTS) dengan ${crosswordAcrossCount} pertanyaan mendatar dan ${crosswordDownCount} pertanyaan menurun dari materi yang diupload`);
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-left transition ${
                        gameType === 'crossword'
                          ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-xs'
                          : 'border-purple-200 bg-white hover:bg-purple-100 text-purple-900'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1">
                        <Grid3X3 className="w-3.5 h-3.5 text-amber-300" />
                        6. Teka-Teki Silang (TTS)
                      </div>
                      <div className="text-[10px] opacity-80">Mendatar & Menurun otomatis dari materi</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGameType('image_match');
                        setGamePrompt('Buat game menjodohkan gambar dan namanya sesuai dengan materi yang diupload');
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-left transition sm:col-span-3 ${
                        gameType === 'image_match'
                          ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-xs'
                          : 'border-purple-200 bg-white hover:bg-purple-100 text-purple-900'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-emerald-400" />
                        7. Game Menjodohkan Gambar & Namanya
                      </div>
                      <div className="text-[10px] opacity-80">Mencocokkan visual gambar dari materi dengan nama istilah konsep yang benar</div>
                    </button>
                  </div>
                </div>

                {/* Prompt Field */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-purple-950">
                    Isian Perintah / Prompt Game dari Guru:
                  </label>
                  <textarea
                    rows={3}
                    value={gamePrompt}
                    onChange={(e) => setGamePrompt(e.target.value)}
                    placeholder="Tuliskan perintah khusus untuk game edukasi yang diinginkan guru..."
                    className="w-full p-3 rounded-xl border border-purple-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />

                  {/* Quick Preset Prompts */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-purple-700 font-bold">Inspirasi Perintah:</span>
                    <button
                      type="button"
                      onClick={() => setGamePrompt('Buat game memori mencocokkan kartu antara istilah penting dan pengertiannya berdasarkan materi')}
                      className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 transition"
                    >
                      Kartu Memori Istilah
                    </button>
                    <button
                      type="button"
                      onClick={() => setGamePrompt('Buat kuis kilat kecepatan (speed trivia) 5 level dengan pertanyaan menantang dan batas waktu cepat')}
                      className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 transition"
                    >
                      Kuis Kilat Speed Trivia
                    </button>
                    <button
                      type="button"
                      onClick={() => setGamePrompt('Buat tantangan susun kata acak tebak istilah kunci dari materi yang dipelajari')}
                      className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 transition"
                    >
                      Susun Kata Tebak Istilah
                    </button>
                    <button
                      type="button"
                      onClick={() => setGamePrompt('Buat tantangan Benar atau Salah untuk 5 fakta esensial dalam materi bab ini')}
                      className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 transition"
                    >
                      Fakta Benar / Salah
                    </button>
                    <button
                      type="button"
                      onClick={() => setGamePrompt('Buat game pilah konsep (card sort) mengelompokkan contoh ke dalam kategori materi')}
                      className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 transition"
                    >
                      Pilah Kategori Konsep
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGameType('crossword');
                        setGamePrompt(`Buat game Teka-Teki Silang (TTS) dengan ${crosswordAcrossCount} pertanyaan mendatar dan ${crosswordDownCount} pertanyaan menurun dari materi yang diupload`);
                      }}
                      className="px-2 py-1 rounded-lg bg-purple-200 hover:bg-purple-300 text-purple-950 font-bold transition flex items-center gap-1"
                    >
                      <Grid3X3 className="w-3 h-3" />
                      TTS Mendatar & Menurun
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGameType('image_match');
                        setGamePrompt('Buat game menjodohkan gambar dan nama istilah sesuai materi yang diupload');
                      }}
                      className="px-2 py-1 rounded-lg bg-purple-200 hover:bg-purple-300 text-purple-950 font-bold transition flex items-center gap-1"
                    >
                      <ImageIcon className="w-3 h-3" />
                      Menjodohkan Gambar Materi
                    </button>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleGenerateGame}
                      disabled={isGeneratingGame}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      {isGeneratingGame ? 'Merancang Game Edukasi...' : 'Buat Game Edukasi Sesuai Perintah & Tipe'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Game Settings */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Judul Game Edukasi</label>
                    <input
                      type="text"
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Model / Tipe Game</label>
                    <select
                      value={gameType}
                      onChange={(e) => setGameType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white font-semibold"
                    >
                      <option value="memory_match">1. Kartu Memori Pasangan</option>
                      <option value="speed_trivia">2. Kuis Kilat Kecepatan (Speed Trivia)</option>
                      <option value="word_scramble">3. Susun Kata Acak (Word Scramble)</option>
                      <option value="true_false">4. Tantangan Benar atau Salah</option>
                      <option value="card_sort">5. Pilah Kategori Konsep (Card Sort)</option>
                      <option value="crossword">6. Teka-Teki Silang (TTS)</option>
                      <option value="image_match">7. Menjodohkan Gambar & Nama</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Instruksi Bermain untuk Siswa</label>
                    <input
                      type="text"
                      value={gameInstructions}
                      onChange={(e) => setGameInstructions(e.target.value)}
                      placeholder="Contoh: Cocokkan semua pasang kartu sebelum waktu habis!"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      Batasan Waktu Bermain Game (Menit)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={gameTimeLimit}
                      onChange={(e) => setGameTimeLimit(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2.5 rounded-xl border border-purple-300 bg-purple-50/40 text-xs font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Rundown waktu saat bermain game. Skor otomatis tersimpan jika waktu habis.
                    </span>
                  </div>
                </div>

                {/* Game Pairs Editing if memory match */}
                {gameType === 'memory_match' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Daftar Pasangan Kartu Memori ({gamePairs.length} Pasang):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setGamePairs([
                            ...gamePairs,
                            {
                              id: `pair-${Date.now()}-${gamePairs.length + 1}`,
                              term: '',
                              definition: '',
                              topic: chapterTitle || 'Umum',
                            }
                          ]);
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        + Tambah Pasangan Kartu
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {gamePairs.map((pair, idx) => (
                        <div key={pair.id || idx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-950 text-[11px]">Pasangan #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setGamePairs(gamePairs.filter((_, pIdx) => pIdx !== idx))}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="Hapus Pasangan Kartu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Istilah / Kata Kunci</label>
                            <input
                              type="text"
                              value={pair.term}
                              onChange={(e) => {
                                const updated = [...gamePairs];
                                updated[idx].term = e.target.value;
                                setGamePairs(updated);
                              }}
                              placeholder="Contoh: Klasifikasi"
                              className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Definisi / Arti Kartu</label>
                            <input
                              type="text"
                              value={pair.definition}
                              onChange={(e) => {
                                const updated = [...gamePairs];
                                updated[idx].definition = e.target.value;
                                setGamePairs(updated);
                              }}
                              placeholder="Contoh: Pengelompokan makhluk hidup berdasar ciri"
                              className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {gamePairs.length === 0 && (
                      <div className="p-4 text-center bg-purple-50/30 rounded-xl border border-dashed border-purple-200 text-xs text-purple-800">
                        Belum ada pasangan kartu memori. Klik "+ Tambah Pasangan Kartu" atau gunakan AI Generator di atas.
                      </div>
                    )}
                  </div>
                )}

                {/* Game Trivia Editing if speed trivia */}
                {gameType === 'speed_trivia' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Daftar Soal Kuis Kilat Kecepatan ({gameTrivia.length} Soal):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setGameTrivia([
                            ...gameTrivia,
                            {
                              id: `trivia-${Date.now()}-${gameTrivia.length + 1}`,
                              question: '',
                              options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                              correctIndex: 0,
                              explanation: '',
                            }
                          ]);
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        + Tambah Soal Kecepatan
                      </button>
                    </div>

                    <div className="space-y-3">
                      {gameTrivia.map((t, idx) => (
                        <div key={t.id || idx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-950 text-[11px]">Soal Kecepatan #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setGameTrivia(gameTrivia.filter((_, tIdx) => tIdx !== idx))}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="Hapus Soal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={t.question}
                            onChange={(e) => {
                              const updated = [...gameTrivia];
                              updated[idx].question = e.target.value;
                              setGameTrivia(updated);
                            }}
                            placeholder="Tuliskan pertanyaan kilat..."
                            className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs text-slate-800 font-semibold"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(t.options || ['A', 'B', 'C', 'D']).map((opt: string, optIdx: number) => (
                              <div key={optIdx} className="flex items-center gap-1.5 p-1.5 bg-white rounded-lg border border-purple-100">
                                <input
                                  type="radio"
                                  name={`trivia-correct-${idx}`}
                                  checked={t.correctIndex === optIdx}
                                  onChange={() => {
                                    const updated = [...gameTrivia];
                                    updated[idx].correctIndex = optIdx;
                                    setGameTrivia(updated);
                                  }}
                                  className="text-purple-600 ml-1"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const updated = [...gameTrivia];
                                    const opts = [...(updated[idx].options || [])];
                                    opts[optIdx] = e.target.value;
                                    updated[idx].options = opts;
                                    setGameTrivia(updated);
                                  }}
                                  className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Word Scramble Editing if word scramble */}
                {gameType === 'word_scramble' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Daftar Kata Acak ({gameScrambleWords.length} Kata Kunci):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setGameScrambleWords([
                            ...gameScrambleWords,
                            {
                              id: `scramble-${Date.now()}-${gameScrambleWords.length + 1}`,
                              word: '',
                              scrambled: '',
                              hint: '',
                            }
                          ]);
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        + Tambah Kata Acak
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {gameScrambleWords.map((w, idx) => (
                        <div key={w.id || idx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-950 text-[11px]">Kata #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setGameScrambleWords(gameScrambleWords.filter((_, wIdx) => wIdx !== idx))}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="Hapus Kata Acak"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Kata Kunci Benar</label>
                            <input
                              type="text"
                              value={w.word}
                              onChange={(e) => {
                                const updated = [...gameScrambleWords];
                                const wordVal = e.target.value.toUpperCase();
                                updated[idx].word = wordVal;
                                updated[idx].scrambled = wordVal.split('').sort(() => 0.5 - Math.random()).join('');
                                setGameScrambleWords(updated);
                              }}
                              placeholder="Contoh: VERTEBRATA"
                              className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs text-slate-800 font-bold tracking-wider"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Petunjuk / Hint</label>
                            <input
                              type="text"
                              value={w.hint}
                              onChange={(e) => {
                                const updated = [...gameScrambleWords];
                                updated[idx].hint = e.target.value;
                                setGameScrambleWords(updated);
                              }}
                              placeholder="Contoh: Hewan yang memiliki tulang belakang"
                              className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs text-slate-700"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* True False Editing */}
                {gameType === 'true_false' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Daftar Pernyataan Benar / Salah ({gameTrueFalse.length} Pernyataan):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setGameTrueFalse([
                            ...gameTrueFalse,
                            {
                              id: `tf-${Date.now()}-${gameTrueFalse.length + 1}`,
                              statement: '',
                              isTrue: true,
                              explanation: '',
                            }
                          ]);
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        + Tambah Pernyataan
                      </button>
                    </div>

                    <div className="space-y-2">
                      {gameTrueFalse.map((tf, idx) => (
                        <div key={tf.id || idx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-purple-950 text-[11px]">Pernyataan #{idx + 1}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...gameTrueFalse];
                                  updated[idx].isTrue = !updated[idx].isTrue;
                                  setGameTrueFalse(updated);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                  tf.isTrue ? 'bg-emerald-600 text-white shadow-xs' : 'bg-rose-600 text-white shadow-xs'
                                }`}
                              >
                                {tf.isTrue ? 'Kunci: BENAR ✓' : 'Kunci: SALAH ✗'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setGameTrueFalse(gameTrueFalse.filter((_, tfIdx) => tfIdx !== idx))}
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={tf.statement}
                            onChange={(e) => {
                              const updated = [...gameTrueFalse];
                              updated[idx].statement = e.target.value;
                              setGameTrueFalse(updated);
                            }}
                            placeholder="Tuliskan pernyataan materi..."
                            className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs text-slate-800 font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Sort Editing */}
                {gameType === 'card_sort' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Daftar Kategori Konsep ({gameSortCategories.length} Kategori):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setGameSortCategories([
                            ...gameSortCategories,
                            {
                              id: `cat-${Date.now()}-${gameSortCategories.length + 1}`,
                              categoryName: '',
                              items: [
                                { id: `item-1`, text: 'Contoh Item 1' },
                                { id: `item-2`, text: 'Contoh Item 2' },
                              ],
                            }
                          ]);
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        + Tambah Kategori
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {gameSortCategories.map((cat, idx) => (
                        <div key={cat.id || idx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-950 text-[11px]">Kategori #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setGameSortCategories(gameSortCategories.filter((_, cIdx) => cIdx !== idx))}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Nama Kategori</label>
                            <input
                              type="text"
                              value={cat.categoryName}
                              onChange={(e) => {
                                const updated = [...gameSortCategories];
                                updated[idx].categoryName = e.target.value;
                                setGameSortCategories(updated);
                              }}
                              placeholder="Contoh: Hewan Vertebrata"
                              className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs text-slate-800 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Daftar Item (Pisahkan dengan koma)</label>
                            <input
                              type="text"
                              value={cat.items?.map(i => i.text).join(', ') || ''}
                              onChange={(e) => {
                                const updated = [...gameSortCategories];
                                const splitItems = e.target.value.split(',').map((itemStr, sIdx) => ({
                                  id: `item-${sIdx}-${Date.now()}`,
                                  text: itemStr.trim(),
                                })).filter(i => i.text.length > 0);
                                updated[idx].items = splitItems;
                                setGameSortCategories(updated);
                              }}
                              placeholder="Contoh: Ikan, Burung, Kucing, Katak"
                              className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs text-slate-700"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. TEKA-TEKI SILANG (TTS) CONFIG & CLUES */}
                {gameType === 'crossword' && (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-purple-100/50 rounded-2xl border border-purple-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                            <Grid3X3 className="w-4 h-4 text-purple-700" />
                            Konfigurasi Soal Mendatar, Menurun & Total Poin TTS
                          </h4>
                          <p className="text-[11px] text-purple-800 mt-0.5">
                            Tentukan jumlah soal mendatar, menurun, serta poin kelulusan. Kata dan pertanyaan dapat diisi manual atau otomatis digenerate AI dari teks materi bab.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-purple-950 mb-1">
                            Jumlah Soal Mendatar (Across)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={crosswordAcrossCount}
                            onChange={(e) => setCrosswordAcrossCount(Math.max(1, Number(e.target.value)))}
                            className="w-full p-2.5 rounded-xl border border-purple-300 bg-white text-xs font-bold text-purple-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-purple-950 mb-1">
                            Jumlah Soal Menurun (Down)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={crosswordDownCount}
                            onChange={(e) => setCrosswordDownCount(Math.max(1, Number(e.target.value)))}
                            className="w-full p-2.5 rounded-xl border border-purple-300 bg-white text-xs font-bold text-purple-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-purple-950 mb-1">
                            Jumlah Poin Total Game TTS
                          </label>
                          <input
                            type="number"
                            min={10}
                            max={1000}
                            step={10}
                            value={crosswordTotalPoints}
                            onChange={(e) => setCrosswordTotalPoints(Math.max(10, Number(e.target.value)))}
                            className="w-full p-2.5 rounded-xl border border-purple-300 bg-white text-xs font-bold text-purple-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clues Mendatar (Across) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <ArrowRight className="w-4 h-4 text-purple-700" />
                          Daftar Pertanyaan Mendatar (Across) - {crosswordClues.filter(c => c.direction === 'across').length} Butir:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const acrossList = crosswordClues.filter(c => c.direction === 'across');
                            const nextNum = acrossList.length > 0 ? Math.max(...acrossList.map(c => c.number)) + 1 : 1;
                            setCrosswordClues([
                              ...crosswordClues,
                              {
                                id: `clue-a-${Date.now()}`,
                                number: nextNum,
                                direction: 'across',
                                clue: '',
                                answer: 'ISTILAH',
                                row: acrossList.length * 2,
                                col: 0,
                              }
                            ]);
                          }}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          + Tambah Soal Mendatar
                        </button>
                      </div>

                      <div className="space-y-2">
                        {crosswordClues.filter(c => c.direction === 'across').map((clue, idx) => {
                          const realIndex = crosswordClues.findIndex(c => c.id === clue.id);
                          return (
                            <div key={clue.id || idx} className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-[11px]">
                                    {clue.number}
                                  </span>
                                  <span className="font-bold text-purple-950 text-xs">Mendatar #{clue.number}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setCrosswordClues(crosswordClues.filter(c => c.id !== clue.id))}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                  title="Hapus Soal Mendatar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Pertanyaan / Petunjuk (Clue)</label>
                                  <input
                                    type="text"
                                    value={clue.clue}
                                    onChange={(e) => {
                                      const updated = [...crosswordClues];
                                      updated[realIndex].clue = e.target.value;
                                      setCrosswordClues(updated);
                                    }}
                                    placeholder="Contoh: Proses pembuatan makanan pada tumbuhan berklorofil..."
                                    className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs text-slate-800"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-purple-900 mb-0.5">Kunci Jawaban (Huruf)</label>
                                  <input
                                    type="text"
                                    value={clue.answer}
                                    onChange={(e) => {
                                      const updated = [...crosswordClues];
                                      updated[realIndex].answer = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                                      setCrosswordClues(updated);
                                    }}
                                    placeholder="FOTOSINTESIS"
                                    className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs font-bold text-purple-900 tracking-wider"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {crosswordClues.filter(c => c.direction === 'across').length === 0 && (
                          <div className="p-3 text-center bg-purple-50/30 rounded-xl border border-dashed border-purple-200 text-xs text-purple-800">
                            Belum ada soal mendatar. Klik "+ Tambah Soal Mendatar" atau gunakan tombol "Buat Game Edukasi Sesuai Perintah & Tipe" di atas.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Clues Menurun (Down) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <ArrowRight className="w-4 h-4 text-indigo-700 rotate-90" />
                          Daftar Pertanyaan Menurun (Down) - {crosswordClues.filter(c => c.direction === 'down').length} Butir:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const downList = crosswordClues.filter(c => c.direction === 'down');
                            const nextNum = downList.length > 0 ? Math.max(...downList.map(c => c.number)) + 1 : 1;
                            setCrosswordClues([
                              ...crosswordClues,
                              {
                                id: `clue-d-${Date.now()}`,
                                number: nextNum,
                                direction: 'down',
                                clue: '',
                                answer: 'KLOROFIL',
                                row: 0,
                                col: downList.length * 2,
                              }
                            ]);
                          }}
                          className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          + Tambah Soal Menurun
                        </button>
                      </div>

                      <div className="space-y-2">
                        {crosswordClues.filter(c => c.direction === 'down').map((clue, idx) => {
                          const realIndex = crosswordClues.findIndex(c => c.id === clue.id);
                          return (
                            <div key={clue.id || idx} className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
                                    {clue.number}
                                  </span>
                                  <span className="font-bold text-indigo-950 text-xs">Menurun #{clue.number}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setCrosswordClues(crosswordClues.filter(c => c.id !== clue.id))}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                  title="Hapus Soal Menurun"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-indigo-900 mb-0.5">Pertanyaan / Petunjuk (Clue)</label>
                                  <input
                                    type="text"
                                    value={clue.clue}
                                    onChange={(e) => {
                                      const updated = [...crosswordClues];
                                      updated[realIndex].clue = e.target.value;
                                      setCrosswordClues(updated);
                                    }}
                                    placeholder="Contoh: Zat hijau daun penyerap energi matahari..."
                                    className="w-full p-2 bg-white rounded-lg border border-indigo-200 text-xs text-slate-800"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-indigo-900 mb-0.5">Kunci Jawaban (Huruf)</label>
                                  <input
                                    type="text"
                                    value={clue.answer}
                                    onChange={(e) => {
                                      const updated = [...crosswordClues];
                                      updated[realIndex].answer = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                                      setCrosswordClues(updated);
                                    }}
                                    placeholder="KLOROFIL"
                                    className="w-full p-2 bg-white rounded-lg border border-indigo-200 text-xs font-bold text-indigo-900 tracking-wider"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {crosswordClues.filter(c => c.direction === 'down').length === 0 && (
                          <div className="p-3 text-center bg-indigo-50/30 rounded-xl border border-dashed border-indigo-200 text-xs text-indigo-800">
                            Belum ada soal menurun. Klik "+ Tambah Soal Menurun" atau gunakan tombol "Buat Game Edukasi Sesuai Perintah & Tipe" di atas.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. MENJODOHKAN GAMBAR DAN NAMANYA (IMAGE MATCH) CONFIG */}
                {gameType === 'image_match' && (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-emerald-600" />
                          Game Menjodohkan Gambar dan Namanya Sesuai Materi
                        </h4>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          Siswa akan mencocokkan kartu visual gambar dengan nama konsep yang tepat. Otomatis menggunakan gambar yang ada di materi yang diupload!
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {materialImages.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const pairs: ImageMatchItem[] = materialImages.map((img, i) => ({
                                id: img.id || `match-${Date.now()}-${i}`,
                                imageUrl: img.url,
                                name: img.name || `Konsep ${i + 1}`,
                                description: img.caption || '',
                              }));
                              setImageMatchItems(pairs);
                              showFeedback('success', 'Gambar Materi Dimuat!', `Berhasil memuat ${pairs.length} pasang gambar & nama dari materi untuk game menjodohkan.`);
                            }}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Ambil dari Gambar Materi ({materialImages.length})</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setImageMatchItems([
                              ...imageMatchItems,
                              {
                                id: `item-${Date.now()}-${imageMatchItems.length + 1}`,
                                imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=400&auto=format&fit=crop&q=80',
                                name: '',
                                description: '',
                              }
                            ]);
                          }}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          + Tambah Pasangan Manual
                        </button>
                      </div>
                    </div>

                    {/* Pairs List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {imageMatchItems.map((item, idx) => (
                        <div key={item.id || idx} className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-200 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-950 text-xs">Pasangan #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setImageMatchItems(imageMatchItems.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Hapus Pasangan Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex gap-3 items-center">
                            <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 border border-emerald-200 shrink-0 flex items-center justify-center">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div>
                                <label className="block text-[10px] font-bold text-emerald-900 mb-0.5">Nama Konsep / Jawaban:</label>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => {
                                    const updated = [...imageMatchItems];
                                    updated[idx].name = e.target.value;
                                    setImageMatchItems(updated);
                                  }}
                                  placeholder="Contoh: Kloroplas / Mitokondria"
                                  className="w-full p-2 bg-white rounded-lg border border-emerald-200 text-xs font-bold text-slate-900"
                                />
                              </div>
                              <label className="cursor-pointer px-2.5 py-1 text-[10px] rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-bold inline-flex items-center gap-1 transition">
                                <Upload className="w-3 h-3 text-emerald-600" />
                                <span>Ganti Gambar Pasangan</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        const updated = [...imageMatchItems];
                                        updated[idx].imageUrl = reader.result as string;
                                        if (!updated[idx].name) {
                                          updated[idx].name = file.name.replace(/\.[^/.]+$/, '');
                                        }
                                        setImageMatchItems(updated);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-emerald-900 mb-0.5">Keterangan / Clue (Opsional):</label>
                            <input
                              type="text"
                              value={item.description || ''}
                              onChange={(e) => {
                                const updated = [...imageMatchItems];
                                updated[idx].description = e.target.value;
                                setImageMatchItems(updated);
                              }}
                              placeholder="Deskripsi singkat fungsi atau ciri visual..."
                              className="w-full p-2 bg-white rounded-lg border border-emerald-200 text-xs text-slate-700"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {imageMatchItems.length === 0 && (
                      <div className="p-6 text-center bg-emerald-50/30 rounded-2xl border border-dashed border-emerald-300 text-xs text-emerald-900">
                        Belum ada pasangan kartu gambar dan nama. Klik <strong>"Ambil dari Gambar Materi"</strong> atau <strong>"+ Tambah Pasangan Manual"</strong> untuk membuat game menjodohkan gambar.
                      </div>
                    )}
                  </div>
                )}

                {/* Simulation button for the game */}
                <div className="pt-3 border-t border-purple-100 flex flex-wrap items-center justify-between gap-3 bg-purple-50/60 p-3 rounded-xl">
                  <div className="text-xs text-purple-900">
                    <span className="font-bold">Uji Coba Langsung:</span> Guru dapat mensimulasikan dan memainkan game edukasi ini sebelum dibagikan ke siswa.
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateGameFromEditor}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                  >
                    <Gamepad2 className="w-4 h-4 text-amber-300" />
                    <span>Simulasikan Game Ini Sekarang</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ASESMEN AKHIR OTOMATIS DIAMBIL DARI MATERI */}
          {activeTab === 'assessment' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    Asesmen Akhir Otomatis Diambil dari Materi
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Evaluasi komprehensif penentu kelulusan bab. Otomatis dibuat berdasarkan pemahaman menyeluruh terhadap modul yang diupload.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-bold text-amber-950">Jumlah Soal:</span>
                    <select
                      value={assessmentGenerateCount}
                      onChange={(e) => setAssessmentGenerateCount(Number(e.target.value))}
                      className="p-1.5 rounded-lg border border-amber-300 bg-white font-bold text-amber-900 text-xs"
                    >
                      <option value={3}>3 Soal</option>
                      <option value={5}>5 Soal</option>
                      <option value={10}>10 Soal</option>
                      <option value={15}>15 Soal</option>
                      <option value={20}>20 Soal</option>
                      <option value={25}>25 Soal</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAssessment}
                    disabled={isGeneratingAssessment}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-200" />
                    {isGeneratingAssessment ? `Menyusun ${assessmentGenerateCount} Soal...` : `Generate ${assessmentGenerateCount} Soal Asesmen dari Materi`}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Asesmen Akhir</label>
                  <input
                    type="text"
                    value={assessmentTitle}
                    onChange={(e) => setAssessmentTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Kelulusan (KKM)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={assessmentPassingScore}
                    onChange={(e) => setAssessmentPassingScore(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Batasan Waktu Asesmen (Menit)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={assessmentTimeLimit}
                    onChange={(e) => setAssessmentTimeLimit(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50/40 text-xs font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Hitung mundur evaluasi bab. Jawaban otomatis terkirim jika waktu habis.
                  </span>
                </div>
              </div>

              {/* Assessment Questions Header Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <span className="text-xs font-bold text-slate-800">
                  Daftar Soal Asesmen Akhir ({assessmentQuestions.length} Butir Soal):
                </span>
                <div className="flex items-center gap-2">
                  {assessmentQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAssessmentQuestions([])}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                      title="Kosongkan seluruh butir soal asesmen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Semua Soal</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAssessmentQuestions([
                        ...assessmentQuestions,
                        {
                          id: `assess-custom-${Date.now()}-${assessmentQuestions.length + 1}`,
                          question: '',
                          options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                          correctIndex: 0,
                          explanation: '',
                          topic: 'Evaluasi Komprehensif',
                          points: 20,
                        }
                      ]);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    + Tambah Soal Manual
                  </button>
                </div>
              </div>

              {/* Assessment Questions List */}
              <div className="space-y-3">
                {assessmentQuestions.map((q, qIndex) => (
                  <div key={q.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Soal Asesmen #{qIndex + 1}</span>
                      <button
                        type="button"
                        onClick={() => setAssessmentQuestions(assessmentQuestions.filter((_, idx) => idx !== qIndex))}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-rose-50 transition"
                        title="Hapus Soal Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...assessmentQuestions];
                        updated[qIndex].question = e.target.value;
                        setAssessmentQuestions(updated);
                      }}
                      placeholder="Tuliskan butir soal evaluasi asesmen akhir..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />

                    {/* Gambar Soal Asesmen (Jika ada dari materi atau diunggah guru) */}
                    {q.imageUrl ? (
                      <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                            Ilustrasi Gambar Soal Asesmen #{qIndex + 1} (Dari Materi yang Diupload)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...assessmentQuestions];
                              updated[qIndex].imageUrl = undefined;
                              updated[qIndex].imageCaption = undefined;
                              setAssessmentQuestions(updated);
                            }}
                            className="text-[10px] text-rose-600 hover:underline font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus Gambar
                          </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                          <img
                            src={q.imageUrl}
                            alt={q.imageCaption || 'Gambar asesmen'}
                            className="w-32 h-24 object-contain rounded-lg border border-amber-200 bg-white"
                          />
                          <div className="flex-1 w-full space-y-1">
                            <label className="block text-[10px] font-bold text-slate-600">Keterangan / Caption Gambar:</label>
                            <input
                              type="text"
                              value={q.imageCaption || ''}
                              onChange={(e) => {
                                const updated = [...assessmentQuestions];
                                updated[qIndex].imageCaption = e.target.value;
                                setAssessmentQuestions(updated);
                              }}
                              placeholder="Keterangan gambar..."
                              className="w-full p-1.5 rounded border border-amber-200 bg-white text-xs text-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {materialImages.length > 0 && (
                          <div className="relative group">
                            <button
                              type="button"
                              className="px-2.5 py-1 text-[11px] rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold flex items-center gap-1 transition"
                            >
                              <ImageIcon className="w-3 h-3 text-amber-600" />
                              <span>Pilih Gambar dari Materi ({materialImages.length})</span>
                            </button>
                            <div className="hidden group-hover:flex absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 flex-col gap-1 max-h-48 overflow-y-auto">
                              <span className="text-[10px] font-bold text-slate-400 px-1">Pilih gambar materi:</span>
                              {materialImages.map((mImg, mIdx) => (
                                <button
                                  key={mIdx}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...assessmentQuestions];
                                    updated[qIndex].imageUrl = mImg.url;
                                    updated[qIndex].imageCaption = mImg.caption || mImg.name;
                                    setAssessmentQuestions(updated);
                                  }}
                                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-amber-50 text-left text-xs transition"
                                >
                                  <img src={mImg.url} alt={mImg.name} className="w-8 h-8 object-cover rounded" />
                                  <span className="truncate font-semibold text-slate-800">{mImg.name || `Gambar ${mIdx + 1}`}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <label className="cursor-pointer px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 transition">
                          <Plus className="w-3 h-3 text-slate-500" />
                          <span>+ Sisipkan Gambar Soal Asesmen</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const updated = [...assessmentQuestions];
                                  updated[qIndex].imageUrl = reader.result as string;
                                  updated[qIndex].imageCaption = file.name.replace(/\.[^/.]+$/, '');
                                  setAssessmentQuestions(updated);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/50">
                          <input
                            type="radio"
                            name={`assess-correct-${q.id}`}
                            checked={q.correctIndex === optIndex}
                            onChange={() => {
                              const updated = [...assessmentQuestions];
                              updated[qIndex].correctIndex = optIndex;
                              setAssessmentQuestions(updated);
                            }}
                            className="text-amber-600 focus:ring-amber-500 ml-1"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...assessmentQuestions];
                              updated[qIndex].options[optIndex] = e.target.value;
                              setAssessmentQuestions(updated);
                            }}
                            placeholder={`Pilihan ${String.fromCharCode(65 + optIndex)}`}
                            className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Pembahasan & Landasan Teoretis</label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => {
                            const updated = [...assessmentQuestions];
                            updated[qIndex].explanation = e.target.value;
                            setAssessmentQuestions(updated);
                          }}
                          placeholder="Penjelasan jawaban..."
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Bobot Poin</label>
                        <input
                          type="number"
                          value={q.points || 20}
                          onChange={(e) => {
                            const updated = [...assessmentQuestions];
                            updated[qIndex].points = Number(e.target.value);
                            setAssessmentQuestions(updated);
                          }}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {assessmentQuestions.length === 0 && (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                    Belum ada butir soal asesmen akhir bab. Silakan pilih jumlah soal di atas lalu klik "Generate Soal Asesmen dari Materi" atau tambahkan soal secara manual.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAssessmentQuestions([
                      ...assessmentQuestions,
                      {
                        id: `assess-custom-${Date.now()}-${assessmentQuestions.length + 1}`,
                        question: '',
                        options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                        correctIndex: 0,
                        explanation: '',
                        topic: 'Evaluasi Komprehensif',
                        points: 20,
                      }
                    ]);
                  }}
                  className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl text-xs font-bold text-slate-600 hover:text-amber-700 flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  + Tambah Soal Asesmen Manual
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 hidden sm:block">
            Semua komponen (materi, latihan, game, asesmen) tersimpan rapi untuk kelas ini.
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSimulateStudentFromEditor}
              className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Pratinjau tampilan materi pop-up, cek bacaan, latihan soal, game, dan asesmen di dashboard siswa"
            >
              <Eye className="w-4 h-4 text-amber-700" />
              <span>Uji Coba Tampilan Siswa</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Bab Lengkap'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL SIMULASI GAME EDUKASI INTERAKTIF UNTUK GURU */}
      <TeacherGameSimulationModal
        isOpen={isGameSimulationOpen}
        onClose={() => setIsGameSimulationOpen(false)}
        chapter={buildChapterObject()}
      />

      {/* Reusable Attractive Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onConfirm={feedback.onConfirmAction}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
