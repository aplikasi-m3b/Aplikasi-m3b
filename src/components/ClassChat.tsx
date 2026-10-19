import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageSquare, 
  User, 
  Sparkles, 
  Clock,
  HelpCircle,
  Smile,
  Users,
  ChevronDown,
  CheckCircle2,
  Lock,
  UserCheck,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  MessageCircleQuestion,
  Inbox
} from 'lucide-react';
import { ChatMessage, UserSession, ClassItem, TeacherItem } from '../types';
import { lmsService } from '../services/lmsService';

interface ClassChatProps {
  currentClass: ClassItem;
  allClasses?: ClassItem[];
  currentUser: UserSession;
  teachers?: TeacherItem[];
  onSelectClass?: (cls: ClassItem) => void;
}

export const ClassChat: React.FC<ClassChatProps> = ({
  currentClass,
  allClasses = [],
  currentUser,
  teachers = [],
  onSelectClass,
}) => {
  // If teacher, they can switch between classes
  const [selectedClassId, setSelectedClassId] = useState<string>(currentClass?.id || '');
  
  // Tabs: 'class' (Diskusi Kelas) vs 'direct' (Tanya Guru / Pesan Siswa)
  const [chatMode, setChatMode] = useState<'class' | 'direct'>('class');

  // Direct chat states
  const [availableTeachers, setAvailableTeachers] = useState<TeacherItem[]>(teachers);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedStudentForTeacher, setSelectedStudentForTeacher] = useState<string>(''); // For teacher view of incoming student chats

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync selectedClassId with currentClass
  useEffect(() => {
    if (currentClass?.id && currentClass.id !== selectedClassId && !selectedClassId) {
      setSelectedClassId(currentClass.id);
    }
  }, [currentClass?.id]);

  // Load teachers if not passed
  useEffect(() => {
    if (teachers.length > 0) {
      setAvailableTeachers(teachers);
    } else {
      const unsub = lmsService.subscribeTeachers((list) => {
        setAvailableTeachers(list);
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, [teachers]);

  // Default selected teacher for student direct chat
  useEffect(() => {
    if (availableTeachers.length > 0 && !selectedTeacherId) {
      // Prefer Guru Utama or first teacher
      const main = availableTeachers.find(t => t.isMainTeacher) || availableTeachers[0];
      if (main) setSelectedTeacherId(main.id);
    }
  }, [availableTeachers, selectedTeacherId]);

  // Active class object
  const activeClass = (allClasses.length > 0 ? allClasses.find(c => c.id === selectedClassId) : null) || currentClass;

  // Active channel/room ID depending on mode
  const activeRoomId = chatMode === 'class'
    ? activeClass?.id
    : (currentUser.role === 'siswa'
        ? `direct_${selectedTeacherId || 'main'}_${currentUser.id}`
        : `direct_${currentUser.id}_${selectedStudentForTeacher}`);

  // Subscribe to Class Chat
  useEffect(() => {
    if (chatMode === 'class' && activeClass?.id) {
      const unsubscribe = lmsService.subscribeChat(activeClass.id, (msgs) => {
        setMessages(msgs);
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [chatMode, activeClass?.id]);

  // Subscribe to Direct Chat messages
  useEffect(() => {
    if (chatMode === 'direct') {
      if (currentUser.role === 'siswa' && selectedTeacherId) {
        const roomId = `direct_${selectedTeacherId}_${currentUser.id}`;
        const unsubscribe = lmsService.subscribeChat(roomId, (msgs) => {
          setDirectMessages(msgs);
        });
        return () => {
          if (unsubscribe) unsubscribe();
        };
      } else if (currentUser.role === 'guru') {
        const unsubscribe = lmsService.subscribeTeacherDirectMessages(currentUser.id, (msgs) => {
          setDirectMessages(msgs);
          // If no student is selected yet, select the first student who sent a message
          if (!selectedStudentForTeacher && msgs.length > 0) {
            const firstStuMsg = msgs.find(m => m.senderRole === 'siswa');
            if (firstStuMsg) {
              setSelectedStudentForTeacher(firstStuMsg.senderId);
            }
          }
        });
        return () => {
          if (unsubscribe) unsubscribe();
        };
      }
    }
  }, [chatMode, currentUser.role, currentUser.id, selectedTeacherId, selectedStudentForTeacher]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, directMessages, chatMode, selectedTeacherId, selectedStudentForTeacher]);

  // Rule verification: Can the student send message in class chat?
  // "Siswa juga hanya bisa membalas chat guru yang mulai chat dahulu."
  const hasTeacherStartedClassChat = messages.some(m => m.senderRole === 'guru');
  const isStudentInClassChat = currentUser.role === 'siswa' && chatMode === 'class';
  const canSendClassMessage = !isStudentInClassChat || hasTeacherStartedClassChat;

  // Handle class selection
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const target = allClasses.find(c => c.id === newClassId);
    if (target && onSelectClass) {
      onSelectClass(target);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (chatMode === 'class') {
      if (!canSendClassMessage) return;

      const newMsg: ChatMessage = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        classId: activeClass.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        avatar: currentUser.avatar,
        text: inputText.trim(),
        timestamp: Date.now(),
      };

      setInputText('');
      await lmsService.sendChatMessage(newMsg);
    } else {
      // Direct Q&A mode
      if (currentUser.role === 'siswa') {
        const targetTeacher = availableTeachers.find(t => t.id === selectedTeacherId);
        const roomId = `direct_${selectedTeacherId}_${currentUser.id}`;
        const newMsg: ChatMessage = {
          id: `chat-direct-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          classId: roomId,
          recipientId: selectedTeacherId,
          recipientName: targetTeacher?.name || 'Guru',
          studentClassId: currentClass.id,
          studentClassName: currentClass.name,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: 'siswa',
          avatar: currentUser.avatar,
          text: inputText.trim(),
          timestamp: Date.now(),
        };
        setInputText('');
        await lmsService.sendChatMessage(newMsg);
      } else {
        // Teacher replying to student
        if (!selectedStudentForTeacher) return;
        const roomId = `direct_${currentUser.id}_${selectedStudentForTeacher}`;
        const newMsg: ChatMessage = {
          id: `chat-direct-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          classId: roomId,
          recipientId: selectedStudentForTeacher,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: 'guru',
          avatar: currentUser.avatar,
          text: inputText.trim(),
          timestamp: Date.now(),
        };
        setInputText('');
        await lmsService.sendChatMessage(newMsg);
      }
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Group incoming messages for teacher in direct mode
  const uniqueStudentsInDirectChat = Array.from(
    new Set(directMessages.filter(m => m.senderRole === 'siswa').map(m => m.senderId))
  ).map(studentId => {
    const studentMsgs = directMessages.filter(m => m.senderId === studentId);
    const lastMsg = studentMsgs[studentMsgs.length - 1];
    return {
      studentId,
      studentName: lastMsg.senderName,
      className: lastMsg.studentClassName || 'Siswa',
      lastMessage: lastMsg.text,
      lastTimestamp: lastMsg.timestamp,
    };
  });

  const displayDirectMessages = currentUser.role === 'siswa'
    ? directMessages
    : directMessages.filter(m => 
        (m.senderId === selectedStudentForTeacher && m.recipientId === currentUser.id) ||
        (m.senderId === currentUser.id && m.recipientId === selectedStudentForTeacher) ||
        m.classId === `direct_${currentUser.id}_${selectedStudentForTeacher}` ||
        m.classId === `direct_${currentUser.id}_${selectedStudentForTeacher}`
      );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Ruang Diskusi & Tanya Jawab
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                Real-time
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {chatMode === 'class' 
                ? `Diskusi Terbuka Kelas: ${activeClass?.name || 'Kelas'}`
                : (currentUser.role === 'siswa' ? 'Konsultasi & Tanya Langsung ke Guru' : 'Daftar Pertanyaan Masuk dari Siswa')}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setChatMode('class')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              chatMode === 'class'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Diskusi Kelas</span>
          </button>

          <button
            type="button"
            onClick={() => setChatMode('direct')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              chatMode === 'direct'
                ? 'bg-white text-indigo-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircleQuestion className="w-3.5 h-3.5 text-indigo-600" />
            <span>{currentUser.role === 'siswa' ? 'Tanya Langsung ke Guru' : 'Pesan Masuk Siswa'}</span>
          </button>
        </div>
      </div>

      {/* Class Selector Bar (For Teachers when in Class Chat Mode) */}
      {chatMode === 'class' && currentUser.role === 'guru' && allClasses.length > 0 && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-950">
              Pilih Kelas Diskusi:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {allClasses.map((cls) => {
              const isSelected = cls.id === (activeClass?.id || selectedClassId);
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => handleClassChange(cls.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  <span>{cls.name}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Teacher Selector Bar (For Students when in Direct Q&A Mode) */}
      {chatMode === 'direct' && currentUser.role === 'siswa' && (
        <div className="bg-indigo-50/70 border-b border-indigo-100 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-700" />
            <span className="text-xs font-bold text-indigo-950">
              Pilih Guru Tujuan Pertanyaan:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {availableTeachers.map((t) => {
              const isSelected = t.id === selectedTeacherId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTeacherId(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-900 font-medium'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {t.name[0]}
                  </div>
                  <span>{t.name}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded ${
                    isSelected ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {t.subject.split('&')[0].trim()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Teacher View: Incoming questions list from students when in Direct Mode */}
      {chatMode === 'direct' && currentUser.role === 'guru' && uniqueStudentsInDirectChat.length > 0 && (
        <div className="bg-indigo-50/50 border-b border-indigo-100 p-2.5 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-indigo-950 whitespace-nowrap pl-1">
            Pilih Siswa:
          </span>
          {uniqueStudentsInDirectChat.map((item) => {
            const isSelected = item.studentId === selectedStudentForTeacher;
            return (
              <button
                key={item.studentId}
                type="button"
                onClick={() => setSelectedStudentForTeacher(item.studentId)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                }`}
              >
                <span>{item.studentName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.className}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {chatMode === 'class' ? (
          // CLASS CHAT MESSAGES
          messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-200/60 text-slate-400 flex items-center justify-center mb-2">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">Belum ada obrolan di kelas {activeClass?.name}</p>
              {currentUser.role === 'guru' ? (
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Sebagai guru, Anda dapat memulai percakapan atau memberikan pengumuman awal agar siswa dapat mulai berdiskusi.
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Ruang obrolan kelas ini menunggu guru memulai pembahasan terlebih dahulu. Anda dapat bertanya langsung melalui menu <strong>Tanya Langsung ke Guru</strong>.
                </p>
              )}
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const isTeacher = msg.senderRole === 'guru';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1 shadow-2xs ${
                    isTeacher ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {msg.senderName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>

                  <div className={`max-w-[80%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-slate-800">
                        {isMe ? 'Saya' : msg.senderName}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        isTeacher 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isTeacher ? 'Guru' : 'Siswa'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                          : isTeacher
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-tl-xs shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          // DIRECT Q&A MESSAGES
          displayDirectMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                <MessageCircleQuestion className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {currentUser.role === 'siswa'
                  ? `Mulai Konsultasi dengan ${availableTeachers.find(t => t.id === selectedTeacherId)?.name || 'Guru'}`
                  : 'Belum ada pesan tanya jawab yang dipilih'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {currentUser.role === 'siswa'
                  ? 'Sebagai siswa, Anda dapat bertanya langsung kepada guru pilihan Anda seputar materi, tugas, atau persiapan kuis & asesmen.'
                  : 'Pesan dari siswa yang memilih Anda sebagai guru tujuan akan muncul di sini.'}
              </p>
            </div>
          ) : (
            displayDirectMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const isTeacher = msg.senderRole === 'guru';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1 shadow-2xs ${
                    isTeacher ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {msg.senderName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>

                  <div className={`max-w-[80%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-slate-800">
                        {isMe ? 'Saya' : msg.senderName}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        isTeacher ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isTeacher ? 'Guru' : 'Siswa'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                          : isTeacher
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-tl-xs shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input or Locked Notice Bar */}
      {isStudentInClassChat && !hasTeacherStartedClassChat ? (
        // Locked bar for students when teacher hasn't started class chat yet
        <div className="p-4 bg-amber-50 border-t border-amber-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-900">
              Menunggu Guru Memulai Percakapan Kelas
            </p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Siswa hanya dapat membalas setelah guru mengirimkan pesan awal. Ingin bertanya sekarang? Gunakan tab <strong>"Tanya Langsung ke Guru"</strong> di atas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setChatMode('direct')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex-shrink-0 shadow-xs"
          >
            Tanya Guru
          </button>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                chatMode === 'class'
                  ? (currentUser.role === 'guru' 
                      ? `Tulis pesan / buka topik diskusi untuk ${activeClass?.name}...` 
                      : `Balas obrolan guru di kelas ${activeClass?.name}...`)
                  : (currentUser.role === 'siswa'
                      ? `Tulis pertanyaan langsung untuk ${availableTeachers.find(t => t.id === selectedTeacherId)?.name || 'Guru'}...`
                      : 'Ketik balasan untuk siswa...')
              }
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-xl text-white shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed ${
                chatMode === 'class' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
