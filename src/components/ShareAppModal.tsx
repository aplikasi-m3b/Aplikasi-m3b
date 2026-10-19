import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Smartphone, 
  Laptop, 
  Download, 
  Send, 
  ExternalLink,
  Info
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Default shared URL if running in dev or window.location
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const sharedUrl = currentOrigin.includes('localhost') || currentOrigin.includes('ais-dev')
    ? 'https://ais-pre-63dzks4f7qnmsq36xy2tfp-871662580341.asia-southeast1.run.app'
    : currentOrigin;

  useEffect(() => {
    if (isOpen && sharedUrl) {
      QRCode.toDataURL(sharedUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#02522B', // Deep forest green
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR Code:', err));
    }
  }, [isOpen, sharedUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sharedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Assalamu'alaikum wr. wb.\n\nKepada seluruh siswa MTsN 3 Banyuwangi, silakan akses LMS Pembelajaran Digital kita melalui tautan berikut:\n${sharedUrl}\n\nLangkah masuk:\n1. Pilih kelas & nama Anda\n2. Masukkan kata sandi (default: 123)\n3. Selamat belajar & menyelesaikan materi!\n\nWassalamu'alaikum wr. wb.`
  );

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = 'QR-LMS-MTsN-3-Banyuwangi.png';
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <SchoolLogo size="md" className="filter drop-shadow-md" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold">
                <Share2 className="w-3 h-3" />
                <span>Akses Publik HP & Laptop</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">Bagikan Link LMS MTsN 3 Banyuwangi</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Link Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Link Aplikasi Resmi (Dapat Diakses Siapa Saja)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-emerald-950 break-all select-all flex items-center">
                {sharedUrl}
              </div>
              <button
                id="btn-copy-share-url"
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs flex-shrink-0 ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons: WhatsApp & Open in New Tab */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Send className="w-4 h-4" />
              <span>Bagikan ke Grup WhatsApp Kelas</span>
            </a>
            <a
              href={sharedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition border border-slate-300"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
              <span>Buka di Tab Baru</span>
            </a>
          </div>

          {/* QR Code Section */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2.5 rounded-2xl border border-emerald-300 shadow-sm flex-shrink-0">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code LMS MTsN 3 Banyuwangi"
                  className="w-36 h-36 object-contain"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-slate-400">
                  <QrCode className="w-10 h-10 animate-pulse" />
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <h4 className="font-bold text-sm text-emerald-950 flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>Scan QR Code dari Kamera HP Siswa</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Siswa cukup membuka kamera HP atau Google Lens, lalu arahkan ke barcode ini untuk langsung masuk ke portal LMS tanpa mengetik link.
              </p>
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh Gambar QR Code</span>
              </button>
            </div>
          </div>

          {/* How to Access: Smartphone & Laptop */}
          <div className="space-y-3 pt-1">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Panduan Akses untuk Siswa
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* HP Card */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>Akses Lewat HP (Smartphone)</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>Buka browser (Google Chrome / Safari / Opera).</li>
                  <li>Buka link atau scan QR Code di atas.</li>
                  <li><strong>Tips Jadikan Aplikasi:</strong> Ketuk menu browser (titik 3 di Chrome atau tombol Share di Safari), lalu pilih <em>"Tambahkan ke Layar Utama" (Add to Home Screen)</em>.</li>
                </ul>
              </div>

              {/* Laptop Card */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
                  <Laptop className="w-4 h-4" />
                  <span>Akses Lewat Laptop / PC</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>Buka Google Chrome, MS Edge, atau Mozilla Firefox.</li>
                  <li>Paste link LMS MTsN 3 Banyuwangi.</li>
                  <li>Pilih menu <strong>"Portal Siswa"</strong>, pilih kelas, pilih nama Anda, dan masukkan password <code>123</code>.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Link ini sudah online dan siap digunakan di seluruh Indonesia. Semua progres pengerjaan kuis, materi, dan game siswa akan tersimpan secara otomatis dan dapat dipantau langsung oleh Guru Utama serta dewan guru.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
