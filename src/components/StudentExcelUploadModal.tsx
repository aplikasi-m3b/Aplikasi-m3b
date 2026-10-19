import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Users, 
  ArrowRight,
  Trash2
} from 'lucide-react';
import { ParsedStudentRow, downloadStudentTemplateExcel, parseStudentsFromExcel } from '../utils/excelStudentHelper';

interface StudentExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  onConfirmImport: (students: { name: string; nis: string; gender: 'Laki-laki' | 'Perempuan'; password: string }[]) => Promise<void>;
  onShowFeedback: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const StudentExcelUploadModal: React.FC<StudentExcelUploadModalProps> = ({
  isOpen,
  onClose,
  className,
  onConfirmImport,
  onShowFeedback,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsLoading(true);
    try {
      const rows = await parseStudentsFromExcel(selectedFile);
      setParsedRows(rows);
      if (rows.length === 0) {
        onShowFeedback('warning', 'Data Kosong', 'Tidak ada data siswa yang valid di dalam file Excel.');
      }
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      onShowFeedback('error', 'Gagal Membaca File Excel', err.message || 'Format berkas tidak valid.');
      setFile(null);
      setParsedRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const validRows = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);

  const handleImport = async () => {
    if (validRows.length === 0) {
      onShowFeedback('warning', 'Tidak Ada Data Valid', 'Silakan periksa kembali file Excel Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = validRows.map(r => ({
        name: r.name,
        nis: r.nis,
        gender: r.gender,
        password: r.password || '123',
      }));
      await onConfirmImport(payload);
      onShowFeedback(
        'success', 
        'Impor Siswa Berhasil!', 
        `Sebanyak ${payload.length} siswa berhasil ditambahkan ke kelas ${className}.`
      );
      onClose();
    } catch (err: any) {
      console.error('Error importing students:', err);
      onShowFeedback('error', 'Gagal Mengimpor Siswa', err.message || 'Terjadi gangguan saat menyimpan ke sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Upload Data Siswa Satu Kelas (Excel)</h3>
              <p className="text-xs text-emerald-200">Kelas Aktif: {className}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:bg-white/15 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Download template hint */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" />
                Belum Memiliki Format Excel?
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Unduh template resmi berformat .xlsx yang sudah disesuaikan dengan kolom: No, Nama Siswa, NISN, Jenis Kelamin, Password.
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadStudentTemplateExcel(className)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-2xs flex items-center gap-2 whitespace-nowrap transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Step 2: File upload dropzone */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileChange(f);
              }}
              className="hidden"
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Klik di sini untuk Memilih File Excel (.xlsx / .xls / .csv)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Mendukung format file spreadsheet hasil olah data madrasah</p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">{file.name}</div>
                    <div className="text-[10px] text-emerald-700">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} baris terbaca
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedRows([]);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Hapus File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Table Preview */}
          {isLoading && (
            <div className="text-center py-6 text-xs text-slate-500">
              Sedang membaca dan memverifikasi data Excel...
            </div>
          )}

          {parsedRows.length > 0 && !isLoading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Pratinjau Data Siswa ({validRows.length} Siap Diimpor)
                </span>
                {invalidRows.length > 0 && (
                  <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[10px]">
                    {invalidRows.length} baris tidak lengkap
                  </span>
                )}
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-3">NISN</th>
                      <th className="py-2.5 px-3">Jenis Kelamin</th>
                      <th className="py-2.5 px-3">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-slate-50 transition ${!row.isValid ? 'bg-rose-50/60' : ''}`}
                      >
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {row.name}
                          {!row.isValid && (
                            <span className="block text-[10px] text-rose-600">{row.error}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.nis}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.gender === 'Laki-laki' 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {row.gender}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">{row.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isSubmitting || validRows.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Mengimpor Data...' : `Impor ${validRows.length} Siswa ke Kelas`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
