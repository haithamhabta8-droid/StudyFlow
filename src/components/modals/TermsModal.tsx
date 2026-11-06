import React, { useState } from 'react';
import { X, ShieldCheck, FileText, ExternalLink } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  initialTab?: 'terms' | 'privacy';
  lang: 'ar' | 'en';
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  initialTab = 'terms',
  lang,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="bg-[#12122a] border border-[#2a2a4a] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#2a2a4a] flex items-center justify-between bg-[#161632]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              {activeTab === 'terms' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#e8e8f0]">
                {activeTab === 'terms'
                  ? isAr
                    ? 'شروط الخدمة (Terms of Service)'
                    : 'Terms of Service'
                  : isAr
                  ? 'سياسة الخصوصية (Privacy Policy)'
                  : 'Privacy Policy'}
              </h2>
              <span className="text-[11px] text-[#8888a8]">
                {isAr ? 'آخر تحديث: نوفمبر 2026' : 'Last updated: November 2026'} · StudyFlow
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8888a8] hover:text-white hover:bg-[#2a2a4a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-[#2a2a4a]/60 bg-[#12122a]">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-[#8888a8] hover:text-[#e8e8f0]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isAr ? 'شروط الخدمة' : 'Terms of Service'}</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-[#8888a8] hover:text-[#e8e8f0]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
          </button>

          <a
            href={activeTab === 'terms' ? './terms.html' : './privacy.html'}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-auto pb-3 text-[11px] font-semibold text-[#8888a8] hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            <span>{isAr ? 'فتح في صفحة منفصلة' : 'Open in new tab'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#b8b8d0] leading-relaxed">
          {activeTab === 'terms' ? (
            <>
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-200">
                <strong>{isAr ? 'ملخص شروط الخدمة:' : 'Terms Summary:'}</strong>{' '}
                {isAr
                  ? 'StudyFlow هي أداة دراسية شخصية مخصصة لمساعدتك على تنظيم المذاكرة والبطاقات التعليمية والمؤقتات. استخدامك للتطبيق يعني موافقتك على استخدام الميزات بأمان ومسؤولية.'
                  : 'StudyFlow is a personal study companion engineered to help you manage spaced-repetition flashcards, pomodoro sessions, and study schedules responsibly.'}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#e8e8f0]">
                  1. {isAr ? 'نطاق الخدمة والاستخدام' : 'Description of Service & Fair Use'}
                </h3>
                <p>
                  {isAr
                    ? 'يوفر تطبيق StudyFlow بطاقات تعليمية، إدارة مهام، وجدول زمني مع ميزات اختيارية لمزامنة Google Drive و Google Calendar وتوليد الذكاء الاصطناعي عبر Google Gemini. التطبيق متاح للاستخدام الشخصي والتعليمي.'
                    : 'StudyFlow provides flashcards, task management, pomodoro timers, offline-ready timeline schedules, and optional Google Drive and Google Calendar integrations.'}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#e8e8f0]">
                  2. {isAr ? 'خدمات Google الخارجية والتراخيص' : 'Google API & Cloud Services'}
                </h3>
                <p>
                  {isAr
                    ? 'عند اختيار ربط حساب Google الخاص بك، يطلب التطبيق إذن الوصول لمجلد التطبيق فقط في Google Drive (appDataFolder) وجدول المواعيد للقراءة فقط (calendar.readonly). لا يدعي التطبيق أي ملكية لبياناتك، وتخضع خدمات Google لشروط Google الخاصة.'
                    : 'When you choose to connect your Google account, StudyFlow requests access strictly to its isolated private appDataFolder and read-only calendar access. StudyFlow never claims ownership over your data and complies with Google API Services User Data Policy.'}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#e8e8f0]">
                  3. {isAr ? 'مسؤولية مفاتيح API وبيانات الدراسة' : 'User Responsibility & BYOK API Keys'}
                </h3>
                <p>
                  {isAr
                    ? 'أنت المسؤول الوحيد عن سرية مفاتيح Google Gemini API التي تدخلها في التطبيق وعن حفظ نسخ احتياطية دورية عبر خيارات التصدير المتوفرة.'
                    : 'You are responsible for keeping your personal Gemini API keys secure. Your keys and flashcards are processed directly on your client browser.'}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#e8e8f0]">
                  4. {isAr ? 'إخلاء المسؤولية والدعم' : 'Disclaimer of Warranty & Contact'}
                </h3>
                <p>
                  {isAr
                    ? 'يُقدَّم التطبيق "كما هو" لأغراض تعليمية. لأي استفسارات أو دعم قانوني، يمكنك التواصل مباشرة عبر: haithamhabta8@gmail.com'
                    : 'StudyFlow is provided "as is" for educational purposes. For inquiries, email: haithamhabta8@gmail.com'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                <strong>{isAr ? 'التزام الخصوصية التام:' : 'Privacy Commitment:'}</strong>{' '}
                {isAr
                  ? 'خصوصيتك مقدسة. StudyFlow تطبيق يعمل في المتصفح المحلي. نحن لا نبيع بياناتك، ولا نتتبعك عبر المواقع، ولا نصل إلى أي ملفات شخصية غير مصرح بها.'
                  : 'Your privacy is paramount. StudyFlow runs locally in your browser. We never sell your data, track you across websites, or read unauthorized personal files.'}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#e8e8f0]">
                  1. {isAr ? 'البيانات التي يعالجها التطبيق' : 'Information We Handle'}
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>{isAr ? 'بيانات الدراسة:' : 'Study Data:'}</strong>{' '}
                    {isAr
                      ? 'البطاقات والمواد والمؤقتات والدرجات تُخزن محلياً في متصفحك (localStorage & Cookies).'
                      : 'Flashcards, subjects, timers, and grades stored locally in browser storage.'}
                  </li>
                  <li>
                    <strong>{isAr ? 'معلومات Google (اختيارية):' : 'Google Account (Optional):'}</strong>{' '}
                    {isAr
                      ? 'الاسم، البريد، والصورة لعرض ملفك الشخصي فقط.'
                      : 'Name, email, and avatar strictly to personalize your student profile.'}
                  </li>
                  <li>
                    <strong>{isAr ? 'مفتاح Gemini API (اختياري):' : 'Gemini API Key (Optional):'}</strong>{' '}
                    {isAr
                      ? 'يُخزن محلياً لتوجيه الطلبات مباشرة لخوادم Google Gemini الرسمية.'
                      : 'Stored locally to make direct, authenticated requests to Google AI Studio.'}
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#e8e8f0]">
                  2. {isAr ? 'امتثال نطاقات Google المحدودة' : 'Google Limited Use Disclosure'}
                </h3>
                <p>
                  {isAr
                    ? 'StudyFlow يلتزم بسياسة استخدام بيانات مستخدمي خدمات Google API بما في ذلك متطلبات الاستخدام المحدود (Limited Use). يستخدم التطبيق فقط نطاق https://www.googleapis.com/auth/drive.appdata لحفظ ملف النسخة الاحتياطية studyflow_backup.json ونطاق https://www.googleapis.com/auth/calendar.readonly لعرض جدول مواعيدك في المخطط الزمني.'
                    : 'StudyFlow complies with Google API Services User Data Policy including the Limited Use requirements. We strictly use https://www.googleapis.com/auth/drive.appdata for our single backup file and https://www.googleapis.com/auth/calendar.readonly to display scheduled timeline study events.'}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#e8e8f0]">
                  3. {isAr ? 'حذف البيانات والتحكم بها' : 'Data Control & Deletion'}
                </h3>
                <p>
                  {isAr
                    ? 'يمكنك في أي وقت مسح كافة بياناتك بضغطة زر واحدة من قائمة الإعدادات ("مسح كافة البيانات") أو إلغاء ربط حساب Google وحذف النسخة الاحتياطية.'
                    : 'You have full data ownership: export full JSON anytime, reset all local storage, or disconnect Google to revoke access.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a4a] bg-[#161632] flex items-center justify-between">
          <span className="text-[11px] text-[#8888a8]">
            StudyFlow · Google API Compliant
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
