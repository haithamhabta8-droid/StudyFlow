import React from 'react';
import { ShieldCheck, Cookie, X, Gem } from 'lucide-react';
import { StudyFlowLogo } from '../StudyFlowLogo.tsx';

interface CookieConsentModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  onAcceptAll: () => void;
  onAcceptNecessary: () => void;
  onOpenPrivacy?: () => void;
  onClose: () => void;
}

export const CookieConsentModal: React.FC<CookieConsentModalProps> = ({
  isOpen,
  lang,
  onAcceptAll,
  onAcceptNecessary,
  onOpenPrivacy,
  onClose,
}) => {
  if (!isOpen) return null;

  const isAr = lang === 'ar';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="my-auto bg-[#12122a] border border-[#2a2a4a] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-start relative animate-in zoom-in-95 duration-200">
        {/* Header with Centered Purple Diamond Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-lg shadow-purple-950/40">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
              >
                <path d="M2 12l4-8h12l4 8-10 8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#e8e8f0]">
                {isAr ? 'إعدادات ملفات تعريف الارتباط' : 'Cookie Settings'}
              </h3>
              <span className="text-[11px] text-purple-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'حماية الخصوصية والأمان' : 'Privacy & Security First'}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8888a8] hover:text-white hover:bg-[#1c1c3a] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <p className="text-xs text-[#8888a8] leading-relaxed">
          {isAr
            ? 'نستخدم ملفات تعريف الارتباط والتخزين المحلي لتقديم الخدمات وتحسين الأداء والحفاظ على وضع العمل دون اتصال ومزامنة بيانات دراستك. يمكنك قبول الكل أو قصرها على الملفات الضرورية فقط.'
            : 'We use cookies and secure browser storage to deliver offline features, preserve your preferences, and maintain study session sync. You can choose to accept all or only necessary cookies.'}
        </p>

        {onOpenPrivacy && (
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold transition-colors"
          >
            {isAr ? 'عرض سياسة الخصوصية والكوكيز' : 'View our Cookie & Privacy Policy'}
          </button>
        )}

        {/* Actions */}
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={onAcceptAll}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center text-center shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
          >
            {isAr ? 'قبول جميع ملفات تعريف الارتباط' : 'Accept all cookies'}
          </button>

          <button
            type="button"
            onClick={onAcceptNecessary}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1c1c3a] hover:bg-[#242448] border border-[#2a2a4a] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0] flex items-center justify-center text-center transition-colors"
          >
            {isAr ? 'ملفات تعريف الارتباط الضرورية فقط' : 'Necessary cookies only'}
          </button>
        </div>
      </div>
    </div>
  );
};
