import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { calculateStreak } from '../../utils/calculations.ts';
import { t } from '../../utils/translations.ts';

interface StreakModalProps {
  isOpen: boolean;
  sessionTimestamps: number[];
  studiedDates?: string[];
  lang: 'ar' | 'en';
  onClose: () => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({
  isOpen,
  sessionTimestamps,
  studiedDates = [],
  lang,
  onClose,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!isOpen) return null;

  // Convert studiedDates (YYYY-MM-DD) to pseudo timestamps so calculateStreak aggregates them
  const extraTimestamps = studiedDates.map((d) => {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day, 12, 0, 0).getTime();
  });

  const allTimestamps = [...sessionTimestamps, ...extraTimestamps];
  const streakInfo = calculateStreak(allTimestamps);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // First day of month
  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday, 6 is Saturday

  // Total days in month
  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const weekdaysAr = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdays = lang === 'ar' ? weekdaysAr : weekdaysEn;

  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = (lang === 'ar' ? monthNamesAr : monthNamesEn)[month];

  // Studied days in this month
  const studiedThisMonth = streakInfo.uniqueDays.filter((k) => {
    const [y, m] = k.split('-').map(Number);
    return y === year && m === month + 1;
  }).length;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h3 className="font-extrabold text-base text-[#e8e8f0]">
              {t('calTitle', lang)}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#8888a8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 3 KPI stats */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a]/40 text-center">
          <div>
            <div className="text-xl font-mono font-extrabold text-rose-400">
              {streakInfo.currentStreak}
            </div>
            <div className="text-[10px] text-[#8888a8] font-bold uppercase mt-0.5">
              {t('currentStreak', lang)}
            </div>
          </div>
          <div>
            <div className="text-xl font-mono font-extrabold text-amber-400">
              {streakInfo.bestStreak}
            </div>
            <div className="text-[10px] text-[#8888a8] font-bold uppercase mt-0.5">
              {t('bestStreak', lang)}
            </div>
          </div>
          <div>
            <div className="text-xl font-mono font-extrabold text-teal-400">
              {studiedThisMonth}
            </div>
            <div className="text-[10px] text-[#8888a8] font-bold uppercase mt-0.5">
              {t('daysStudied', lang)}
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-sm text-[#e8e8f0]">
            {monthName} {year}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg bg-[#1c1c3a] hover:bg-[#242448] text-[#8888a8] hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg bg-[#1c1c3a] hover:bg-[#242448] text-[#8888a8] hover:text-white"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Calendar Weekdays */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#5a5a78]">
          {weekdays.map((wd, i) => (
            <div key={i} className="py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {Array.from({ length: totalDays }).map((_, i) => {
            const dayNum = i + 1;
            const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const studied = streakInfo.uniqueDays.includes(dayKey);
            const isToday = dayKey === todayKey;

            return (
              <div
                key={dayNum}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center font-mono text-xs font-bold transition-all ${
                  studied
                    ? 'bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-900/40 font-extrabold'
                    : 'bg-[#1c1c3a] text-[#8888a8]'
                } ${isToday ? 'ring-2 ring-purple-400' : ''}`}
              >
                <span>{dayNum}</span>
                {studied && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-200 mt-0.5 shadow-sm" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 text-[11px] text-[#8888a8] pt-2 border-t border-[#2a2a4a]/40">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-gradient-to-tr from-rose-600 to-amber-500" />
            <span>{t('legendStudied', lang)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#1c1c3a]" />
            <span>{t('legendEmpty', lang)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md border-2 border-purple-400 bg-transparent" />
            <span>{t('legendToday', lang)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
