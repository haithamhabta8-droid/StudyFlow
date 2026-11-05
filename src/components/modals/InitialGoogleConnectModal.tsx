import React from 'react';
import { Cloud, Calendar, Sparkles, Check, ArrowRight } from 'lucide-react';

interface InitialGoogleConnectModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  onConnectGoogle: () => void;
  onSkip: () => void;
}

export const InitialGoogleConnectModal: React.FC<InitialGoogleConnectModalProps> = ({
  isOpen,
  lang,
  onConnectGoogle,
  onSkip,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300"
    >
      <div className="bg-[#12122a] border border-[#2a2a4a] rounded-3xl p-7 max-w-md w-full shadow-2xl space-y-6 text-center">
        {/* Google G Logo Brand Header */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shadow-lg shadow-purple-950/40">
          <svg className="w-8 h-8" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#e8e8f0] tracking-tight">
            {lang === 'ar' ? 'مرحباً بك في StudyFlow' : 'Welcome to StudyFlow'}
          </h2>
          <p className="text-xs text-[#8888a8] mt-2 leading-relaxed">
            {lang === 'ar'
              ? 'اربط حساب Google لمزامنة بطاقاتك وجدولك الزمني ونسخ بياناتك احتياطياً في السحابة تلقائياً.'
              : 'Connect your Google account to automatically sync your flashcards, study calendar, and secure cloud backups.'}
          </p>
        </div>

        {/* Benefits checklist */}
        <div className="bg-[#1c1c3a] border border-[#2a2a4a]/70 rounded-2xl p-4 text-start space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5 text-[#e8e8f0]">
            <Cloud className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              {lang === 'ar'
                ? 'مزامنة تلقائية مع Google Drive (appDataFolder)'
                : 'Auto-sync with private Google Drive storage'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[#e8e8f0]">
            <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              {lang === 'ar'
                ? 'استيراد جدول Google Calendar والعمل بدون إنترنت'
                : 'Import Google Calendar schedule with offline cache'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[#e8e8f0]">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {lang === 'ar'
                ? 'حفظ السلسلة والإحصائيات عبر جميع أجهزتك'
                : 'Retain streaks & study progress across all devices'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={onConnectGoogle}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#ffffff"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#ffffff"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#ffffff"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#ffffff"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{lang === 'ar' ? 'المتابعة بحساب Google' : 'Continue with Google'}</span>
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-[#1c1c3a] text-[#8888a8] hover:text-[#e8e8f0] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{lang === 'ar' ? 'المتابعة كضيف (تخطي)' : 'Continue as Guest (Skip for now)'}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
