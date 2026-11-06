import React, { useState, useEffect, useRef } from 'react';
import { Globe, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface WelcomeTourModalProps {
  isOpen: boolean;
  currentLang: 'ar' | 'en';
  onSelectLang: (lang: 'ar' | 'en') => void;
  onFinish: () => void;
}

interface TourStep {
  selector: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="workspace"]',
    titleAr: 'مساحة العمل والتنظيم',
    titleEn: 'StudyFlow Workspace',
    descAr: 'مساحتك المركزية لتنظيم جميع المواد الدراسية، البطاقات، والمهام بذكاء وسهولة.',
    descEn: 'Your centralized command center to organize subjects, flashcards, and study routines.',
  },
  {
    selector: '[data-tour="new-category"]',
    titleAr: 'إضافة مادة أو تصنيف',
    titleEn: 'Add a Category',
    descAr: 'أنشئ تصنيفك أو مادتك الدراسية الأولى هنا.',
    descEn: 'Create your first category here.',
  },
  {
    selector: '[data-tour="pomodoro"]',
    titleAr: 'مؤقت بومودورو القابل للتعديل',
    titleEn: 'Editable Pomodoro Timer',
    descAr: 'اضغط على أرقام المؤقت لاختيار مدة التركيز عبر خيارات سريعة (15، 25، 45، 60 دقيقة).',
    descEn: 'Click directly on the timer digits to customize your duration with quick presets.',
  },
  {
    selector: '[data-tour="drag-handle"]',
    titleAr: 'تحريك وتغيير حجم الودجات',
    titleEn: 'Draggable & Resizable Widgets',
    descAr: 'اسحب الودجت من مقبض النقاط الستة لإعادة ترتيب اللوحة، واستخدم زر الحجم لتغيير العرض.',
    descEn: 'Drag widgets by the six-dots handle to rearrange them, or tap size to cycle width.',
  },
  {
    selector: '[data-tour="timeline-btn"]',
    titleAr: 'الجدول الزمني وتقويم Google',
    titleEn: 'Timeline & Google Calendar',
    descAr: 'استورد مواعيدك من Google Calendar وتصفحها بدون إنترنت مع ميزة تأكيد الإنجاز.',
    descEn: 'Import your Google Calendar schedule, work offline, and confirm completed tasks.',
  },
  {
    selector: '[data-tour="quick-actions"]',
    titleAr: 'الإجراءات السريعة والذكاء الاصطناعي',
    titleEn: 'Quick Actions & AI Generator',
    descAr: 'أنشئ بطاقات استذكار فوراً أو استخدم ذكاء Google Gemini لتوليد مجموعات متكاملة.',
    descEn: 'Create flashcard decks manually or generate high-yield cards with Google Gemini.',
  },
  {
    selector: '[data-tour="streak-badge"]',
    titleAr: 'سلسلة الأيام الدراسية (Streak)',
    titleEn: 'Study Streak Flame',
    descAr: 'أنجز جلسات المذاكرة والمهام اليومية لرفع شعلة الحماس وبناء عادة دراسية مستمرة.',
    descEn: 'Complete pomodoros and calendar tasks daily to fuel your flame and maintain streaks.',
  },
  {
    selector: '[data-tour="profile-btn"]',
    titleAr: 'الملف الشخصي والحفظ السحابي',
    titleEn: 'Student Profile & Drive Auto-Sync',
    descAr: 'اربط حساب Google للمزامنة السحابية التلقائية، وخصص الثيمات ومفتاح Gemini BYOK.',
    descEn: 'Sign in with Google for automatic Drive sync, theme customization, and BYOK settings.',
  },
];

