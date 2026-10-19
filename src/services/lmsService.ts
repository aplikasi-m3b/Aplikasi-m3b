import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocs,
  deleteDoc, 
  addDoc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  ClassItem, 
  Student, 
  Chapter, 
  StudentProgress, 
  NotificationItem, 
  ChatMessage, 
  PersonalRecommendation,
  TeacherItem,
  SchoolSettings
} from '../types';
import { 
  INITIAL_CLASSES, 
  INITIAL_STUDENTS, 
  INITIAL_CHAPTERS, 
  INITIAL_PROGRESS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_CHAT, 
  INITIAL_RECOMMENDATIONS,
  INITIAL_TEACHERS
} from '../data/initialData';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'MTsN 3 Banyuwangi',
  schoolSubtitle: 'Madrasah Tsanawiyah Negeri 3 Banyuwangi',
  schoolTagline: 'LMS Digital Pembelajaran Terpadu',
  logoUrl: '',
  updatedAt: Date.now()
};

// Local storage keys for fallback/seamless offline caching
const STORAGE_KEYS = {
  CLASSES: 'edulms_classes_cache',
  STUDENTS: 'edulms_students_cache',
  CHAPTERS: 'edulms_chapters_cache',
  PROGRESS: 'edulms_progress_cache',
  NOTIFICATIONS: 'edulms_notifications_cache',
  CHAT: 'edulms_chat_cache',
  RECOMMENDATIONS: 'edulms_recommendations_cache',
  TEACHERS: 'edulms_teachers_cache',
  SETTINGS: 'edulms_school_settings_cache',
};

// Helper for local caching
function getLocalCache<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }
}

// Deep clean objects before passing to Firestore setDoc (Firestore rejects any undefined fields)
function cleanForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore);
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = cleanForFirestore(val);
    }
  }
  return cleaned;
}

class LmsService {
  private initialized = false;

