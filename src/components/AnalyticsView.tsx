import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  User, 
  BookOpen, 
  Lightbulb, 
  Award, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { Student, StudentProgress, Chapter, PersonalRecommendation, ClassItem } from '../types';
import { lmsService } from '../services/lmsService';

interface AnalyticsViewProps {
  currentClass: ClassItem;
  allClasses?: ClassItem[];
  students: Student[];
  chapters: Chapter[];
  progressList: StudentProgress[];
  recommendations: PersonalRecommendation[];
  teacherName: string;
  onSelectClass?: (cls: ClassItem) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  currentClass,
  allClasses = [],
  students,
  chapters,
  progressList,
  recommendations,
  teacherName,
  onSelectClass,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(currentClass.id);
  const activeClass = (allClasses.length > 0 ? allClasses.find(c => c.id === selectedClassId) : null) || currentClass;

  const classStudents = students.filter(s => s.classId === activeClass.id);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(classStudents[0]?.id || '');
  const [recTopic, setRecTopic] = useState('');
  const [recType, setRecType] = useState<'kelemahan' | 'kelebihan' | 'pengayaan'>('kelemahan');
  const [recReason, setRecReason] = useState('');
  const [recText, setRecText] = useState('');
  const [recAction, setRecAction] = useState('');
  const [successNotif, setSuccessNotif] = useState('');

