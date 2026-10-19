export interface ClassItem {
  id: string;
  name: string;
  subject: string;
  grade: string;
  description: string;
  code: string;
  teacherId: string;
  teacherName: string;
  createdAt: number;
}

export interface Student {
  id: string;
  classId: string;
  name: string;
  nis: string; // Nomor Induk Siswa Nasional (NISN)
  nisn?: string;
  gender: 'Laki-laki' | 'Perempuan';
  password: string;
  avatar?: string;
  totalPoints: number;
  completedItemsCount: number;
}

export interface QuestionItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  points: number;
  imageUrl?: string;
  imageCaption?: string;
}

export interface MaterialImage {
  id: string;
  url: string;
  name?: string;
  caption?: string;
}

export interface ReadingCheckQuestion {
  id: string;
  type?: 'multiple_choice' | 'short_answer';
  question: string;
  options?: string[]; // for multiple_choice
  correctIndex?: number; // for multiple_choice
  acceptedAnswers?: string[]; // for short_answer
  explanation?: string;
  pointCorrect: number; // e.g. 10
  pointWrong: number;   // e.g. 0 or -2
}

export interface UploadedFileInfo {
  fileName: string;
  fileType: 'pdf' | 'docx' | 'doc' | 'txt';
  fileSize: number;
  extractedText?: string;
  fileDataUrl?: string;
  extractedImages?: MaterialImage[];
  uploadedAt?: number;
}

export interface GamePair {
  id: string;
  term: string;
  definition: string;
  topic: string;
}

export interface WordScrambleItem {
  id: string;
  word: string;
  hint: string;
  points: number;
}

export interface TrueFalseItem {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  points: number;
}

export interface SortCategoryItem {
  id: string;
  name: string;
  items: string[];
}

// 6. TEKA-TEKI SILANG (TTS / CROSSWORD)
export interface CrosswordClue {
  id: string;
  number: number;
  direction: 'across' | 'down'; // mendatar | menurun
  clue: string;
  answer: string;
  row: number; // 0-indexed posisi baris di grid
  col: number; // 0-indexed posisi kolom di grid
}

export interface CrosswordGameConfig {
  acrossCount: number;
  downCount: number;
  totalPoints: number;
  clues: CrosswordClue[];
}

// 7. MENJODOHKAN GAMBAR DAN NAMA (IMAGE MATCH)
export interface ImageMatchItem {
  id: string;
  imageUrl: string;
  name: string;
  description?: string;
}

export interface ImageMatchConfig {
  items: ImageMatchItem[];
  targetScore: number;
}

export interface ChapterGame {
  id: string;
  title: string;
  type: 'memory_match' | 'speed_trivia' | 'word_scramble' | 'true_false' | 'card_sort' | 'crossword' | 'image_match';
  prompt?: string;
  description: string;
  instructions: string;
  targetScore: number;
  timeLimitMinutes?: number; // Batasan waktu bermain game edukasi dalam menit (rundown)
  pairs?: GamePair[];
  triviaQuestions?: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    points: number;
  }[];
  scrambleWords?: WordScrambleItem[];
  trueFalseItems?: TrueFalseItem[];
  sortCategories?: SortCategoryItem[];
  crosswordConfig?: CrosswordGameConfig;
  imageMatchConfig?: ImageMatchConfig;
}

export interface Chapter {
  id: string;
  classId: string;
  assignedClassIds?: string[]; // Daftar kelas yang dapat membaca / mengakses bab & materi ini
  teacherId?: string; // ID akun guru pembuat bab & materi
  teacherName?: string; // Nama guru pembuat bab & materi
  chapterNumber: number;
  title: string;
  description: string;
  order: number;
  material: {
    id: string;
    title: string;
    readingTimeMinutes: number; // Batasan rundown waktu membaca materi
    content: string;
    summaryPoints: string[];
    videoUrl?: string;
    uploadedFile?: UploadedFileInfo;
    images?: MaterialImage[];
    checkQuestions?: ReadingCheckQuestion[];
  };
  quiz: {
    id: string;
    title: string;
    passingScore: number;
    timeLimitMinutes?: number; // Batasan rundown waktu pengerjaan latihan soal (auto-submit jika habis)
    questions: QuestionItem[];
  };
  game: ChapterGame;
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    timeLimitMinutes?: number; // Batasan rundown waktu pengerjaan asesmen akhir (auto-submit jika habis)
    questions: QuestionItem[];
  };
}

export interface StudentProgress {
  id: string;
  studentId: string;
  chapterId: string;
  classId: string;
  materialCompleted: boolean;
  materialCompletedAt?: number;
  readingScore?: number;
  readingCheckCompleted?: boolean;
  quizCompleted: boolean;
  quizScore?: number;
  quizPassed?: boolean;
  quizCompletedAt?: number;
  gameCompleted: boolean;
  gameScore?: number;
  gameCompletedAt?: number;
  assessmentCompleted: boolean;
  assessmentScore?: number;
  assessmentPassed?: boolean;
  assessmentCompletedAt?: number;
  isUnlocked: boolean;
  topicScores?: Record<string, { correct: number; total: number }>;
}

export interface NotificationItem {
  id: string;
  teacherId: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  type: 'materi' | 'soal' | 'game' | 'asesmen';
  title: string;
  message: string;
  score?: number;
  timestamp: number;
  read: boolean;
}

export interface SchoolSettings {
  id?: string;
  schoolName: string; // e.g. "MTsN 3 Banyuwangi"
  schoolSubtitle: string; // e.g. "Madrasah Tsanawiyah Negeri 3 Banyuwangi"
  schoolTagline?: string;
  logoUrl?: string;
  updatedAt?: number;
}

export interface ChatMessage {
  id: string;
  classId: string;
  recipientId?: string; // ID guru tujuan jika chat langsung/tanya guru
  recipientName?: string; // Nama guru tujuan
  studentClassId?: string; // Kelas asal siswa jika tanya langsung
  studentClassName?: string;
  senderId: string;
  senderName: string;
  senderRole: 'guru' | 'siswa';
  avatar?: string;
  text: string;
  timestamp: number;
}

export interface PersonalRecommendation {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  teacherName: string;
  topic: string;
  strengthWeaknessType: 'kelemahan' | 'kelebihan' | 'pengayaan';
  reason: string;
  recommendationText: string;
  suggestedAction: string;
  createdAt: number;
  status: 'baru' | 'dibaca' | 'selesai';
}

export interface UserSession {
  role: 'guru' | 'siswa';
  id: string;
  name: string;
  email?: string;
  nis?: string;
  nip?: string;
  isMainTeacher?: boolean;
  subject?: string;
  classId?: string;
  className?: string;
  avatar?: string;
}

export interface TeacherItem {
  id: string;
  name: string;
  nip?: string;
  email: string;
  password?: string;
  isMainTeacher: boolean;
  subject: string;
  phone?: string;
  avatar?: string;
  createdAt: number;
  status: 'aktif' | 'nonaktif';
  addedBy?: string; // ID admin / Guru Utama yang mendaftarkan akun ini
  addedByName?: string; // Nama admin pembuat akun
}