  // Initialize and seed firestore if empty
  async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const classesSnap = await getDocs(collection(db, 'classes'));
      if (classesSnap.empty) {
        // Seed initial classes
        for (const cls of INITIAL_CLASSES) {
          await setDoc(doc(db, 'classes', cls.id), cls);
        }
        // Seed initial students
        for (const stu of INITIAL_STUDENTS) {
          await setDoc(doc(db, 'students', stu.id), stu);
        }
        // Seed initial chapters
        for (const chap of INITIAL_CHAPTERS) {
          await setDoc(doc(db, 'chapters', chap.id), chap);
        }
        // Seed initial progress
        for (const prog of INITIAL_PROGRESS) {
          await setDoc(doc(db, 'progress', prog.id), prog);
        }
        // Seed initial notifications
        for (const notif of INITIAL_NOTIFICATIONS) {
          await setDoc(doc(db, 'notifications', notif.id), notif);
        }
        // Seed initial chat
        for (const chat of INITIAL_CHAT) {
          await setDoc(doc(db, 'chat', chat.id), chat);
        }
        // Seed initial recommendations
        for (const rec of INITIAL_RECOMMENDATIONS) {
          await setDoc(doc(db, 'recommendations', rec.id), rec);
        }
        // Seed initial teachers
        for (const teacher of INITIAL_TEACHERS) {
          await setDoc(doc(db, 'teachers', teacher.id), teacher);
        }
      }
    } catch (err) {
      console.warn('Firestore seeding check fallback (using cached/initial data):', err);
    }
  }

  // --- CLASSES ---
  subscribeClasses(callback: (classes: ClassItem[]) => void) {
    const initial = getLocalCache<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    callback(initial);

    try {
      const q = query(collection(db, 'classes'));
      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: ClassItem[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as ClassItem));
          list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setLocalCache(STORAGE_KEYS.CLASSES, list);
          callback(list);
        } else {
          callback(initial);
        }
      }, (err) => {
        console.warn('Classes listener offline fallback:', err);
        callback(initial);
      });
    } catch {
      return () => {};
    }
  }

  async addClass(cls: ClassItem) {
    const current = getLocalCache<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const updated = [cls, ...current];
    setLocalCache(STORAGE_KEYS.CLASSES, updated);

    try {
      await setDoc(doc(db, 'classes', cls.id), cls);
    } catch (err) {
      console.warn('Failed to save class to firestore:', err);
    }
  }

  async updateClass(cls: ClassItem) {
    const current = getLocalCache<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const updated = current.map(c => c.id === cls.id ? cls : c);
    setLocalCache(STORAGE_KEYS.CLASSES, updated);

    try {
      await setDoc(doc(db, 'classes', cls.id), cls);
    } catch (err) {
      console.warn('Failed to update class in firestore:', err);
    }
  }

  async deleteClass(classId: string) {
    const current = getLocalCache<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const updated = current.filter(c => c.id !== classId);
    setLocalCache(STORAGE_KEYS.CLASSES, updated);

    try {
      await deleteDoc(doc(db, 'classes', classId));
    } catch (err) {
      console.warn('Failed to delete class in firestore:', err);
    }
  }

  // --- STUDENTS ---
  private studentListeners: ((students: Student[]) => void)[] = [];

  private notifyStudentListeners(students: Student[]) {
    this.studentListeners.forEach((cb) => {
      try {
        cb(students);
      } catch (err) {
        console.error('Error in student listener:', err);
      }
    });
  }

  subscribeStudents(callback: (students: Student[]) => void) {
    this.studentListeners.push(callback);
    const initial = getLocalCache<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    callback(initial);

    try {
      const q = query(collection(db, 'students'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: Student[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as Student));
          setLocalCache(STORAGE_KEYS.STUDENTS, list);
          this.notifyStudentListeners(list);
        } else {
          this.notifyStudentListeners(initial);
        }
      }, (err) => {
        console.warn('Students listener offline fallback:', err);
        this.notifyStudentListeners(initial);
      });

      return () => {
        unsub();
        this.studentListeners = this.studentListeners.filter(cb => cb !== callback);
      };
    } catch {
      return () => {
        this.studentListeners = this.studentListeners.filter(cb => cb !== callback);
      };
    }
  }

  async addStudent(student: Student) {
    const current = getLocalCache<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const updated = [student, ...current];
    setLocalCache(STORAGE_KEYS.STUDENTS, updated);
    this.notifyStudentListeners(updated);

    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (err) {
      console.warn('Failed to add student to firestore:', err);
    }
  }

  async addStudentsBatch(newStudents: Student[]) {
    if (!newStudents || newStudents.length === 0) return;
    const current = getLocalCache<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const updated = [...newStudents, ...current];
    setLocalCache(STORAGE_KEYS.STUDENTS, updated);
    this.notifyStudentListeners(updated);

    try {
      for (const stu of newStudents) {
        await setDoc(doc(db, 'students', stu.id), stu);
      }
    } catch (err) {
      console.warn('Failed to batch save students to firestore:', err);
    }
  }

  async updateStudent(student: Student) {
    const current = getLocalCache<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const updated = current.map(s => s.id === student.id ? student : s);
    setLocalCache(STORAGE_KEYS.STUDENTS, updated);
    this.notifyStudentListeners(updated);

    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (err) {
      console.warn('Failed to update student in firestore:', err);
    }
  }

  async deleteStudent(studentId: string) {
    const current = getLocalCache<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const updated = current.filter(s => s.id !== studentId);
    setLocalCache(STORAGE_KEYS.STUDENTS, updated);
    this.notifyStudentListeners(updated);

    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (err) {
      console.warn('Failed to delete student in firestore:', err);
    }
  }

  // Reset Student Points (Kembali ke 0)
  async resetStudentPoints(studentId: string, newPoints: number = 0) {
    const current = getLocalCache<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const updated = current.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          totalPoints: newPoints,
          completedChapters: 0,
          averageScore: 0,
          badges: [],
        };
      }
      return s;
    });
    setLocalCache(STORAGE_KEYS.STUDENTS, updated);
    this.notifyStudentListeners(updated);

    try {
      const target = updated.find(s => s.id === studentId);
      if (target) {
        await setDoc(doc(db, 'students', studentId), target);
      }
    } catch (err) {
      console.warn('Failed to reset student points in firestore:', err);
    }
  }

  // Reset All Students Points in a Class (Kembali ke 0)
  async resetClassPoints(classId: string, newPoints: number = 0) {
    const current = getLocalCache<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const updated = current.map(s => {
      if (s.classId === classId) {
        return {
          ...s,
          totalPoints: newPoints,
          completedChapters: 0,
          averageScore: 0,
          badges: [],
        };
      }
      return s;
    });
    setLocalCache(STORAGE_KEYS.STUDENTS, updated);
    this.notifyStudentListeners(updated);

    try {
      for (const s of updated.filter(stu => stu.classId === classId)) {
        await setDoc(doc(db, 'students', s.id), s);
      }
    } catch (err) {
      console.warn('Failed to reset class points in firestore:', err);
    }
  }

  // --- CHAPTERS ---
  private chapterListeners: ((chapters: Chapter[]) => void)[] = [];

  private notifyChapterListeners(chapters: Chapter[]) {
    this.chapterListeners.forEach((cb) => {
      try {
        cb(chapters);
      } catch (err) {
        console.error('Error in chapter listener:', err);
      }
    });
  }

  subscribeChapters(callback: (chapters: Chapter[]) => void) {
    this.chapterListeners.push(callback);
    const deletedIds = new Set(getLocalCache<string[]>('DELETED_CHAPTER_IDS', []));
    const rawInitial = getLocalCache<Chapter[]>(STORAGE_KEYS.CHAPTERS, INITIAL_CHAPTERS).filter(c => !deletedIds.has(c.id));
    const initial = rawInitial.map(c => {
      const initMatch = INITIAL_CHAPTERS.find(ic => ic.id === c.id);
      return {
        ...c,
        teacherId: c.teacherId || initMatch?.teacherId || 'teacher-1',
        teacherName: c.teacherName || initMatch?.teacherName || 'Guru Pengajar',
        assignedClassIds: (c.assignedClassIds && c.assignedClassIds.length > 0) ? c.assignedClassIds : (initMatch?.assignedClassIds || [c.classId]),
      };
    });
    callback(initial);

    try {
      const q = query(collection(db, 'chapters'));
      const unsubFirestore = onSnapshot(q, (snapshot) => {
        const deletedIdsCurrent = new Set(getLocalCache<string[]>('DELETED_CHAPTER_IDS', []));
        if (!snapshot.empty) {
          const firestoreList: Chapter[] = [];
          snapshot.forEach((docSnap) => {
            const chap = docSnap.data() as Chapter;
            if (!deletedIdsCurrent.has(chap.id)) {
              firestoreList.push(chap);
            }
          });
          
          // Merge local cache with Firestore so newly created/edited chapters are never erased
          const localList = getLocalCache<Chapter[]>(STORAGE_KEYS.CHAPTERS, INITIAL_CHAPTERS)
            .filter(c => !deletedIdsCurrent.has(c.id))
            .map(c => {
              const initMatch = INITIAL_CHAPTERS.find(ic => ic.id === c.id);
              return {
                ...c,
                teacherId: c.teacherId || initMatch?.teacherId || 'teacher-1',
                teacherName: c.teacherName || initMatch?.teacherName || 'Guru Pengajar',
                assignedClassIds: (c.assignedClassIds && c.assignedClassIds.length > 0) ? c.assignedClassIds : (initMatch?.assignedClassIds || [c.classId]),
              };
            });

          const map = new Map<string, Chapter>();
          firestoreList.forEach(c => map.set(c.id, c));
          localList.forEach(c => {
            if (!map.has(c.id) && !deletedIdsCurrent.has(c.id)) {
              map.set(c.id, c);
            }
          });
          const merged = Array.from(map.values()).sort((a, b) => a.order - b.order);
          setLocalCache(STORAGE_KEYS.CHAPTERS, merged);
          this.notifyChapterListeners(merged);
        } else {
          const localList = getLocalCache<Chapter[]>(STORAGE_KEYS.CHAPTERS, INITIAL_CHAPTERS)
            .filter(c => !deletedIdsCurrent.has(c.id))
            .map(c => {
              const initMatch = INITIAL_CHAPTERS.find(ic => ic.id === c.id);
              return {
                ...c,
                teacherId: c.teacherId || initMatch?.teacherId || 'teacher-1',
                teacherName: c.teacherName || initMatch?.teacherName || 'Guru Pengajar',
                assignedClassIds: (c.assignedClassIds && c.assignedClassIds.length > 0) ? c.assignedClassIds : (initMatch?.assignedClassIds || [c.classId]),
              };
            });
          this.notifyChapterListeners(localList);
        }
      }, (err) => {
        console.warn('Chapters listener offline fallback:', err);
        const deletedIdsFallback = new Set(getLocalCache<string[]>('DELETED_CHAPTER_IDS', []));
        const localList = getLocalCache<Chapter[]>(STORAGE_KEYS.CHAPTERS, INITIAL_CHAPTERS)
          .filter(c => !deletedIdsFallback.has(c.id))
          .map(c => {
            const initMatch = INITIAL_CHAPTERS.find(ic => ic.id === c.id);
            return {
              ...c,
              teacherId: c.teacherId || initMatch?.teacherId || 'teacher-1',
              teacherName: c.teacherName || initMatch?.teacherName || 'Guru Pengajar',
              assignedClassIds: (c.assignedClassIds && c.assignedClassIds.length > 0) ? c.assignedClassIds : (initMatch?.assignedClassIds || [c.classId]),
            };
          });
        this.notifyChapterListeners(localList);
      });

      return () => {
        unsubFirestore();
        this.chapterListeners = this.chapterListeners.filter(cb => cb !== callback);
      };
    } catch {
      return () => {
        this.chapterListeners = this.chapterListeners.filter(cb => cb !== callback);
      };
    }
  }

  async saveChapter(chapter: Chapter) {
    // Remove from deleted tracking if re-saving
    const deletedIds = getLocalCache<string[]>('DELETED_CHAPTER_IDS', []).filter(id => id !== chapter.id);
    setLocalCache('DELETED_CHAPTER_IDS', deletedIds);

    const current = getLocalCache<Chapter[]>(STORAGE_KEYS.CHAPTERS, INITIAL_CHAPTERS)
      .filter(c => c.id !== chapter.id && !deletedIds.includes(c.id));
    const updated = [...current, chapter];
    updated.sort((a, b) => a.order - b.order);
    setLocalCache(STORAGE_KEYS.CHAPTERS, updated);
    this.notifyChapterListeners(updated);

    try {
      const sanitized = cleanForFirestore(chapter);
      await setDoc(doc(db, 'chapters', chapter.id), sanitized);
    } catch (err) {
      console.warn('Failed to save chapter in firestore (retained locally):', err);
    }
  }

  async deleteChapter(chapterId: string) {
    // Add to deleted tracking so it never resurrects
    const deletedIds = getLocalCache<string[]>('DELETED_CHAPTER_IDS', []);
    if (!deletedIds.includes(chapterId)) {
      setLocalCache('DELETED_CHAPTER_IDS', [...deletedIds, chapterId]);
    }

    const current = getLocalCache<Chapter[]>(STORAGE_KEYS.CHAPTERS, INITIAL_CHAPTERS);
    const updated = current.filter(c => c.id !== chapterId);
    setLocalCache(STORAGE_KEYS.CHAPTERS, updated);
    this.notifyChapterListeners(updated);

    // Also clean up any progress related to this chapter
    const currentProg = getLocalCache<StudentProgress[]>(STORAGE_KEYS.PROGRESS, INITIAL_PROGRESS);
    const updatedProg = currentProg.filter(p => p.chapterId !== chapterId);
    setLocalCache(STORAGE_KEYS.PROGRESS, updatedProg);
    this.notifyProgressListeners(updatedProg);

    try {
      await deleteDoc(doc(db, 'chapters', chapterId));
    } catch (err) {
      console.warn('Failed to delete chapter in firestore:', err);
    }
  }

  // --- PROGRESS ---
  private progressListeners: ((progressList: StudentProgress[]) => void)[] = [];

  private notifyProgressListeners(progressList: StudentProgress[]) {
    this.progressListeners.forEach((cb) => {
      try {
        cb(progressList);
      } catch (err) {
        console.error('Error in progress listener:', err);
      }
    });
  }

  subscribeProgress(callback: (progressList: StudentProgress[]) => void) {
    this.progressListeners.push(callback);
    const initial = getLocalCache<StudentProgress[]>(STORAGE_KEYS.PROGRESS, INITIAL_PROGRESS);
    callback(initial);

    try {
      const q = query(collection(db, 'progress'));
      const unsubFirestore = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: StudentProgress[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as StudentProgress));
          setLocalCache(STORAGE_KEYS.PROGRESS, list);
          this.notifyProgressListeners(list);
        } else {
          callback(initial);
        }
      }, (err) => {
        console.warn('Progress listener offline fallback:', err);
        callback(initial);
      });

      return () => {
        this.progressListeners = this.progressListeners.filter(cb => cb !== callback);
        if (unsubFirestore) unsubFirestore();
      };
    } catch {
      return () => {
        this.progressListeners = this.progressListeners.filter(cb => cb !== callback);
      };
    }
  }

  async updateProgress(prog: StudentProgress) {
    const current = getLocalCache<StudentProgress[]>(STORAGE_KEYS.PROGRESS, INITIAL_PROGRESS);
    const exists = current.some(p => p.id === prog.id);
    const updated = exists ? current.map(p => p.id === prog.id ? prog : p) : [...current, prog];
    setLocalCache(STORAGE_KEYS.PROGRESS, updated);
    this.notifyProgressListeners(updated);

    try {
      await setDoc(doc(db, 'progress', prog.id), prog);
    } catch (err) {
      console.warn('Failed to save progress in firestore:', err);
    }
  }

  // Reset Student Progress (Latihan Soal, Game Edukasi, Asesmen Akhir, atau Semua)
  async resetStudentProgress(
    studentId: string, 
    chapterId: string, 
    target: 'all' | 'quiz' | 'game' | 'assessment' | 'material',
    resetPoints: boolean = true
  ) {
    const current = getLocalCache<StudentProgress[]>(STORAGE_KEYS.PROGRESS, INITIAL_PROGRESS);
    const foundIndex = current.findIndex(p => p.studentId === studentId && p.chapterId === chapterId);
    
    let resetItem: StudentProgress;
    let updated: StudentProgress[];

    if (foundIndex >= 0) {
      resetItem = { ...current[foundIndex] };
    } else {
      // Find classId from student if available
      const students = getLocalCache<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      const student = students.find(s => s.id === studentId);
      resetItem = {
        id: `${studentId}_${chapterId}`,
        studentId,
        chapterId,
        classId: student?.classId || 'class-ipa-7a',
        materialCompleted: false,
        quizCompleted: false,
        gameCompleted: false,
        assessmentCompleted: false,
        isUnlocked: true,
      };
    }

    if (target === 'quiz' || target === 'all') {
      resetItem.quizCompleted = false;
      delete resetItem.quizScore;
      delete resetItem.quizPassed;
      delete resetItem.quizCompletedAt;
    }
    if (target === 'game' || target === 'all') {
      resetItem.gameCompleted = false;
      delete resetItem.gameScore;
      delete resetItem.gameCompletedAt;
    }
    if (target === 'assessment' || target === 'all') {
      resetItem.assessmentCompleted = false;
      delete resetItem.assessmentScore;
      delete resetItem.assessmentPassed;
      delete resetItem.assessmentCompletedAt;
    }
    if (target === 'material' || target === 'all') {
      resetItem.materialCompleted = false;
      delete resetItem.materialCompletedAt;
      delete resetItem.readingScore;
      delete resetItem.readingCheckCompleted;
    }

    if (foundIndex >= 0) {
      current[foundIndex] = resetItem;
      updated = [...current];
    } else {
      updated = [...current, resetItem];
    }

    setLocalCache(STORAGE_KEYS.PROGRESS, updated);
    this.notifyProgressListeners(updated);

    try {
      await setDoc(doc(db, 'progress', resetItem.id), resetItem);
    } catch (err) {
      console.warn('Failed to reset progress in firestore:', err);
    }

    // Reset student points to 0 if requested
    if (resetPoints) {
      await this.resetStudentPoints(studentId, 0);
    }
  }

  // Bulk Reset All Students in a Class for a Chapter
  async resetClassChapterProgress(
    classId: string, 
    chapterId: string, 
    target: 'all' | 'quiz' | 'game' | 'assessment' | 'material',
    resetPoints: boolean = true
  ) {
    const current = getLocalCache<StudentProgress[]>(STORAGE_KEYS.PROGRESS, INITIAL_PROGRESS);
    const students = getLocalCache<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const classStudentIds = new Set(students.filter(s => s.classId === classId).map(s => s.id));

    // Reset existing progress records
    const updated = current.map(prog => {
      const match = (prog.classId === classId || classStudentIds.has(prog.studentId)) && prog.chapterId === chapterId;
      if (match) {
        const resetItem: StudentProgress = { ...prog };
        if (target === 'quiz' || target === 'all') {
          resetItem.quizCompleted = false;
          delete resetItem.quizScore;
          delete resetItem.quizPassed;
          delete resetItem.quizCompletedAt;
        }
        if (target === 'game' || target === 'all') {
          resetItem.gameCompleted = false;
          delete resetItem.gameScore;
          delete resetItem.gameCompletedAt;
        }
        if (target === 'assessment' || target === 'all') {
          resetItem.assessmentCompleted = false;
          delete resetItem.assessmentScore;
          delete resetItem.assessmentPassed;
          delete resetItem.assessmentCompletedAt;
        }
        if (target === 'material' || target === 'all') {
          resetItem.materialCompleted = false;
          delete resetItem.materialCompletedAt;
          delete resetItem.readingScore;
          delete resetItem.readingCheckCompleted;
        }
        return resetItem;
      }
      return prog;
    });

    setLocalCache(STORAGE_KEYS.PROGRESS, updated);
    this.notifyProgressListeners(updated);

    try {
      for (const prog of updated.filter(p => (p.classId === classId || classStudentIds.has(p.studentId)) && p.chapterId === chapterId)) {
        await setDoc(doc(db, 'progress', prog.id), prog);
      }
    } catch (err) {
      console.warn('Failed to bulk reset in firestore:', err);
    }

    // Reset class points to 0 if requested
    if (resetPoints) {
      await this.resetClassPoints(classId, 0);
    }
  }

  // --- NOTIFICATIONS ---
  subscribeNotifications(teacherId: string, callback: (notifications: NotificationItem[]) => void) {
    const initial = getLocalCache<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    callback(initial);

    try {
      const q = query(collection(db, 'notifications'));
      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: NotificationItem[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as NotificationItem));
          list.sort((a, b) => b.timestamp - a.timestamp);
          setLocalCache(STORAGE_KEYS.NOTIFICATIONS, list);
          callback(list);
        } else {
          callback(initial);
        }
      }, (err) => {
        console.warn('Notifications listener offline fallback:', err);
        callback(initial);
      });
    } catch {
      return () => {};
    }
  }

  async sendNotification(notif: NotificationItem) {
    const current = getLocalCache<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = [notif, ...current];
    setLocalCache(STORAGE_KEYS.NOTIFICATIONS, updated);

    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (err) {
      console.warn('Failed to send notification to firestore:', err);
    }
  }

  async markNotificationRead(notifId: string) {
    const current = getLocalCache<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = current.map(n => n.id === notifId ? { ...n, read: true } : n);
    setLocalCache(STORAGE_KEYS.NOTIFICATIONS, updated);

    try {
      const target = updated.find(n => n.id === notifId);
      if (target) {
        await setDoc(doc(db, 'notifications', notifId), target);
      }
    } catch (err) {
      console.warn('Failed to mark notification read in firestore:', err);
    }
  }

  async markAllNotificationsRead() {
    const current = getLocalCache<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = current.map(n => ({ ...n, read: true }));
    setLocalCache(STORAGE_KEYS.NOTIFICATIONS, updated);

    try {
      for (const n of updated) {
        await setDoc(doc(db, 'notifications', n.id), n);
      }
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  }

  // --- CHAT ---
  subscribeChat(classId: string, callback: (messages: ChatMessage[]) => void) {
    const initial = getLocalCache<ChatMessage[]>(STORAGE_KEYS.CHAT, INITIAL_CHAT)
      .filter(m => m.classId === classId);
    callback(initial);

    try {
      const q = query(collection(db, 'chat'));
      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: ChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ChatMessage;
            if (data.classId === classId) {
              list.push(data);
            }
          });
          list.sort((a, b) => a.timestamp - b.timestamp);
          
          const allCached = getLocalCache<ChatMessage[]>(STORAGE_KEYS.CHAT, INITIAL_CHAT);
          const merged = [...allCached.filter(m => m.classId !== classId), ...list];
          setLocalCache(STORAGE_KEYS.CHAT, merged);
          
          callback(list);
        } else {
          callback(initial);
        }
      }, (err) => {
        console.warn('Chat listener offline fallback:', err);
        callback(initial);
      });
    } catch {
      return () => {};
    }
  }

  // Subscribe to all direct Q&A messages involving a specific teacher (for Teacher inbox)
  subscribeTeacherDirectMessages(teacherId: string, callback: (messages: ChatMessage[]) => void) {
    const allCached = getLocalCache<ChatMessage[]>(STORAGE_KEYS.CHAT, INITIAL_CHAT);
    const initial = allCached.filter(m => 
      m.recipientId === teacherId || 
      (m.classId && m.classId.startsWith('direct_') && m.classId.includes(teacherId))
    ).sort((a, b) => a.timestamp - b.timestamp);
    callback(initial);

    try {
      const q = query(collection(db, 'chat'));
      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: ChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ChatMessage;
            if (
              data.recipientId === teacherId || 
              (data.classId && data.classId.startsWith('direct_') && data.classId.includes(teacherId))
            ) {
              list.push(data);
            }
          });
          list.sort((a, b) => a.timestamp - b.timestamp);
          callback(list);
        } else {
          callback(initial);
        }
      }, (err) => {
        console.warn('Teacher direct chat listener fallback:', err);
        callback(initial);
      });
    } catch {
      return () => {};
    }
  }

  async sendChatMessage(msg: ChatMessage) {
    const allCached = getLocalCache<ChatMessage[]>(STORAGE_KEYS.CHAT, INITIAL_CHAT);
    const updated = [...allCached, msg];
    setLocalCache(STORAGE_KEYS.CHAT, updated);

    try {
      await setDoc(doc(db, 'chat', msg.id), msg);
    } catch (err) {
      console.warn('Failed to send chat message:', err);
    }
  }

  // --- RECOMMENDATIONS ---
  subscribeRecommendations(studentId: string | null, callback: (recs: PersonalRecommendation[]) => void) {
    const initial = getLocalCache<PersonalRecommendation[]>(STORAGE_KEYS.RECOMMENDATIONS, INITIAL_RECOMMENDATIONS);
    const filtered = studentId ? initial.filter(r => r.studentId === studentId) : initial;
    callback(filtered);

    try {
      const q = query(collection(db, 'recommendations'));
      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: PersonalRecommendation[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as PersonalRecommendation));
          list.sort((a, b) => b.createdAt - a.createdAt);
          setLocalCache(STORAGE_KEYS.RECOMMENDATIONS, list);
          callback(studentId ? list.filter(r => r.studentId === studentId) : list);
        } else {
          callback(filtered);
        }
      }, (err) => {
        console.warn('Recommendations listener offline fallback:', err);
        callback(filtered);
      });
    } catch {
      return () => {};
    }
  }

  async addRecommendation(rec: PersonalRecommendation) {
    const current = getLocalCache<PersonalRecommendation[]>(STORAGE_KEYS.RECOMMENDATIONS, INITIAL_RECOMMENDATIONS);
    const updated = [rec, ...current];
    setLocalCache(STORAGE_KEYS.RECOMMENDATIONS, updated);

    try {
      await setDoc(doc(db, 'recommendations', rec.id), rec);
    } catch (err) {
      console.warn('Failed to add recommendation in firestore:', err);
    }
  }

  async updateRecommendationStatus(recId: string, status: 'baru' | 'dibaca' | 'selesai') {
    const current = getLocalCache<PersonalRecommendation[]>(STORAGE_KEYS.RECOMMENDATIONS, INITIAL_RECOMMENDATIONS);
    const updated = current.map(r => r.id === recId ? { ...r, status } : r);
    setLocalCache(STORAGE_KEYS.RECOMMENDATIONS, updated);

    try {
      const target = updated.find(r => r.id === recId);
      if (target) {
        await setDoc(doc(db, 'recommendations', recId), target);
      }
    } catch (err) {
      console.warn('Failed to update recommendation in firestore:', err);
    }
  }

  // --- TEACHERS ---
  private teacherListeners: ((teachers: TeacherItem[]) => void)[] = [];

  private notifyTeacherListeners(teachers: TeacherItem[]) {
    this.teacherListeners.forEach((cb) => {
      try {
        cb(teachers);
      } catch (err) {
        console.error('Error in teacher listener:', err);
      }
    });
  }

  subscribeTeachers(callback: (teachers: TeacherItem[]) => void) {
    this.teacherListeners.push(callback);
    const cached = getLocalCache<TeacherItem[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    // Sanitize: Only show Guru Utama and teachers added by the admin / Guru Utama (exclude old mock teacher-1 and teacher-2)
    const sanitizedInitial = cached.filter(t => t.id === 'teacher-main' || (t.id !== 'teacher-1' && t.id !== 'teacher-2'));
    if (!sanitizedInitial.some(t => t.id === 'teacher-main')) {
      sanitizedInitial.unshift(INITIAL_TEACHERS[0]);
    }
    setLocalCache(STORAGE_KEYS.TEACHERS, sanitizedInitial);
    callback(sanitizedInitial);

    try {
      const q = query(collection(db, 'teachers'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: TeacherItem[] = [];
          snapshot.forEach((docSnap) => {
            const t = docSnap.data() as TeacherItem;
            // Only keep Guru Utama and teachers added by admin (exclude mock teacher-1 and teacher-2)
            if (t.id === 'teacher-main' || (t.id !== 'teacher-1' && t.id !== 'teacher-2')) {
              list.push(t);
            }
          });
          // Always ensure Guru Utama is present and at the top
          if (!list.some(t => t.id === 'teacher-main')) {
            list.unshift(INITIAL_TEACHERS[0]);
          }
          list.sort((a, b) => (b.isMainTeacher ? 1 : 0) - (a.isMainTeacher ? 1 : 0));
          setLocalCache(STORAGE_KEYS.TEACHERS, list);
          this.notifyTeacherListeners(list);
        } else {
          this.notifyTeacherListeners(sanitizedInitial);
        }
      }, (err) => {
        console.warn('Teachers listener offline fallback:', err);
        this.notifyTeacherListeners(sanitizedInitial);
      });

      return () => {
        unsub();
        this.teacherListeners = this.teacherListeners.filter(cb => cb !== callback);
      };
    } catch {
      return () => {
        this.teacherListeners = this.teacherListeners.filter(cb => cb !== callback);
      };
    }
  }

  async addTeacher(teacher: TeacherItem) {
    const current = getLocalCache<TeacherItem[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS)
      .filter(t => t.id === 'teacher-main' || (t.id !== 'teacher-1' && t.id !== 'teacher-2'));
    const updated = [...current, teacher];
    setLocalCache(STORAGE_KEYS.TEACHERS, updated);
    this.notifyTeacherListeners(updated);

    try {
      await setDoc(doc(db, 'teachers', teacher.id), teacher);
    } catch (err) {
      console.warn('Failed to add teacher to firestore:', err);
    }
  }

  async updateTeacher(teacher: TeacherItem) {
    const current = getLocalCache<TeacherItem[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS)
      .filter(t => t.id === 'teacher-main' || (t.id !== 'teacher-1' && t.id !== 'teacher-2'));
    const updated = current.map(t => t.id === teacher.id ? teacher : t);
    setLocalCache(STORAGE_KEYS.TEACHERS, updated);
    this.notifyTeacherListeners(updated);

    try {
      await setDoc(doc(db, 'teachers', teacher.id), teacher);
    } catch (err) {
      console.warn('Failed to update teacher in firestore:', err);
    }
  }

  async deleteTeacher(teacherId: string) {
    const current = getLocalCache<TeacherItem[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const updated = current.filter(t => t.id !== teacherId);
    setLocalCache(STORAGE_KEYS.TEACHERS, updated);
    this.notifyTeacherListeners(updated);

    try {
      await deleteDoc(doc(db, 'teachers', teacherId));
    } catch (err) {
      console.warn('Failed to delete teacher from firestore:', err);
    }
  }

  getTeachers(): TeacherItem[] {
    const cached = getLocalCache<TeacherItem[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    return cached.filter(t => t.id === 'teacher-main' || (t.id !== 'teacher-1' && t.id !== 'teacher-2'));
  }

  // Update Guru Utama (Admin) email, password, and profile
  async updateMainTeacherCredentials(data: { email: string; password?: string; name?: string; nip?: string }) {
    const current = getLocalCache<TeacherItem[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const mainTeacher = current.find(t => t.isMainTeacher || t.id === 'teacher-main') || INITIAL_TEACHERS[0];
    
    const updatedMain: TeacherItem = {
      ...mainTeacher,
      email: data.email.trim(),
      password: data.password ? data.password.trim() : mainTeacher.password,
      name: data.name ? data.name.trim() : mainTeacher.name,
      nip: data.nip !== undefined ? data.nip.trim() : mainTeacher.nip,
    };

    const updatedList = current.map(t => (t.id === updatedMain.id || t.isMainTeacher) ? updatedMain : t);
    if (!updatedList.some(t => t.id === updatedMain.id)) {
      updatedList.unshift(updatedMain);
    }
    setLocalCache(STORAGE_KEYS.TEACHERS, updatedList);
    this.notifyTeacherListeners(updatedList);

    try {
      await setDoc(doc(db, 'teachers', updatedMain.id), updatedMain);
    } catch (err) {
      console.warn('Failed to update main teacher credentials in firestore:', err);
    }
    return updatedMain;
  }

  // --- SCHOOL SETTINGS ---
  private schoolSettingsListeners: ((settings: SchoolSettings) => void)[] = [];

  private notifySchoolSettingsListeners(settings: SchoolSettings) {
    this.schoolSettingsListeners.forEach((cb) => {
      try {
        cb(settings);
      } catch (err) {
        console.error('Error in school settings listener:', err);
      }
    });
  }

  getSchoolSettings(): SchoolSettings {
    return getLocalCache<SchoolSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SCHOOL_SETTINGS);
  }

  subscribeSchoolSettings(callback: (settings: SchoolSettings) => void) {
    this.schoolSettingsListeners.push(callback);
    const initial = this.getSchoolSettings();
    callback(initial);

    try {
      const unsub = onSnapshot(doc(db, 'settings', 'school'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SchoolSettings;
          setLocalCache(STORAGE_KEYS.SETTINGS, data);
          this.notifySchoolSettingsListeners(data);
        } else {
          this.notifySchoolSettingsListeners(initial);
        }
      }, (err) => {
        console.warn('School settings firestore fallback:', err);
        this.notifySchoolSettingsListeners(initial);
      });

      return () => {
        unsub();
        this.schoolSettingsListeners = this.schoolSettingsListeners.filter(cb => cb !== callback);
      };
    } catch {
      return () => {
        this.schoolSettingsListeners = this.schoolSettingsListeners.filter(cb => cb !== callback);
      };
    }
  }

  async updateSchoolSettings(newSettings: Partial<SchoolSettings>) {
    const current = this.getSchoolSettings();
    const updated: SchoolSettings = {
      ...current,
      ...newSettings,
      updatedAt: Date.now(),
    };
    setLocalCache(STORAGE_KEYS.SETTINGS, updated);
    this.notifySchoolSettingsListeners(updated);

    try {
      await setDoc(doc(db, 'settings', 'school'), updated);
    } catch (err) {
      console.warn('Failed to update school settings in firestore:', err);
    }

    // Also update document title dynamically
    if (updated.schoolName && typeof document !== 'undefined') {
      document.title = `LMS ${updated.schoolName}`;
    }

    return updated;
  }

  validateTeacherLogin(identifier: string, pass: string): { success: boolean; teacher?: TeacherItem; message?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    const teachers = this.getTeachers();
    const mainTeacher = teachers.find(t => t.isMainTeacher || t.id === 'teacher-main') || INITIAL_TEACHERS[0];
    const mainEmail = (mainTeacher.email || 'kegiatanm3b@gmail.com').trim().toLowerCase();
    const mainPassword = (mainTeacher.password || 'Guru-13531').trim();

    // 1. Check Guru Utama (Admin) with current password OR original master fallback
    const isMainPassMatch = cleanPass === mainPassword || cleanPass === 'Guru-13531';
    const isMainIdMatch = cleanId === mainEmail || cleanId === 'kegiatanm3b@gmail.com' || cleanId === '' || mainTeacher.name.toLowerCase().includes(cleanId);

    if (isMainPassMatch && isMainIdMatch) {
      return { success: true, teacher: mainTeacher };
    }

    // 2. Check other teachers in registry (added by admin)
    const found = teachers.find(t => 
      !t.isMainTeacher &&
      (t.email.toLowerCase() === cleanId || 
       (t.nip && t.nip === cleanId) || 
       t.name.toLowerCase().includes(cleanId)) &&
      (t.password === cleanPass || (!t.password && cleanPass === 'guru123'))
    );

    if (found) {
      if (found.status === 'nonaktif') {
        return { success: false, message: 'Akun guru ini dinonaktifkan. Hubungi Guru Utama untuk aktivasi.' };
      }
      return { success: true, teacher: found };
    }

    // If identifier is Guru Utama email but wrong password
    if (cleanId === mainEmail || cleanId === 'kegiatanm3b@gmail.com') {
      return { 
        success: false, 
        message: 'Password Guru Utama salah! Silakan periksa kembali kata sandi Guru Utama Anda.' 
      };
    }

    return { 
      success: false, 
      message: 'Email/NIP atau kata sandi tidak cocok. Silakan periksa kembali data Anda.' 
    };
  }
}

export const lmsService = new LmsService();