  // Keep selected student synced when class changes
  const selectedStudent = classStudents.find(s => s.id === selectedStudentId) || classStudents[0];

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const targetCls = allClasses.find(c => c.id === newClassId);
    if (targetCls && onSelectClass) {
      onSelectClass(targetCls);
    }
    const newStudents = students.filter(s => s.classId === newClassId);
    if (newStudents.length > 0) {
      setSelectedStudentId(newStudents[0].id);
    }
  };

  // Calculate Class-wide metrics for charts
  const classProgress = progressList.filter(p => p.classId === activeClass.id);

  // Chapter Performance Bar Chart Data
  const chapterChartData = chapters.map((chap) => {
    const chapProgress = classProgress.filter(p => p.chapterId === chap.id);
    const totalStudents = Math.max(1, classStudents.length);

    const completedMaterialCount = chapProgress.filter(p => p.materialCompleted).length;
    const avgQuizScore = chapProgress.filter(p => p.quizScore !== undefined)
      .reduce((acc, curr) => acc + (curr.quizScore || 0), 0) / Math.max(1, chapProgress.filter(p => p.quizScore !== undefined).length);
    const avgGameScore = chapProgress.filter(p => p.gameScore !== undefined)
      .reduce((acc, curr) => acc + (curr.gameScore || 0), 0) / Math.max(1, chapProgress.filter(p => p.gameScore !== undefined).length);
    const avgAssessmentScore = chapProgress.filter(p => p.assessmentScore !== undefined)
      .reduce((acc, curr) => acc + (curr.assessmentScore || 0), 0) / Math.max(1, chapProgress.filter(p => p.assessmentScore !== undefined).length);

    return {
      name: `Bab ${chap.chapterNumber}`,
      title: chap.title,
      'Selesai Materi (%)': Math.round((completedMaterialCount / totalStudents) * 100),
      'Rata-rata Kuis': Math.round(avgQuizScore || 0),
      'Rata-rata Game': Math.round(avgGameScore || 0),
      'Rata-rata Asesmen': Math.round(avgAssessmentScore || 0),
    };
  });

  // Calculate Student Individual Weakness & Strength
  const studentProgs = classProgress.filter(p => p.studentId === selectedStudent?.id);
  
  // Aggregate topic mastery
  const topicStats: Record<string, { correct: number; total: number }> = {};
  studentProgs.forEach(p => {
    if (p.topicScores) {
      const scores = p.topicScores as Record<string, { correct: number; total: number }>;
      Object.entries(scores).forEach(([topic, stat]) => {
        if (!topicStats[topic]) {
          topicStats[topic] = { correct: 0, total: 0 };
        }
        topicStats[topic].correct += stat.correct;
        topicStats[topic].total += stat.total;
      });
    }
  });

  // Default topics if none recorded yet for demo
  if (Object.keys(topicStats).length === 0) {
    topicStats['Struktur Kloroplas'] = { correct: 1, total: 1 };
    topicStats['Pertukaran Gas Daun'] = { correct: 1, total: 1 };
    topicStats['Reaksi Terang'] = { correct: 0, total: 1 };
    topicStats['Eksperimen Sach'] = { correct: 0, total: 1 };
    topicStats['Piramida Energi'] = { correct: 1, total: 1 };
  }

  const topicRadarData = Object.entries(topicStats).map(([topic, stat]) => ({
    topic,
    penguasaan: Math.round((stat.correct / Math.max(1, stat.total)) * 100),
  }));

  const strengths = Object.entries(topicStats)
    .filter(([_, stat]) => (stat.correct / Math.max(1, stat.total)) >= 0.75)
    .map(([topic]) => topic);

  const weaknesses = Object.entries(topicStats)
    .filter(([_, stat]) => (stat.correct / Math.max(1, stat.total)) < 0.75)
    .map(([topic]) => topic);

  // Auto-generate recommendation template based on weakness
  const handleAutoGenerateRecommendation = () => {
    if (!selectedStudent) return;
    if (weaknesses.length > 0) {
      const targetWeakness = weaknesses[0];
      setRecTopic(targetWeakness);
      setRecType('kelemahan');
      setRecReason(`Tingkat ketuntasan pada materi "${targetWeakness}" masih di bawah 70%.`);
      setRecText(`Halo ${selectedStudent.name}, kamu sudah berusaha dengan baik! Namun untuk bagian "${targetWeakness}", mari perdalam pemahaman konsep dasarnya melalui rangkuman dan latihan mandiri.`);
      setRecAction(`Buka kembali modul materi Bab 1 sub-topik "${targetWeakness}" dan kerjakan kembali latihan soal penguatan.`);
    } else {
      setRecTopic('Pengayaan Konsep Lanjutan');
      setRecType('pengayaan');
      setRecReason(`${selectedStudent.name} telah menguasai seluruh konsep materi dengan sangat memuaskan (>85%).`);
      setRecText(`Kerja yang luar biasa ${selectedStudent.name}! Kamu memiliki potensi besar untuk mendalami studi kasus sains lanjutan dan persiapan kompetisi akademik.`);
      setRecAction(`Pelajari artikel pengayaan mandiri dan tantang diri dengan soal bertipe HOTS (Higher Order Thinking Skills).`);
    }
  };

  const handleSendRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !recTopic || !recText) return;

    const newRec: PersonalRecommendation = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      classId: currentClass.id,
      teacherName: teacherName || 'Ibu Rahmawati, S.Pd.',
      topic: recTopic,
      strengthWeaknessType: recType,
      reason: recReason || 'Berdasarkan hasil pemantauan perkembangan bab.',
      recommendationText: recText,
      suggestedAction: recAction || 'Tinjau materi panduan dan latihan penguatan.',
      createdAt: Date.now(),
      status: 'baru',
    };

    await lmsService.addRecommendation(newRec);
    setSuccessNotif(`Rekomendasi personal berhasil dikirimkan ke dashboard ${selectedStudent.name}!`);
    setTimeout(() => setSuccessNotif(''), 4000);

    setRecTopic('');
    setRecReason('');
    setRecText('');
    setRecAction('');
  };

  const studentRecs = recommendations.filter(r => r.studentId === selectedStudent?.id);

  return (
    <div className="space-y-6">
      {/* Class Selector Bar (Pilih Kelas untuk Diagnosis) */}
      {allClasses.length > 0 && (
        <div className="bg-indigo-50/70 border border-indigo-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                Pilih Kelas untuk Analisis & Diagnosis:
              </span>
              <span className="text-xs text-indigo-700 font-medium">
                Diagnosis dan rekomendasi akan menyesuaikan dengan siswa di kelas terpilih
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {allClasses.map((cls) => {
              const isSelected = cls.id === activeClass.id;
              const count = students.filter(s => s.classId === cls.id).length;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => handleClassChange(cls.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-950'
                  }`}
                >
                  <span>{cls.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600 font-semibold'
                  }`}>
                    {count} Siswa
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-200" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Analisis Performa & Diagnosis Siswa</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluasi mendalam daya serap materi, kekuatan, kekurangan, dan pemberian rekomendasi personal untuk setiap siswa di <strong className="text-indigo-800">{activeClass.name}</strong>
          </p>
        </div>

        {/* Student Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">Pilih Siswa:</label>
          <select
            id="analytics-student-select"
            value={selectedStudent?.id || ''}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {classStudents.length === 0 ? (
              <option value="">Belum ada siswa di kelas ini</option>
            ) : (
              classStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (NIS: {s.nis})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Success Banner */}
      {successNotif && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successNotif}</span>
        </div>
      )}

      {/* Grid: Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Chapter Performance Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Rata-Rata Nilai & Progres Per Bab</h3>
              <p className="text-xs text-slate-500">Perbandingan ketercapaian siswa di kelas {currentClass.name}</p>
            </div>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              {chapters.length} Bab
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chapterChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Rata-rata Kuis" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rata-rata Game" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rata-rata Asesmen" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Topic Mastery Radar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Penguasaan Konsep: {selectedStudent?.name}
              </h3>
              <p className="text-xs text-slate-500">Persentase penguasaan setiap indikator kompetensi</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Profil Siswa
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={topicRadarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="topic" stroke="#475569" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" fontSize={10} />
                <Radar
                  name="Tingkat Penguasaan (%)"
                  dataKey="penguasaan"
                  stroke="#4f46e5"
                  fill="#6366f1"
                  fillOpacity={0.45}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Individual Student Diagnostic Card: Kelebihan & Kelemahan */}
      {selectedStudent && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={selectedStudent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={selectedStudent.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 shadow-xs"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedStudent.name}</h3>
                <p className="text-xs text-slate-500">
                  NIS: {selectedStudent.nis} • Kelas: {currentClass.name} • Total Poin: {selectedStudent.totalPoints}
                </p>
              </div>
            </div>

            <button
              onClick={handleAutoGenerateRecommendation}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-xs hover:from-indigo-700 hover:to-violet-700 transition flex items-center gap-2 self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Susun Rekomendasi Cerdas Otomatis</span>
            </button>
          </div>

          {/* Strengths & Weaknesses 2-Column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {/* Kelebihan (Strengths) */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-200 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">Kelebihan & Kekuatan Siswa</h4>
                  <p className="text-[11px] text-emerald-700">Topik materi dengan penguasaan tinggi (≥ 75%)</p>
                </div>
              </div>

              {strengths.length === 0 ? (
                <p className="text-xs text-emerald-800 italic">
                  Sedang dalam tahap pemantauan awal
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {strengths.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Kelemahan / Kekurangan (Weaknesses) */}
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-rose-200 text-rose-800">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-950">Kelemahan & Aspek Perlu Perbaikan</h4>
                  <p className="text-[11px] text-rose-700">Topik dengan akurasi rendah yang memerlukan bimbingan tambahan</p>
                </div>
              </div>

              {weaknesses.length === 0 ? (
                <p className="text-xs text-rose-800 font-medium">
                  Sangat baik! Tidak terdeteksi kelemahan kritis pada materi yang telah dikerjakan.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {weaknesses.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form: Rekomendasi Materi Tambahan Personal */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Kirim Rekomendasi Materi Tambahan Personal</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Rekomendasi ini akan langsung tampil di dashboard pribadi {selectedStudent.name} untuk memandu belajarnya.
            </p>

            <form onSubmit={handleSendRecommendation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Topik Rekomendasi</label>
                  <input
                    type="text"
                    value={recTopic}
                    onChange={(e) => setRecTopic(e.target.value)}
                    placeholder="Contoh: Reaksi Terang & Fotolisis"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Rekomendasi</label>
                  <select
                    value={recType}
                    onChange={(e) => setRecType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="kelemahan">Perbaikan / Remedial (Kelemahan)</option>
                    <option value="pengayaan">Pengayaan Materi (Kelebihan)</option>
                    <option value="kelebihan">Apresiasi Pencapaian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alasan / Diagnosis Singkat</label>
                  <input
                    type="text"
                    value={recReason}
                    onChange={(e) => setRecReason(e.target.value)}
                    placeholder="Contoh: Skor kuis bagian Sachs masih di bawah 65%"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Rekomendasi untuk Siswa</label>
                <textarea
                  rows={2}
                  value={recText}
                  onChange={(e) => setRecText(e.target.value)}
                  placeholder="Tuliskan bimbingan yang jelas dan menyemangati siswa..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tindakan Belajar yang Disarankan (Action Item)</label>
                <input
                  type="text"
                  value={recAction}
                  onChange={(e) => setRecAction(e.target.value)}
                  placeholder="Contoh: Buka rangkuman fotosintesis Bab 1 dan kerjakan kembali 3 soal terkait"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Rekomendasi ke Siswa</span>
                </button>
              </div>
            </form>
          </div>

          {/* Historic Recommendations Given */}
          {studentRecs.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-700 mb-3">
                Riwayat Rekomendasi Terkirim untuk {selectedStudent.name}:
              </h5>
              <div className="space-y-2.5">
                {studentRecs.map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">{rec.topic}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.strengthWeaknessType === 'kelemahan' 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {rec.strengthWeaknessType === 'kelemahan' ? 'Remedial' : 'Pengayaan'}
                        </span>
                      </div>
                      <p className="text-slate-600">{rec.recommendationText}</p>
                      {rec.suggestedAction && (
                        <p className="text-indigo-700 font-medium mt-1">Aksi: {rec.suggestedAction}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap self-end sm:self-auto">
                      {new Date(rec.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
