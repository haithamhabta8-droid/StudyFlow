import React from 'react';
import { ShieldCheck, FileText, Cookie } from 'lucide-react';

interface FooterProps {
  lang: 'ar' | 'en';
  onOpenTerms: (tab: 'terms' | 'privacy') => void;
  onOpenCookies: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  lang,
  onOpenTerms,
  onOpenCookies,
}) => {
  const currentYear = new Date().getFullYear();
  const isAr = lang === 'ar';

  return (
    <footer className="mt-14 pt-8 pb-12 border-t border-[#2a2a4a]/40 text-xs text-[#8888a8]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Dynamic Copyright */}
        <div className="flex items-center gap-2">
          <span>
            © {currentYear} StudyFlow. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </span>
        </div>

        {/* Legal & Cookie links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onOpenTerms('terms')}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'شروط الخدمة' : 'Terms of Service'}</span>
          </button>

          <span className="text-[#2a2a4a]">·</span>

          <button
            type="button"
            onClick={() => onOpenTerms('privacy')}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
          </button>

          <span className="text-[#2a2a4a]">·</span>

          <button
            type="button"
            onClick={onOpenCookies}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <Cookie className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'إعدادات الكوكيز' : 'Cookie Settings'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
