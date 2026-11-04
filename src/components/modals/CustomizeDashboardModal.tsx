import React from 'react';
import { X, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { WidgetConfig, WidgetSize } from '../../types/index.ts';
import { DEFAULT_WIDGETS } from '../../utils/storage.ts';
import { t } from '../../utils/translations.ts';

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

  const handleReset = () => {
    onUpdateWidgets(JSON.parse(JSON.stringify(DEFAULT_WIDGETS)));
  };

  const widgetNameMap: Record<string, string> = {
    pomodoro: t('widgetPomodoro', lang),
    stats: t('widgetStats', lang),
    aiUsage: t('widgetAiUsage', lang),
    goals: t('widgetGoals', lang),
    activity: t('widgetActivity', lang),
    streak: t('widgetStreak', lang),
    sessionsToday: t('widgetSessionsToday', lang),
    exams: t('widgetExams', lang),
    tasks: t('widgetTasks', lang),
    grades: t('widgetGrades', lang),
    quizAvg: t('widgetQuizAvg', lang),
    actions: t('widgetActions', lang),
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-[#e8e8f0]">
            {t('customizeDashboard', lang)}
          </h3>
          <button onClick={onClose} className="text-[#8888a8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#8888a8]">
          {t('customizeHint', lang)}
        </p>

        {/* Widgets List */}
        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
          {dashboardWidgets.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a]/40 gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => handleToggleVisible(w.id)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    w.visible
                      ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                      : 'bg-[#12122a] border-[#2a2a4a] text-[#5a5a78]'
                  }`}
                >
                  {w.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <span
                  className={`text-xs font-bold truncate ${
                    w.visible ? 'text-[#e8e8f0]' : 'text-[#5a5a78] line-through'
                  }`}
                >
                  {widgetNameMap[w.id] || w.id}
                </span>
              </div>

              {/* Sizing dropdown */}
              <select
                value={w.size}
                disabled={!w.visible}
                onChange={(e) => handleChangeSize(w.id, e.target.value as WidgetSize)}
                className="px-2.5 py-1 rounded-lg bg-[#12122a] border border-[#2a2a4a] text-xs font-semibold text-[#8888a8] focus:outline-none disabled:opacity-40"
              >
                <option value="quarter">{t('sizeQuarter', lang)}</option>
                <option value="third">{t('sizeThird', lang)}</option>
                <option value="half">{t('sizeHalf', lang)}</option>
                <option value="two-thirds">{t('sizeTwoThirds', lang)}</option>
                <option value="full">{t('sizeFull', lang)}</option>
              </select>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#2a2a4a]">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('reset', lang)}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30"
          >
            {t('done', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
