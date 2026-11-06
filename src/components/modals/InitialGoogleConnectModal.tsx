import React from 'react';
import { Cloud, Calendar, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { GoogleLogo } from '../GoogleLogo.tsx';

interface InitialGoogleConnectModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  onConnectGoogle: () => void;
  onSkip: () => void;
  onOpenTerms?: (tab: 'terms' | 'privacy') => void;
}

export const InitialGoogleConnectModal: React.FC<InitialGoogleConnectModalProps> = ({
  isOpen,
  lang,
  onConnectGoogle,
  onSkip,
  onOpenTerms,
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
          <GoogleLogo className="w-8 h-8" />
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
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-black/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <GoogleLogo className="w-4 h-4 shrink-0" />
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

        {/* Legal Terms & Privacy Links for Google Verification */}
        <div className="pt-2 border-t border-[#2a2a4a]/60 text-[11px] text-[#8888a8] flex flex-wrap items-center justify-center gap-1.5">
          <span>{lang === 'ar' ? 'بالمتابعة فإنك توافق على' : 'By continuing, you agree to StudyFlow\'s'}</span>
          <button
            type="button"
            onClick={() => onOpenTerms ? onOpenTerms('terms') : window.open('./terms.html', '_blank')}
            className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2"
          >
            {lang === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
          </button>
          <span>{lang === 'ar' ? 'و' : '&'}</span>
          <button
            type="button"
            onClick={() => onOpenTerms ? onOpenTerms('privacy') : window.open('./privacy.html', '_blank')}
            className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2"
          >
            {lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </button>
        </div>
      </div>
    </div>
  );
};
