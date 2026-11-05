import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ExternalLink, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DeleteAccountChallengeModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  onClose: () => void;
  onConfirmDelete: () => void;
}

// 5 distinct non-overlapping viewport position classes to move the confirmation dialog around
const POSITIONS = [
  'top-8 left-8 sm:top-16 sm:left-16', // Top Left
  'bottom-8 right-8 sm:bottom-16 sm:right-16', // Bottom Right
  'top-8 right-8 sm:top-16 sm:right-16', // Top Right
  'bottom-8 left-8 sm:bottom-16 sm:left-16', // Bottom Left
  'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', // Center
];

export const DeleteAccountChallengeModal: React.FC<DeleteAccountChallengeModalProps> = ({
  isOpen,
  lang,
  onClose,
  onConfirmDelete,
}) => {
  const [step, setStep] = useState(1);
  const [posIdx, setPosIdx] = useState(0);
  const [isFinalSuccess, setIsFinalSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (step < 5) {
      setStep((prev) => prev + 1);
      // Pick a different position each time
      setPosIdx((prev) => (prev + 1) % POSITIONS.length);
    } else {
      // Step 5 completed! Perform account deletion & show final Google Connected Apps link
      onConfirmDelete();
      setIsFinalSuccess(true);
    }
  };

  const handleOpenGoogleConnectedApps = () => {
    window.open('https://myaccount.google.com/connections', '_blank', 'noopener,noreferrer');
  };

  // If deletion is finalized, display the Google Connected Apps dialog
  if (isFinalSuccess) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
      >
        <div className="bg-[#12122a] border border-emerald-500/40 rounded-3xl p-7 max-w-md w-full shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-[#e8e8f0]">
              {lang === 'ar' ? 'تم حذف الحساب والبيانات محلياً' : 'Account & Local Data Deleted'}
            </h3>
            <p className="text-xs text-[#8888a8] mt-2 leading-relaxed">
              {lang === 'ar'
                ? 'تم مسح جميع بياناتك وجلساتك وفصل الجلسة. لإلغاء إذن StudyFlow تماماً من حساب Google الخاص بك، انقر على الزر أدناه لإدارة التطبيقات المرتبطة.'
                : 'All local study data and Google tokens have been erased. To completely revoke StudyFlow access from your Google Account, click the button below to open your Connected Apps.'}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleOpenGoogleConnectedApps}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>
                {lang === 'ar' ? 'فتح قائمة التطبيقات المرتبطة بـ Google' : 'Manage Google Connected Apps'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsFinalSuccess(false);
                setStep(1);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1c1c3a] hover:bg-[#242448] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPosClass = POSITIONS[posIdx];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm pointer-events-auto"
    >
      <div
        className={`fixed ${currentPosClass} z-[121] bg-[#12122a] border-2 border-rose-500/60 rounded-3xl p-6 max-w-sm w-full shadow-2xl shadow-rose-950/60 space-y-4 animate-in fade-in duration-200 transition-all`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              {lang === 'ar' ? `تأكيد أمني (${step} من 5)` : `Security Challenge (${step} of 5)`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep(1);
              onClose();
            }}
            className="text-[#8888a8] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="font-extrabold text-base text-[#e8e8f0]">
            {lang === 'ar' ? 'هل أنت متأكد حقاً من حذف حسابك؟' : 'Are you sure you want to delete your account?'}
          </h3>
          <p className="text-xs text-[#8888a8] mt-1.5 leading-relaxed">
            {lang === 'ar'
              ? `سيتم مسح كافة البطاقات والمواد ونسخ Google Drive الاحتياطية نهائياً. تأكيد الخطوة ${step}/5:`
              : `This will permanently delete all flashcards, subjects, and Google Drive backups. Step ${step}/5 verification:`}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1.5 pt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-rose-500' : 'bg-[#1c1c3a] border border-[#2a2a4a]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2a2a4a]">
          <button
            type="button"
            onClick={() => {
              setStep(1);
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl bg-[#1c1c3a] hover:bg-[#242448] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-900/40 transition-all hover:scale-105 active:scale-95"
          >
            {step < 5
              ? lang === 'ar'
                ? `نعم، أنا متأكد (${step}/5)`
                : `Yes, I am sure (${step}/5)`
              : lang === 'ar'
              ? 'تأكيد الحذف النهائي'
              : 'Confirm Final Deletion'}
          </button>
        </div>
      </div>
    </div>
  );
};
