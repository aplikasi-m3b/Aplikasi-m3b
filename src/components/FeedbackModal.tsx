import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface FeedbackOptions {
  isOpen: boolean;
  type: FeedbackType;
  title: string;
  message: string;
  detail?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onConfirmAction?: () => void;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackOptions> = ({
  isOpen,
  type,
  title,
  message,
  detail,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  onConfirm,
  onConfirmAction,
  onClose,
}) => {
  if (!isOpen) return null;

  const actualConfirmText = confirmText || confirmLabel || (type === 'confirm' ? 'Lanjutkan' : 'Mengerti');
  const actualCancelText = cancelText || cancelLabel || 'Batal';

  const handleAction = async () => {
    onClose();
    try {
      if (onConfirm) await onConfirm();
      if (onConfirmAction) await onConfirmAction();
    } catch (err) {
      console.error('Error executing feedback action:', err);
    }
  };

  const getVisuals = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          accentColor: 'text-emerald-800',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
          badgeText: 'Berhasil',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        };
      case 'error':
        return {
          icon: <XCircle className="w-8 h-8 text-rose-600" />,
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          accentColor: 'text-rose-900',
          buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
          badgeText: 'Terjadi Kesalahan',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          accentColor: 'text-amber-900',
          buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
          badgeText: 'Perhatian',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
        };
      case 'confirm':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-indigo-600" />,
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          accentColor: 'text-indigo-950',
          buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
          badgeText: 'Konfirmasi Tindakan',
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-8 h-8 text-sky-600" />,
          bgColor: 'bg-sky-50',
          borderColor: 'border-sky-200',
          accentColor: 'text-sky-900',
          buttonClass: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200',
          badgeText: 'Informasi',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-300'
        };
    }
  };

  const visuals = getVisuals();

  return (
    <div 
      id="feedback-modal-backdrop" 
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && type !== 'confirm') {
          onClose();
        }
      }}
    >
      <div 
        id="feedback-modal-dialog"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Top Decorative Banner */}
        <div className={`p-6 ${visuals.bgColor} border-b ${visuals.borderColor} relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/60 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex-shrink-0">
              {visuals.icon}
            </div>
            <div>
              <span className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border mb-1.5 ${visuals.badgeClass}`}>
                {visuals.badgeText}
              </span>
              <h3 className={`text-base font-bold ${visuals.accentColor} leading-snug`}>
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed font-normal">
            {message}
          </p>

          {detail && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono overflow-x-auto max-h-32">
              {detail}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {type === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
              >
                {actualCancelText}
              </button>
              <button
                type="button"
                onClick={handleAction}
                className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 ${visuals.buttonClass}`}
              >
                <span>{actualConfirmText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 ${visuals.buttonClass}`}
            >
              <span>{actualConfirmText}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
