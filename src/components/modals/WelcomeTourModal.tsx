import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  Layers,
  Clock,
  Cloud,
  Calendar,
  Move,
  Flame,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  BookOpen,
} from 'lucide-react';

interface WelcomeTourModalProps {
  isOpen: boolean;
  currentLang: 'ar' | 'en';
  onSelectLang: (lang: 'ar' | 'en') => void;
  onFinish: () => void;
}

export const WelcomeTourModal: React.FC<WelcomeTourModalProps> = ({
  isOpen,
  currentLang,
  onSelectLang,
  onFinish,
}) => {
  // Step 0: Language selection. Steps 1-6: Feature walkthrough.
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const isAr = currentLang === 'ar';

  const tourSteps = [
    {
      id: 'workspace',
      icon: <Layers className="w-8 h-8 text-purple-400" />,
      titleAr: 'مساحة العمل والتصنيفات',
      titleEn: 'Workspace & Subject Categories',
      descAr:
        'نظّم دراستك في مواد وتصنيفات ملونة (مثل الرياضيات، الأحياء، البرمجة). تحتوي كل مادة على بطاقات استذكار، مهام، اختبارات، درجات، وخرائط ذهنية مستقلة.',
      descEn:
        'Organize your studies into color-coded categories (e.g. Maths, Biology, Coding). Each subject houses its own dedicated flashcard decks, tasks, exams, grade weights, and mind maps.',
      badgeAr: 'التنظيم الشامل',
      badgeEn: 'Structured Learning',
    },
    {
      id: 'flashcards',
      icon: <BookOpen className="w-8 h-8 text-teal-400" />,
      titleAr: 'بطاقات التكرار المتباعد وتوليد الذكاء الاصطناعي',
      titleEn: 'Spaced Repetition & Gemini AI Generation',
      descAr:
        'استذكر بفاعلية مع بطاقات تفاعلية ثلاثية الأبعاد (جديدة، قيد التعلم، متقنة). يمكنك كتابة البطاقات يدوياً أو استخدام ذكاء Google Gemini لتوليد مجموعات كاملة فوراً من مذكراتك.',
      descEn:
        'Master concepts with 3D interactive flashcards tracking spaced repetition (New, Learning, Mastered). Create them manually or let Google Gemini extract high-yield cards from your study notes.',
      badgeAr: 'ذكاء اصطناعي BYOK',
      badgeEn: 'AI Powered',
    },
    {
      id: 'drag-resize',
      icon: <Move className="w-8 h-8 text-purple-400" />,
      titleAr: 'تحريك وتغيير أحجام ودجات اللوحة',
      titleEn: 'Draggable & Resizable Dashboard Widgets',
      descAr:
        'لوحة التحكم ملكك بالكامل! اسحب أي ودجت من مقبض الزاوية أو استخدم أزرار الأسهم لإعادة ترتيبها على الحاسوب والهاتف واللوحي. يمكنك أيضاً تغيير عرض أي ودجت مباشرة بضغطة زر (1/4، 1/3، 1/2، 2/3، كامل).',
      descEn:
        'Total control over your layout! Drag widgets by their header grip or use touch arrows to reposition them on desktop, tablet, and mobile. Resize any widget directly with one tap (1/4, 1/3, 1/2, 2/3, Full width).',
      badgeAr: 'مرونة كاملة',
      badgeEn: 'Fully Customizable',
    },
    {
      id: 'pomodoro',
      icon: <Clock className="w-8 h-8 text-amber-400" />,
      titleAr: 'مؤقت بومودورو قابل للتعديل الفوري',
      titleEn: 'Interactive & Editable Pomodoro Timer',
      descAr:
        'اضغط مباشرة على أرقام المؤقت لاختيار مدة التركيز التي تناسبك عبر خيارات سريعة (15، 25، 45، 60 دقيقة) أو أدخل دقائق مخصصة، مع جلسات ملء الشاشة وأصوات تنبيه هادئة.',
      descEn:
        'Click directly on the timer digits to instantly customize your focus duration using quick presets (15, 25, 45, 60 minutes) or custom inputs, complete with fullscreen focus and gentle chimes.',
      badgeAr: 'تركيز عميق',
      badgeEn: 'Deep Focus',
    },
    {
      id: 'calendar',
      icon: <Calendar className="w-8 h-8 text-blue-400" />,
      titleAr: 'تقويم Google والجدول الزمني غير المتصل',
      titleEn: 'Google Calendar & Offline Timeline',
      descAr:
        'اربط حسابك مع Google Calendar لجلب جدول مواعيدك لشهر كامل وحفظه ليعمل بدون إنترنت. تتضمن المواعيد زراً مقيداً بالوقت "تأكيد الإنجاز" يُفعّل عند بدء وقت المهمة لتعزيز الحماس اليومي.',
      descEn:
        'Connect Google Calendar to sync an entire month of scheduled events cached for offline viewing. Events include a time-gated "Confirm Completion" button unlocking when study time starts to build streaks.',
      badgeAr: 'تكامل تقويم Google',
      badgeEn: 'Calendar Sync',
    },
    {
      id: 'cloud-streak',
      icon: <Cloud className="w-8 h-8 text-emerald-400" />,
      titleAr: 'مزامنة Google Drive التلقائية وشعلة الحماس',
      titleEn: 'Google Drive Auto-Sync & Daily Streaks',
      descAr:
        'لا حاجة لعمل نسخ احتياطي يدوي! بمجرد تسجيل الدخول بحساب Google، يُحفظ كل تغيير (البطاقات، الإعدادات، المظهر، والترتيب) تلقائياً في مجلد Drive الآمن. أنجز جلساتك يومياً لرفع شعلة الـ Streak.',
      descEn:
        'Never worry about losing data! Once signed in with Google, every single change (cards, settings, theme, widget layout) automatically syncs to your private Drive. Keep studying daily to maintain your study streak!',
      badgeAr: 'حفظ تلقائي سحابي',
      badgeEn: 'Zero-Effort Cloud Sync',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="bg-[#12122a] border border-[#2a2a4a] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* STEP 0: LANGUAGE SELECTION */}
        {step === 0 ? (
          <div className="space-y-6 text-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-lg shadow-purple-900/30">
              <Globe className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#e8e8f0]">
                مرحباً بك في StudyFlow
              </h2>
              <p className="text-sm font-semibold text-purple-300">
                Welcome to StudyFlow
              </p>
              <p className="text-xs text-[#8888a8] max-w-sm mx-auto leading-relaxed pt-1">
                يرجى اختيار لغة الواجهة المفضلة لك لبدء الجولة التعريفية المتقدمة والتطبيق.
                <br />
                Please select your preferred language to begin the interactive walkthrough.
              </p>
            </div>

            {/* Language Selection Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onSelectLang('ar');
                  setStep(1);
                }}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                  isAr
                    ? 'bg-purple-600/20 border-purple-500 shadow-md shadow-purple-950'
                    : 'bg-[#1c1c3a] border-[#2a2a4a] hover:border-purple-500/40'
                }`}
              >
                <span className="text-2xl font-black text-white">العربية</span>
                <span className="text-xs font-semibold text-[#8888a8]">
                  واجهة عربية متكاملة (RTL)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectLang('en');
                  setStep(1);
                }}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                  !isAr
                    ? 'bg-purple-600/20 border-purple-500 shadow-md shadow-purple-950'
                    : 'bg-[#1c1c3a] border-[#2a2a4a] hover:border-purple-500/40'
                }`}
              >
                <span className="text-2xl font-black text-white">English</span>
                <span className="text-xs font-semibold text-[#8888a8]">
                  Full English Interface (LTR)
                </span>
              </button>
            </div>

            <p className="text-[11px] text-[#5a5a78]">
              {isAr
                ? 'يمكنك تغيير اللغة لاحقاً دائماً من صفحة الإعدادات.'
                : 'You can always change your language later in Settings.'}
            </p>
          </div>
        ) : (
          /* STEPS 1 to 6: SOPHISTICATED FEATURE TOUR */
          <div className="space-y-6">
            {/* Top Bar with step indicator & Skip button */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
                {isAr
                  ? tourSteps[step - 1].badgeAr
                  : tourSteps[step - 1].badgeEn}
              </span>

              <button
                type="button"
                onClick={onFinish}
                className="text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
              >
                {isAr ? 'تخطي' : 'Skip Tour'}
              </button>
            </div>

            {/* Step Content */}
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center mx-auto shadow-inner">
                {tourSteps[step - 1].icon}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-[#e8e8f0]">
                  {isAr
                    ? tourSteps[step - 1].titleAr
                    : tourSteps[step - 1].titleEn}
                </h3>
                <p className="text-xs text-[#8888a8] leading-relaxed max-w-md mx-auto">
                  {isAr
                    ? tourSteps[step - 1].descAr
                    : tourSteps[step - 1].descEn}
                </p>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {tourSteps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setStep(idx + 1)}
                  className={`h-1.5 rounded-full transition-all ${
                    step - 1 === idx
                      ? 'w-6 bg-purple-500 shadow-sm shadow-purple-500/50'
                      : 'w-2 bg-[#2a2a4a] hover:bg-[#3a3a5a]'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                disabled={step === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{isAr ? 'السابق' : 'Previous'}</span>
              </button>

              {step < tourSteps.length ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => prev + 1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>{isAr ? 'التالي' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onFinish}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.03] active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isAr ? 'ابدأ الاستخدام الآن' : 'Get Started Now'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