export const WelcomeTourModal: React.FC<WelcomeTourModalProps> = ({
  isOpen,
  currentLang,
  onSelectLang,
  onFinish,
}) => {
  // Step 0: Language selection modal.
  // Steps 1 to 8: Physical on-screen element spotlight tour.
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const isAr = currentLang === 'ar';

  const updateTargetRect = () => {
    if (step < 1 || step > TOUR_STEPS.length) {
      setTargetRect(null);
      return;
    }
    const currentTourStep = TOUR_STEPS[step - 1];
    const el = document.querySelector(currentTourStep.selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (step > 0) {
      updateTargetRect();
      const timer = setTimeout(updateTargetRect, 250);
      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateTargetRect);
        window.removeEventListener('scroll', updateTargetRect, true);
      };
    }
  }, [step, isOpen]);

  if (!isOpen) return null;

  // STEP 0: LANGUAGE SELECTION MODAL
  if (step === 0) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300"
      >
        <div className="bg-[#12122a] border border-[#2a2a4a] rounded-3xl p-7 sm:p-9 max-w-md w-full shadow-2xl space-y-6 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-lg shadow-purple-900/30">
            <Globe className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#e8e8f0]">
              اختر لغة الواجهة المفضلة
            </h2>
            <p className="text-sm font-bold text-purple-300">
              Choose Your Preferred Language
            </p>
            <p className="text-xs text-[#8888a8] leading-relaxed pt-1">
              يرجى اختيار لغة الواجهة للبدء بالجولة التفاعلية المصورة لكافة ميزات التطبيق.
              <br />
              Select your interface language to start the interactive walkthrough.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onSelectLang('ar');
                setStep(1);
              }}
              className="p-4 rounded-2xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500 hover:bg-purple-600/15 text-white font-black text-lg transition-all flex flex-col items-center gap-1.5 shadow-md active:scale-95"
            >
              <span>العربية</span>
              <span className="text-[11px] font-medium text-[#8888a8]">واجهة عربية (RTL)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectLang('en');
                setStep(1);
              }}
              className="p-4 rounded-2xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500 hover:bg-purple-600/15 text-white font-black text-lg transition-all flex flex-col items-center gap-1.5 shadow-md active:scale-95"
            >
              <span>English</span>
              <span className="text-[11px] font-medium text-[#8888a8]">English UI (LTR)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PHYSICAL ON-SCREEN SPOTLIGHT TOUR (STEPS 1 to 8)
  const currentTourStep = TOUR_STEPS[step - 1];
  const totalSteps = TOUR_STEPS.length;

  // Compute position for the floating tooltip card next to the spotlight target
  let tooltipTop = 120;
  let tooltipLeft = 20;

  if (targetRect) {
    // If there is enough room on the right (or left in RTL), position beside target
    const spaceRight = window.innerWidth - targetRect.right;
    const spaceBottom = window.innerHeight - targetRect.bottom;

    if (spaceRight > 380 && !isAr) {
      tooltipLeft = targetRect.right + 20;
      tooltipTop = Math.max(20, Math.min(window.innerHeight - 280, targetRect.top - 10));
    } else if (targetRect.left > 380 && isAr) {
      tooltipLeft = targetRect.left - 380;
      tooltipTop = Math.max(20, Math.min(window.innerHeight - 280, targetRect.top - 10));
    } else if (spaceBottom > 260) {
      tooltipTop = targetRect.bottom + 16;
      tooltipLeft = Math.max(20, Math.min(window.innerWidth - 380, targetRect.left));
    } else {
      tooltipTop = Math.max(20, targetRect.top - 240);
      tooltipLeft = Math.max(20, Math.min(window.innerWidth - 380, targetRect.left));
    }
  } else {
    // Center fallback if target element not currently visible in viewport
    tooltipTop = Math.max(50, window.innerHeight / 2 - 130);
    tooltipLeft = Math.max(20, window.innerWidth / 2 - 180);
  }

  return (
    <div className="fixed inset-0 z-[110] pointer-events-auto">
      {/* Semi-transparent dark overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
        onClick={onFinish}
      />

      {/* Target Element Spotlight Ring (Matching image_3ddb28e7.png) */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
          className="rounded-2xl ring-2 ring-purple-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.65),0_0_25px_rgba(168,85,247,0.5)] pointer-events-none transition-all duration-300 ease-out z-[111]"
        >
          {/* Subtle glowing outline animation */}
          <div className="w-full h-full rounded-2xl border-2 border-dashed border-teal-400/70 animate-pulse pointer-events-none" />
        </div>
      )}

      {/* Floating Tour Card (Faithfully reproducing image_3ddb28e7.png) */}
      <div
        style={{
          position: 'fixed',
          top: `${tooltipTop}px`,
          left: `${tooltipLeft}px`,
          width: '360px',
        }}
        className="z-[112] bg-[#12131a] border border-[#2a2c3a] rounded-3xl p-6 shadow-2xl shadow-black/80 space-y-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header Row: Diamond Icon + Centered Dots (image_3ddb28e7.png) */}
        <div className="flex items-center justify-between">
          {/* Diamond Icon */}
          <div className="w-5 h-5 rotate-45 border-2 border-[#8888a8]/60 rounded-[3px] bg-purple-500/10 shadow-sm shrink-0" />

          {/* Centered Pagination Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === step - 1
                    ? 'w-4 bg-purple-400 shadow-sm shadow-purple-400/50'
                    : 'bg-[#3a3c4a]'
                }`}
              />
            ))}
          </div>

          <div className="w-5 h-5" />
        </div>

        {/* Title & Body Description */}
        <div className="space-y-1.5 text-start">
          <h3 className="text-lg font-black text-white tracking-tight">
            {isAr ? currentTourStep.titleAr : currentTourStep.titleEn}
          </h3>
          <p className="text-xs text-[#a0a5b8] leading-relaxed">
            {isAr ? currentTourStep.descAr : currentTourStep.descEn}
          </p>
        </div>

        {/* Footer Navigation Bar (image_3ddb28e7.png) */}
        <div className="flex items-center justify-between pt-2">
          {/* Skip tour button */}
          <button
            type="button"
            onClick={onFinish}
            className="text-xs font-semibold text-[#80859a] hover:text-[#e8e8f0] transition-colors"
          >
            {isAr ? 'تخطي الجولة' : 'Skip tour'}
          </button>

          {/* Step Indicator (e.g., 2 / 8) */}
          <span className="text-xs font-mono font-bold text-[#80859a]">
            {step} / {totalSteps}
          </span>

          {/* Prev & Next Buttons */}
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                className="text-xs font-bold text-[#b8b8d0] hover:text-white px-2.5 py-1.5 transition-colors"
              >
                {isAr ? 'السابق' : 'Prev'}
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl bg-[#4a5568] hover:bg-[#5a6578] text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                {isAr ? 'التالي' : 'Next'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onFinish}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isAr ? 'إنهاء' : 'Finish'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
