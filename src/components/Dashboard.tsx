import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Layers,
  Award,
  Flame,
  CheckCircle2,
  Sliders,
  Calendar,
  CheckSquare,
  BookOpen,
  Plus,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppState, Category, WidgetConfig } from '../types/index.ts';
import {
  formatTimer,
  calculateCardStats,
  calculateWeeklyActivity,
  calculateWeightedGPA,
  daysUntil,
} from '../utils/calculations.ts';
import { t } from '../utils/translations.ts';

interface DashboardProps {
  state: AppState;
  pomoTimeLeft: number;
  pomoTotalDuration: number;
  isPomoRunning: boolean;
  pomoMode: 'focus' | 'break';
  lang: 'ar' | 'en';
  onTogglePomo: () => void;
  onResetPomo: () => void;
  onOpenFullscreenPomo: () => void;
  onOpenCustomize: () => void;
  onOpenStreakModal: () => void;
  onOpenNewCategory: () => void;
  onOpenNewDeck: () => void;
  onOpenGenerateCards: () => void;
  onOpenAddTask: () => void;
  onOpenAddExam: () => void;
  onSelectCategory: (id: string, tab?: string) => void;
  onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  state,
  pomoTimeLeft,
  pomoTotalDuration,
  isPomoRunning,
  pomoMode,
  lang,
  onTogglePomo,
  onResetPomo,
  onOpenFullscreenPomo,
  onOpenCustomize,
  onOpenStreakModal,
  onOpenNewCategory,
  onOpenNewDeck,
  onOpenGenerateCards,
  onOpenAddTask,
  onOpenAddExam,
  onSelectCategory,
  onOpenSettings,
}) => {
  // Aggregate stats across all categories (starts at 0 if no categories/decks exist)
  const cardStats = calculateCardStats(state.categories);

  // All completed pomodoro sessions across all categories
  const allSessions = state.categories.flatMap((c) => c.sessions || []);

  // Today's sessions
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaySessions = allSessions.filter((s) => {
    const d = new Date(s.ts).toISOString().slice(0, 10);
    return d === todayKey;
  });

  const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.minutes || 0), 0);

  // Weekly minutes
  const weekActivity = calculateWeeklyActivity(allSessions, lang);
  const weekTotalMinutes = weekActivity.reduce((acc, d) => acc + d.minutes, 0);

  // All grades
  const allGrades = state.categories.flatMap((c) => c.grades || []);
  const gpaInfo = calculateWeightedGPA(allGrades);

  // All exams upcoming
  const allExams = state.categories
    .flatMap((c) =>
      (c.exams || []).map((ex) => ({
        ...ex,
        categoryName: lang === 'ar' ? c.name : c.nameEn || c.name,
        categoryColor: c.color,
        categoryId: c.id,
      }))
    )
    .filter((ex) => daysUntil(ex.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  // All pending tasks
  const allTasks = state.categories
    .flatMap((c) =>
      (c.tasks || []).map((t) => ({
        ...t,
        categoryName: lang === 'ar' ? c.name : c.nameEn || c.name,
        categoryColor: c.color,
        categoryId: c.id,
      }))
    )
    .filter((t) => !t.done);

  // All quizzes
  const allQuizzes = state.categories.flatMap((c) => c.quizzes || []);
  const scoredQuizzes = allQuizzes.filter((q) => q.score !== undefined);
  const avgQuizScore =
    scoredQuizzes.length > 0
      ? Math.round(
          scoredQuizzes.reduce((acc, q) => acc + (q.score || 0), 0) / scoredQuizzes.length
        )
      : 0;

  // Goals
  const dailyGoal = state.settings.goalDaily || 60;
  const weeklyGoal = state.settings.goalWeekly || 420;
  const dailyGoalPct = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));
  const weeklyGoalPct = Math.min(100, Math.round((weekTotalMinutes / weeklyGoal) * 100));

  // Pomodoro circular progress
  const pomoProgress =
    pomoTotalDuration > 0 ? (pomoTotalDuration - pomoTimeLeft) / pomoTotalDuration : 0;
  const pomoStrokeOffset = 283 - 283 * pomoProgress;

  // Helper to map widget size to CSS grid columns
  const getSizeClass = (size: WidgetConfig['size']) => {
    switch (size) {
      case 'quarter':
        return 'col-span-12 md:col-span-6 lg:col-span-3';
      case 'third':
        return 'col-span-12 md:col-span-6 lg:col-span-4';
      case 'half':
        return 'col-span-12 lg:col-span-6';
      case 'two-thirds':
        return 'col-span-12 lg:col-span-8';
      case 'full':
      default:
        return 'col-span-12';
    }
  };

  const widgets = state.settings.dashboard || [];

  return (
    <div className="space-y-6">
      {/* Top Scope & Customization Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12122a] border border-[#2a2a4a] p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
          <span className="text-xs font-bold text-[#e8e8f0]">
            {t('scopeAll', lang)}
          </span>
          <span className="text-xs text-[#8888a8]">
            ({state.categories.length} {t('categories', lang)})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCustomize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('customizeDashboard', lang)}</span>
          </button>
        </div>
      </div>

      {/* Grid of Widgets */}
      <div className="grid grid-cols-12 gap-5">
        {widgets.map((w) => {
          if (!w.visible) return null;

          switch (w.id) {
            case 'pomodoro':
              return (
                <div
                  key="pomodoro"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30 flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetPomodoro', lang)}
                      </h3>
                    </div>
                    <button
                      onClick={onOpenFullscreenPomo}
                      title={t('fullscreen', lang)}
                      aria-label={t('fullscreen', lang)}
                      className="p-1 rounded-lg text-[#8888a8] hover:text-[#e8e8f0] hover:bg-[#1c1c3a] transition-colors"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-6 py-2">
                    {/* Ring */}
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45"
                          stroke="#1c1c3a"
                          strokeWidth="7"
                          fill="transparent"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45"
                          stroke={pomoMode === 'focus' ? 'var(--primary)' : 'var(--accent)'}
                          strokeWidth="8"
                          strokeLinecap="round"
                          fill="transparent"
                          strokeDasharray="283"
                          strokeDashoffset={pomoStrokeOffset}
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono font-extrabold text-lg text-[#e8e8f0]">
                          {formatTimer(pomoTimeLeft)}
                        </span>
                      </div>
                    </div>

                    {/* Details and controls */}
                    <div className="flex-1 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
                        {pomoMode === 'focus' ? t('focus', lang) : t('break', lang)}
                      </div>
                      <div className="text-xs text-[#8888a8]">
                        {t('nextBreak', lang)}: 05:00
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={onTogglePomo}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all"
                        >
                          {isPomoRunning ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-white" />
                              <span>{t('pause', lang)}</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>{t('start', lang)}</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={onResetPomo}
                          title={t('reset', lang)}
                          aria-label={t('reset', lang)}
                          className="p-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={onOpenFullscreenPomo}
                          className="px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-semibold text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
                        >
                          {t('fullscreen', lang)}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );

            case 'stats':
              return (
                <div
                  key="stats"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                      {t('widgetStats', lang)}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#1c1c3a] p-3 rounded-xl border border-[#2a2a4a]/50">
                      <div className="text-[11px] font-semibold text-[#8888a8] truncate">
                        {t('totalCards', lang)}
                      </div>
                      <div className="text-2xl font-extrabold font-mono text-[#e8e8f0] mt-1">
                        {cardStats.total}
                      </div>
                    </div>
                    <div className="bg-[#1c1c3a] p-3 rounded-xl border border-[#2a2a4a]/50">
                      <div className="text-[11px] font-semibold text-[#8888a8] truncate">
                        {t('mastered', lang)}
                      </div>
                      <div className="text-2xl font-extrabold font-mono text-teal-400 mt-1">
                        {cardStats.mastered}
                      </div>
                    </div>
                    <div className="bg-[#1c1c3a] p-3 rounded-xl border border-[#2a2a4a]/50">
                      <div className="text-[11px] font-semibold text-[#8888a8] truncate">
                        {t('streakDays', lang)}
                      </div>
                      <div className="text-2xl font-extrabold font-mono text-rose-400 mt-1">
                        {todaySessions.length > 0 ? 1 : 0}
                      </div>
                    </div>
                    <div className="bg-[#1c1c3a] p-3 rounded-xl border border-[#2a2a4a]/50">
                      <div className="text-[11px] font-semibold text-[#8888a8] truncate">
                        {t('graded', lang)}
                      </div>
                      <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1">
                        {allGrades.length}
                      </div>
                    </div>
                  </div>
                </div>
              );

            case 'aiUsage': {
              const activeApiKey = state.settings.apiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : '');
              return (
                <div
                  key="aiUsage"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30 flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetAiUsage', lang)}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {state.settings.model?.includes('4') ? 'Gemini 4 Argon' : state.settings.model?.includes('lite') ? 'Gemini 3.1 Flash Lite' : 'Gemini 3.8 Flash'}
                    </span>
                  </div>

                  <div className="space-y-3 py-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#8888a8]">Daily Calls</span>
                      <span className="font-mono text-[#e8e8f0]">
                        {state.settings.aiUsageToday || 0} / 50
                      </span>
                    </div>
                    <div className="w-full bg-[#1c1c3a] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-teal-400 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            ((state.settings.aiUsageToday || 0) / 50) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    {!activeApiKey ? (
                      <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-[#e8e8f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-purple-200 font-medium">Please add your API key in Settings</span>
                        <button
                          type="button"
                          onClick={onOpenSettings}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow-sm transition-colors shrink-0"
                        >
                          {t('openSettings', lang)}
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-teal-400 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready for generation (BYOK Active)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            case 'goals':
              return (
                <div
                  key="goals"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30 flex flex-col justify-between`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-purple-400" />
                    <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                      {t('widgetGoals', lang)}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-[#8888a8]">{t('dailyGoal', lang)}</span>
                        <span className="font-mono text-[#e8e8f0]">
                          {todayMinutes} / {dailyGoal} {t('minutes', lang)}
                        </span>
                      </div>
                      <div className="w-full bg-[#1c1c3a] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${dailyGoalPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-[#8888a8]">{t('weeklyGoal', lang)}</span>
                        <span className="font-mono text-[#e8e8f0]">
                          {weekTotalMinutes} / {weeklyGoal} {t('minutes', lang)}
                        </span>
                      </div>
                      <div className="w-full bg-[#1c1c3a] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${weeklyGoalPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );

            case 'activity':
              return (
                <div
                  key="activity"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetActivity', lang)}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-400">
                      {weekTotalMinutes} {t('minutes', lang)} {t('thisWeek', lang)}
                    </span>
                  </div>

                  {/* Bar Chart */}
                  <div className="flex items-end gap-2.5 sm:gap-4 h-32 pt-4">
                    {weekActivity.map((day, idx) => {
                      const maxMin = Math.max(60, ...weekActivity.map((d) => d.minutes));
                      const heightPct = Math.min(
                        100,
                        Math.max(4, Math.round((day.minutes / maxMin) * 100))
                      );

                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center h-full justify-end group"
                        >
                          <div className="w-full bg-[#1c1c3a] h-full rounded-xl flex items-end p-1 relative overflow-hidden">
                            <div
                              className={`w-full rounded-lg transition-all duration-500 ${
                                day.isToday
                                  ? 'bg-gradient-to-t from-purple-600 to-purple-400 shadow-sm shadow-purple-500/40'
                                  : day.minutes > 0
                                  ? 'bg-gradient-to-t from-teal-500 to-teal-400'
                                  : 'bg-transparent'
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                            {day.minutes > 0 && (
                              <span className="absolute top-1 inset-x-0 text-center font-mono text-[9px] font-bold text-[#8888a8]">
                                {day.minutes}m
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] mt-1.5 font-bold ${
                              day.isToday ? 'text-purple-400' : 'text-[#5a5a78]'
                            }`}
                          >
                            {day.dayLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );

            case 'streak':
              return (
                <div
                  key="streak"
                  onClick={onOpenStreakModal}
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30 cursor-pointer flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-500" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetStreak', lang)}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-purple-400 hover:underline">
                      {t('calTitle', lang)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                      <Flame className="w-8 h-8 fill-rose-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-mono font-extrabold text-[#e8e8f0]">
                        {todaySessions.length > 0 ? 1 : 0}{' '}
                        <span className="text-sm font-sans font-normal text-[#8888a8]">
                          {t('streakDays', lang)}
                        </span>
                      </div>
                      <p className="text-xs text-[#8888a8] mt-0.5">
                        {todaySessions.length > 0
                          ? t('streakActiveToday', lang)
                          : t('streakInactive', lang)}
                      </p>
                    </div>
                  </div>
                </div>
              );

            case 'sessionsToday':
              return (
                <div
                  key="sessionsToday"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetSessionsToday', lang)}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-[#8888a8]">
                      {todaySessions.length} {t('sessions', lang)}
                    </span>
                  </div>

                  {todaySessions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#5a5a78] italic">
                      {t('noSessions', lang)}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {todaySessions.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a]/40 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-[#e8e8f0] block truncate">
                              {s.note || t('focus', lang)}
                            </span>
                            <span className="text-[10px] text-[#8888a8]">
                              {new Date(s.ts).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-purple-400 shrink-0">
                            +{s.minutes} {t('minutes', lang)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );

            case 'exams':
              return (
                <div
                  key="exams"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetExams', lang)}
                      </h3>
                    </div>
                    <button
                      onClick={onOpenAddExam}
                      className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('addExam', lang)}</span>
                    </button>
                  </div>

                  {allExams.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#5a5a78] italic">
                      {t('noExams', lang)}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {allExams.slice(0, 4).map((ex) => {
                        const days = daysUntil(ex.date);
                        return (
                          <div
                            key={ex.id}
                            onClick={() => onSelectCategory(ex.categoryId, 'exams')}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a]/40 cursor-pointer hover:border-purple-500/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: ex.categoryColor }}
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-[#e8e8f0] block truncate">
                                  {ex.title}
                                </span>
                                <span className="text-[10px] text-[#8888a8]">
                                  {ex.categoryName} · {ex.date}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md font-mono shrink-0 ${
                                days <= 3
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                              }`}
                            >
                              {days === 0
                                ? t('dueToday', lang)
                                : `${days} ${t('daysLeft', lang)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );

            case 'tasks':
              return (
                <div
                  key="tasks"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetTasks', lang)}
                      </h3>
                    </div>
                    <button
                      onClick={onOpenAddTask}
                      className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('addTask', lang)}</span>
                    </button>
                  </div>

                  {allTasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#5a5a78] italic">
                      {t('noTasks', lang)}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {allTasks.slice(0, 4).map((tk) => (
                        <div
                          key={tk.id}
                          onClick={() => onSelectCategory(tk.categoryId, 'tasks')}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a]/40 cursor-pointer hover:border-purple-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: tk.categoryColor }}
                            />
                            <span className="font-semibold text-xs text-[#e8e8f0] truncate">
                              {tk.title}
                            </span>
                          </div>
                          {tk.due && (
                            <span className="text-[10px] text-[#8888a8] font-mono shrink-0">
                              {tk.due}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );

            case 'grades':
              return (
                <div
                  key="grades"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30 flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetGrades', lang)}
                      </h3>
                    </div>
                    <span className="text-xs text-[#8888a8]">
                      {allGrades.length} {t('graded', lang)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xl font-mono font-extrabold text-purple-400">
                        {gpaInfo.gpa}%
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#e8e8f0]">
                        {t('overallGpa', lang)}: {gpaInfo.letter}
                      </div>
                      <p className="text-[11px] text-[#8888a8] mt-1">
                        Weighted across all recorded assessments.
                      </p>
                    </div>
                  </div>
                </div>
              );

            case 'quizAvg':
              return (
                <div
                  key="quizAvg"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30 flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetQuizAvg', lang)}
                      </h3>
                    </div>
                    <span className="text-xs text-[#8888a8]">
                      {scoredQuizzes.length} {t('questions', lang)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xl font-mono font-extrabold text-teal-400">
                        {avgQuizScore}%
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#e8e8f0]">
                        {t('quizAvg', lang)}
                      </div>
                      <p className="text-[11px] text-[#8888a8] mt-1">
                        Accuracy score from completed quizzes.
                      </p>
                    </div>
                  </div>
                </div>
              );

            case 'actions':
              return (
                <div
                  key="actions"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <h3 className="font-extrabold text-sm text-[#e8e8f0] mb-3">
                    {t('widgetActions', lang)}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={onOpenNewCategory}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0] hover:text-purple-300 transition-all hover:-translate-y-0.5"
                    >
                      <Plus className="w-4 h-4 text-purple-400" />
                      <span>{t('newCategory', lang)}</span>
                    </button>
                    <button
                      onClick={onOpenNewDeck}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0] hover:text-purple-300 transition-all hover:-translate-y-0.5"
                    >
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span>{t('newDeck', lang)}</span>
                    </button>
                    <button
                      onClick={onOpenGenerateCards}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0] hover:text-purple-300 transition-all hover:-translate-y-0.5"
                    >
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      <span>{t('generateAI', lang)}</span>
                    </button>
                    <button
                      onClick={onOpenFullscreenPomo}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-xs font-bold text-purple-300 transition-all hover:-translate-y-0.5"
                    >
                      <Play className="w-4 h-4 fill-purple-300" />
                      <span>{t('start', lang)}</span>
                    </button>
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};
