import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  X, 
  Clock, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  AlertCircle,
  Eye,
  Zap,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import mammoth from 'mammoth';
import { Chapter } from '../types';

interface ReadingMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter;
  readingTimerRemaining: number;
  totalReadingSeconds: number;
  isTimerFinished: boolean;
  onSkipTimerForTesting?: () => void;
  isTeacherMode?: boolean;
  initialTab?: 'text' | 'document' | 'summary';
}

export const ReadingMaterialModal: React.FC<ReadingMaterialModalProps> = ({
  isOpen,
  onClose,
  chapter,
  readingTimerRemaining,
  totalReadingSeconds,
  isTimerFinished,
  onSkipTimerForTesting,
  isTeacherMode,
  initialTab = 'text',
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'text' | 'document' | 'summary'>(initialTab);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [docHtml, setDocHtml] = useState<string>('');
  const [isConvertingDoc, setIsConvertingDoc] = useState<boolean>(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');

  const material = chapter?.material;
  const uploadedFile = material?.uploadedFile;

  // Sync tab when opening
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveViewTab(initialTab);
      } else if (uploadedFile) {
        setActiveViewTab('text');
      }
    }
  }, [isOpen, initialTab, uploadedFile]);

  // Convert docx / doc to clean formatted HTML using mammoth for Word preview
  useEffect(() => {
    if (!isOpen || !uploadedFile) return;

    if ((uploadedFile.fileType === 'docx' || uploadedFile.fileType === 'doc') && uploadedFile.fileDataUrl) {
      setIsConvertingDoc(true);
      (async () => {
        try {
          const raw = uploadedFile.fileDataUrl;
          let arrayBuffer: ArrayBuffer;
          if (raw.startsWith('data:')) {
            const base64 = raw.includes(',') ? raw.split(',')[1] : raw;
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            arrayBuffer = bytes.buffer;
          } else {
            const res = await fetch(raw);
            arrayBuffer = await res.arrayBuffer();
          }
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (result && result.value && result.value.trim().length > 10) {
            setDocHtml(result.value);
          } else {
            setDocHtml('');
          }
        } catch (e) {
          console.warn('Mammoth docx convert fallback:', e);
          setDocHtml('');
        } finally {
          setIsConvertingDoc(false);
        }
      })();
    } else {
      setDocHtml('');
    }
  }, [isOpen, uploadedFile?.fileDataUrl, uploadedFile?.fileType]);

  // Create safe blob URL for PDF to avoid iframe data-URL security restrictions
  useEffect(() => {
    if (!isOpen || !uploadedFile) return;

    if (uploadedFile.fileType === 'pdf' && uploadedFile.fileDataUrl) {
      try {
        const raw = uploadedFile.fileDataUrl;
        if (raw.startsWith('blob:') || raw.startsWith('http')) {
          setPdfBlobUrl(raw);
        } else {
          const base64 = raw.includes(',') ? raw.split(',')[1] : raw;
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          return () => {
            URL.revokeObjectURL(url);
          };
        }
      } catch (e) {
        console.warn('PDF blob creation error:', e);
        setPdfBlobUrl(uploadedFile.fileDataUrl);
      }
    } else {
      setPdfBlobUrl('');
    }
  }, [isOpen, uploadedFile?.fileDataUrl, uploadedFile?.fileType]);

  if (!isOpen || !chapter || !material) return null;

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalReadingSeconds > 0 
    ? Math.min(100, Math.max(0, Math.round(((totalReadingSeconds - readingTimerRemaining) / totalReadingSeconds) * 100)))
    : 100;

  const fontClass = fontSize === 'sm' 
    ? 'text-xs sm:text-sm leading-relaxed' 
    : fontSize === 'lg' 
      ? 'text-base sm:text-lg leading-loose' 
      : 'text-sm sm:text-base leading-relaxed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[92vh] max-h-[92vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[10px] uppercase">
                  Bab {chapter.chapterNumber}
                </span>
                <span className="text-xs text-slate-500 font-medium">Jendela Bacaan Siswa</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {material.title || chapter.title}
              </h2>
            </div>
          </div>

          {/* Controls: Font size & Close */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Font size toggles */}
            <div className="hidden sm:flex items-center bg-white rounded-lg border border-slate-200 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFontSize('sm')}
                className={`px-2 py-1 rounded font-medium transition ${fontSize === 'sm' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                title="Ukuran teks kecil"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize('base')}
                className={`px-2 py-1 rounded font-medium transition ${fontSize === 'base' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                title="Ukuran teks sedang"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('lg')}
                className={`px-2 py-1 rounded font-medium transition ${fontSize === 'lg' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                title="Ukuran teks besar"
              >
                A+
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition"
              title="Tutup Jendela Membaca"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rundown Waktu Membaca Banner */}
        <div className={`px-4 sm:px-5 py-2.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
          isTimerFinished 
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50/90 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isTimerFinished ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'}`}>
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">
                  {isTimerFinished ? 'Waktu Membaca Selesai Tuntas' : 'Rundown Waktu Membaca yang Ditentukan:'}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                  isTimerFinished ? 'bg-emerald-200/80 text-emerald-900' : 'bg-amber-200 text-amber-950'
                }`}>
                  {isTimerFinished ? '00:00 (Tuntas)' : `${formatTime(readingTimerRemaining)} tersisa`}
                </span>
              </div>
              <p className="text-[11px] opacity-85 mt-0.5">
                {isTimerFinished 
                  ? 'Target waktu membaca terpenuhi. Anda kini dapat menjawab Cek Pemahaman Bacaan.'
                  : `Waktu belum habis. Mohon baca materi hingga tuntas untuk membuka tahap berikutnya.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress bar visual */}
            <div className="w-32 sm:w-44 bg-slate-200/80 rounded-full h-2 overflow-hidden flex-shrink-0">
              <div 
                className={`h-full transition-all duration-1000 ${isTimerFinished ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Quick Skip for Teacher simulation */}
            {isTeacherMode && !isTimerFinished && onSkipTimerForTesting && (
              <button
                type="button"
                onClick={onSkipTimerForTesting}
                className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs whitespace-nowrap"
                title="Khusus guru untuk mempercepat pengujian alur siswa"
              >
                <Zap className="w-3 h-3" />
                <span>Lewati Waktu (Mode Guru)</span>
              </button>
            )}
          </div>
        </div>

        {/* View Tabs Inside Pop-up */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveViewTab('text')}
            className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeViewTab === 'text'
                ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Teks Materi Modul</span>
          </button>

          {uploadedFile && (
            <button
              type="button"
              onClick={() => setActiveViewTab('document')}
              className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                activeViewTab === 'document'
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dokumen Asli ({uploadedFile.fileName})</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 uppercase">
                {uploadedFile.fileType}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveViewTab('summary')}
            className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeViewTab === 'summary'
                ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Poin Rangkuman ({material.summaryPoints.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50/40">
          {/* TAB 1: TEXT CONTENT */}
          {activeViewTab === 'text' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Document Banner if attached */}
              {uploadedFile && (
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-sky-600" />
                    <div>
                      <p className="text-xs font-bold text-sky-950">
                        Dokumen Lampiran: {uploadedFile.fileName}
                      </p>
                      <p className="text-[11px] text-sky-700">
                        Teks di bawah ini telah diekstrak langsung dari berkas resmi guru.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveViewTab('document')}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Berkas Asli</span>
                  </button>
                </div>
              )}

              {/* Main Reading Text */}
              <div className={`bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs text-slate-800 ${fontClass} whitespace-pre-line font-sans`}>
                {material.content || 'Konten materi belum diisi oleh guru.'}
              </div>

              {/* Summary Reminder */}
              {material.summaryPoints && material.summaryPoints.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Intisari Yang Perlu Diingat:</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-emerald-900 list-disc list-inside">
                    {material.summaryPoints.map((pt, idx) => (
                      <li key={idx} className="leading-relaxed">{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOCUMENT PREVIEW */}
          {activeViewTab === 'document' && uploadedFile && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                    uploadedFile.fileType === 'pdf' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {uploadedFile.fileType}
                  </span>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{uploadedFile.fileName}</h4>
                    <p className="text-[11px] text-slate-500">
                      {(uploadedFile.fileSize / 1024).toFixed(1)} KB • Dibuka langsung di jendela pop-up
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {uploadedFile.fileDataUrl && (
                    <a
                      href={pdfBlobUrl || uploadedFile.fileDataUrl}
                      download={uploadedFile.fileName}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Berkas</span>
                    </a>
                  )}
                  {uploadedFile.fileType === 'pdf' && (pdfBlobUrl || uploadedFile.fileDataUrl) && (
                    <a
                      href={pdfBlobUrl || uploadedFile.fileDataUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Tab Terpisah</span>
                    </a>
                  )}
                </div>
              </div>

              {/* PDF Preview in object / iframe */}
              {uploadedFile.fileType === 'pdf' ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[65vh] flex flex-col">
                  {pdfBlobUrl || uploadedFile.fileDataUrl ? (
                    <object
                      data={pdfBlobUrl || uploadedFile.fileDataUrl}
                      type="application/pdf"
                      className="w-full h-full"
                    >
                      <iframe
                        src={pdfBlobUrl || uploadedFile.fileDataUrl}
                        title={uploadedFile.fileName}
                        className="w-full h-full border-none"
                      />
                    </object>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                      <FileText className="w-12 h-12 text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-700">Dokumen PDF Terlampir</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                        Teks materi telah diekstrak ke dalam tab "Teks Materi Modul" untuk kenyamanan membaca Anda.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Word (.docx / .doc) Preview */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-5 py-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
                    <span className="font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Tampilan Dokumen Word: {uploadedFile.fileName}
                    </span>
                    <span className="text-[11px] text-blue-700">Format Microsoft Word Asli</span>
                  </div>
                  <div className="p-6 sm:p-10 max-h-[65vh] overflow-y-auto">
                    {isConvertingDoc ? (
                      <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Mempersiapkan tata letak dokumen Word...</span>
                      </div>
                    ) : docHtml ? (
                      <div 
                        className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{ __html: docHtml }}
                      />
                    ) : (
                      <div className={`text-slate-800 ${fontClass} whitespace-pre-line font-sans`}>
                        {material.content}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted Images from Document if present */}
              {((uploadedFile.extractedImages && uploadedFile.extractedImages.length > 0) || (material.images && material.images.length > 0)) && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Gambar & Ilustrasi yang Diekstrak dari Berkas Materi</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(uploadedFile.extractedImages || material.images || []).map((img, idx) => (
                      <div key={img.id || idx} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
                        <img 
                          src={img.url} 
                          alt={img.name || img.caption || 'Gambar Materi'} 
                          className="w-full h-36 object-cover hover:scale-105 transition duration-300" 
                        />
                        {(img.name || img.caption) && (
                          <div className="p-2.5 text-[11px] text-slate-700 bg-white border-t border-slate-100 flex-1">
                            {img.name && <p className="font-bold text-slate-900 truncate">{img.name}</p>}
                            {img.caption && <p className="text-slate-500 line-clamp-2 mt-0.5">{img.caption}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUMMARY */}
          {activeViewTab === 'summary' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Rangkuman & Poin Penting Materi
                </h3>
                <p className="text-xs text-slate-500">
                  Berikut adalah poin-poin utama yang dirangkum oleh guru untuk memudahkan pemahaman Anda:
                </p>

                <div className="space-y-2.5 pt-2">
                  {material.summaryPoints.map((pt, idx) => (
                    <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {pt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Status Membaca:</span>
            {isTimerFinished ? (
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Target Waktu Selesai (Bisa Lanjut)
              </span>
            ) : (
              <span className="font-bold text-amber-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Rundown Waktu Sedang Berjalan ({formatTime(readingTimerRemaining)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isTimerFinished
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <span>{isTimerFinished ? 'Tutup & Jawab Cek Pemahaman' : 'Tutup Jendela Membaca'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
