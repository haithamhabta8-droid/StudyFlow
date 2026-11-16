import React from 'react';
import { X, Eye, EyeOff, RotateCcw, ChevronUp, ChevronDown, LayoutGrid } from 'lucide-react';
import { WidgetConfig, WidgetSize } from '../../types/index.ts';
import { DASHBOARD_PRESETS, DEFAULT_WIDGETS } from '../../utils/storage.ts';

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  dashboardWidgets: WidgetConfig[];
  lang: 'ar' | 'en';
  onClose: () => void;
  onUpdateWidgets: (updated: WidgetConfig[]) => void;
}

export const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
  isOpen,
  dashboardWidgets,
  lang,
  onClose,
  onUpdateWidgets,
}) => {
  if (!isOpen) return null;

  const handleToggleVisible = (id: string) => {
    const updated = dashboardWidgets.map((w) =>
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    onUpdateWidgets(updated);
  };

  const handleChangeSize = (id: string, size: WidgetSize) => {
    const updated = dashboardWidgets.map((w) =>
      w.id === id ? { ...w, size } : w
    );
    onUpdateWidgets(updated);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= dashboardWidgets.length) return;
    const next = [...dashboardWidgets];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    onUpdateWidgets(next);
  };

  const handleApplyPreset = (presetKey: 'bento' | 'classic' | 'compact' | 'fourColumn') => {
    const visibilityMap = new Map<string, boolean>(
      dashboardWidgets.map((w) => [w.id, w.visible])
    );
    const applied = DASHBOARD_PRESETS[presetKey].map((w) => ({
      ...w,
      visible: visibilityMap.has(w.id) ? Boolean(visibilityMap.get(w.id)) : w.visible,
    }));
    onUpdateWidgets(applied);
  };

  const handleReset = () => {
    onUpdateWidgets(JSON.parse(JSON.stringify(DEFAULT_WIDGETS)));
  };

  const widgetNameMap: Record<string, string> = {
    pomodoro: lang === 'ar' ? 'مؤقت بومودورو' : 'Pomodoro Timer',
    stats: lang === 'ar' ? 'إحصائيات سريعة' : 'Quick Stats',
    aiUsage: lang === 'ar' ? 'استخدام الذكاء الاصطناعي' : 'AI Daily Usage',
    goals: lang === 'ar' ? 'الأهداف اليومية والأسبوعية' : 'Study Goals Progress',
    streak: lang === 'ar' ? 'تقويم سلسلة الأيام' : 'Streak Calendar',
    weeklyActivity: lang === 'ar' ? 'نشاط الأسبوع' : 'Weekly Activity',
    activity: lang === 'ar' ? 'نشاط الأسبوع' : 'Weekly Activity',
    sessions: lang === 'ar' ? 'جلسات اليوم' : "Today's Sessions",
    sessionsToday: lang === 'ar' ? 'جلسات اليوم' : "Today's Sessions",
    exams: lang === 'ar' ? 'الاختبارات القادمة' : 'Upcoming Exams',
    tasks: lang === 'ar' ? 'مهام اليوم' : "Today's Tasks",
    grades: lang === 'ar' ? 'ملخص الدرجات' : 'Grades Summary',
    quizzes: lang === 'ar' ? 'متوسط الكويزات' : 'Quiz Average',
    quizAvg: lang === 'ar' ? 'متوسط الكويزات' : 'Quiz Average',
    actions: lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions',
  };

  const sizeLabels: Record<WidgetSize, string> = {
    quarter: lang === 'ar' ? 'ربع العرض' : 'Quarter (1/4)',
    third: lang === 'ar' ? 'ثلث العرض' : 'Third (1/3)',
    half: lang === 'ar' ? 'نصف العرض' : 'Half (1/2)',
    'two-thirds': lang === 'ar' ? 'ثلثي العرض' : 'Two-Thirds (2/3)',
    full: lang === 'ar' ? 'كامل العرض' : 'Full Width',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="bg-[#12122a] border border-[#2a2a4a] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-[#e8e8f0]">
            {lang === 'ar' ? 'تخصيص اللوحة' : 'Customize Dashboard'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8888a8] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#8888a8] leading-relaxed">
          {lang === 'ar'
            ? 'اختر تخطيطاً جاهزاً أو اسحب البطاقات وغيّر أحجامها بحرية في أي مكان على اللوحة.'
            : 'Choose a layout preset or drag and resize any widget freely across the dashboard.'}
        </p>

        {/* One-Click Layout Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-[#8888a8] flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? 'قوالب التخطيط السريعة' : 'Quick Layout Presets'}</span>
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('bento')}
              className="px-2.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold text-emerald-300 transition-all text-center"
            >
              {lang === 'ar' ? 'بينتو (موصى به)' : 'Bento'}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('fourColumn')}
              className="px-2.5 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/40 text-xs font-bold text-[#e8e8f0] transition-all text-center"
            >
              {lang === 'ar' ? '4 أعمدة (1/4)' : '4 Columns (1/4)'}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('compact')}
              className="px-2.5 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/40 text-xs font-bold text-[#e8e8f0] transition-all text-center"
            >
              {lang === 'ar' ? '3 أعمدة (1/3)' : '3 Columns (1/3)'}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('classic')}
              className="px-2.5 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/40 text-xs font-bold text-[#e8e8f0] transition-all text-center"
            >
              {lang === 'ar' ? 'نصفين (1/2)' : '2 Columns (1/2)'}
            </button>
          </div>
        </div>

        {/* Widgets List */}
        <div className="max-h-80 overflow-y-auto space-y-2.5 pe-1">
          {dashboardWidgets.map((w, idx) => (
            <div
              key={w.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all gap-3 ${
                w.visible
                  ? 'bg-[#1c1c3a] border-[#2a2a4a]'
                  : 'bg-[#12122a] border-[#2a2a4a]/40 opacity-60'
              }`}
            >
              {/* Left / Start: Size Selector & Reorder buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={w.size}
                  disabled={!w.visible}
                  onChange={(e) => handleChangeSize(w.id, e.target.value as WidgetSize)}
                  className="px-3 py-1.5 rounded-xl bg-[#12122a] border border-[#2a2a4a] text-xs font-bold text-[#e8e8f0] focus:outline-none focus:border-emerald-500 disabled:opacity-40 transition-colors"
                >
                  <option value="quarter">{sizeLabels['quarter']}</option>
                  <option value="third">{sizeLabels['third']}</option>
                  <option value="half">{sizeLabels['half']}</option>
                  <option value="two-thirds">{sizeLabels['two-thirds']}</option>
                  <option value="full">{sizeLabels['full']}</option>
                </select>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                    title={lang === 'ar' ? 'تحريك للأعلى' : 'Move up'}
                    className="p-1 rounded text-[#8888a8] hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === dashboardWidgets.length - 1}
                    onClick={() => handleMove(idx, 1)}
                    title={lang === 'ar' ? 'تحريك للأسفل' : 'Move down'}
                    className="p-1 rounded text-[#8888a8] hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Center / Title */}
              <div className="flex-1 min-w-0 text-center">
                <span
                  className={`text-xs font-bold truncate block ${
                    w.visible ? 'text-[#e8e8f0]' : 'text-[#5a5a78] line-through'
                  }`}
                >
                  {widgetNameMap[w.id] || w.id}
                </span>
              </div>

              {/* Right / End: Visibility Toggle Eye Button */}
              <button
                type="button"
                onClick={() => handleToggleVisible(w.id)}
                className={`p-2 rounded-xl border transition-all shrink-0 ${
                  w.visible
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-[#12122a] border-[#2a2a4a] text-[#5a5a78] hover:text-[#8888a8]'
                }`}
                title={w.visible ? (lang === 'ar' ? 'إخفاء' : 'Hide') : (lang === 'ar' ? 'إظهار' : 'Show')}
              >
                {w.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#2a2a4a]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إعادة تعيين' : 'Reset Defaults'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-900/30 transition-all active:scale-95"
          >
            {lang === 'ar' ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
