import React, { useState } from 'react';
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
  GripVertical,
  ChevronUp,
  ChevronDown,
  Maximize,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { AppState, Category, WidgetConfig, WidgetSize } from '../types/index.ts';
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
  onReorderWidgets?: (widgets: WidgetConfig[]) => void;
  onChangeWidgetSize?: (widgetId: string, newSize: WidgetSize) => void;
  onUpdatePomoDuration?: (minutes: number) => void;
  onNavigateToTimeline?: () => void;
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
  onReorderWidgets,
  onChangeWidgetSize,
  onUpdatePomoDuration,
  onNavigateToTimeline,
}) => {
  // Inline Pomodoro Timer Editing State
  const [isEditingPomo, setIsEditingPomo] = useState(false);
  const [customPomoMinutes, setCustomPomoMinutes] = useState(
    Math.round(pomoTotalDuration / 60) || 25
  );

  // Widget Drag and Reorder State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Aggregate stats across all categories
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

  // Reordering helpers
  const handleMoveWidget = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= widgets.length) return;
    const nextWidgets = [...widgets];
    const temp = nextWidgets[index];
    nextWidgets[index] = nextWidgets[targetIdx];
    nextWidgets[targetIdx] = temp;
    if (onReorderWidgets) {
      onReorderWidgets(nextWidgets);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const nextWidgets = [...widgets];
    const item = nextWidgets.splice(draggedIdx, 1)[0];
    nextWidgets.splice(index, 0, item);
    setDraggedIdx(index);
    if (onReorderWidgets) {
      onReorderWidgets(nextWidgets);
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Size cycling helper: quarter -> third -> half -> two-thirds -> full -> quarter
  const handleCycleSize = (widgetId: string, currentSize: WidgetSize) => {
    const order: WidgetSize[] = ['third', 'half', 'two-thirds', 'full'];
    const currentIdx = order.indexOf(currentSize);
    const nextSize = order[(currentIdx + 1) % order.length];
    if (onChangeWidgetSize) {
      onChangeWidgetSize(widgetId, nextSize);
    }
  };

  // Universal Widget Controls Toolbar
  const renderWidgetHeaderControls = (
    widgetId: string,
    currentSize: WidgetSize,
    index: number,
    extraAction?: React.ReactNode
  ) => {
    return (
      <div className="flex items-center gap-1 shrink-0">
        {extraAction}

        {/* Resize pill button */}
        <button
          type="button"
          onClick={() => handleCycleSize(widgetId, currentSize)}
          title={lang === 'ar' ? `تغيير الحجم: حالياً ${currentSize}` : `Resize widget (currently ${currentSize})`}
          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#1c1c3a] border border-[#2a2a4a] text-[#8888a8] hover:text-[#e8e8f0] hover:border-purple-500/40 transition-colors"
        >
          {currentSize === 'quarter'
            ? '1/4'
            : currentSize === 'third'
            ? '1/3'
            : currentSize === 'half'
            ? '1/2'
            : currentSize === 'two-thirds'
            ? '2/3'
            : 'Full'}
        </button>

        {/* Move Up Button (touch friendly) */}
        <button
          type="button"
          disabled={index === 0}
          onClick={() => handleMoveWidget(index, -1)}
          title={lang === 'ar' ? 'تحريك للأعلى' : 'Move up'}
          className="p-1 rounded-lg text-[#8888a8] hover:text-white disabled:opacity-20 transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        {/* Move Down Button (touch friendly) */}
        <button
          type="button"
          disabled={index === widgets.length - 1}
          onClick={() => handleMoveWidget(index, 1)}
          title={lang === 'ar' ? 'تحريك للأسفل' : 'Move down'}
          className="p-1 rounded-lg text-[#8888a8] hover:text-white disabled:opacity-20 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* Drag handle */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          title={lang === 'ar' ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
          className="cursor-grab active:cursor-grabbing p-1 rounded-lg text-[#8888a8] hover:text-purple-400 transition-colors"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Scope & Customization Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12122a] border border-[#2a2a4a] p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
          <span className="text-xs font-bold text-[#e8e8f0]">
            {t('scopeAll', lang)}
          </span>
          <span className="text-xs text-[#8888a8]">
            ({state.categories.length} {t('categories', lang)})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToTimeline && (
            <button
              onClick={onNavigateToTimeline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/15 border border-purple-500/30 hover:bg-purple-600/25 text-xs font-bold text-purple-300 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'ar' ? 'الجدول الزمني' : 'Timeline'}</span>
            </button>
          )}

        </div>
      </div>

      {/* Grid of Draggable Widgets */}
      <div className="grid grid-cols-12 gap-5">
        {widgets.map((w, index) => {
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

                    {renderWidgetHeaderControls(
                      w.id,
                      w.size,
                      index,
                      <button
                        onClick={onOpenFullscreenPomo}
                        title={t('fullscreen', lang)}
                        aria-label={t('fullscreen', lang)}
                        className="p-1 rounded-lg text-[#8888a8] hover:text-[#e8e8f0] hover:bg-[#1c1c3a] transition-colors"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Inline Timer Editor Mode */}
                  {isEditingPomo ? (
                    <div className="p-3.5 rounded-xl bg-[#1c1c3a] border border-purple-500/40 space-y-3 my-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#e8e8f0]">
                        <span className="flex items-center gap-1.5 text-purple-300">
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'تعديل مدة التركيز' : 'Edit Focus Duration'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingPomo(false)}
                          className="text-[#8888a8] hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Presets: 15, 25, 45, 60 minutes */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {[15, 25, 45, 60].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => {
                              if (onUpdatePomoDuration) {
                                onUpdatePomoDuration(mins);
                              }
                              setCustomPomoMinutes(mins);
                              setIsEditingPomo(false);
                            }}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                              Math.round(pomoTotalDuration / 60) === mins
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-[#12122a] border border-[#2a2a4a] text-[#8888a8] hover:text-[#e8e8f0] hover:border-purple-500/30'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>

                      {/* Direct Custom Minute Input */}
                      <div className="flex items-center gap-2 pt-1 border-t border-[#2a2a4a]/60">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={customPomoMinutes}
                          onChange={(e) => setCustomPomoMinutes(Number(e.target.value))}
                          className="w-16 px-2.5 py-1 rounded-lg bg-[#12122a] border border-[#2a2a4a] text-xs font-mono font-bold text-[#e8e8f0] focus:outline-none focus:border-purple-500"
                        />
                        <span className="text-xs text-[#8888a8]">
                          {lang === 'ar' ? 'دقيقة مخصصة' : 'custom min'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (customPomoMinutes > 0 && onUpdatePomoDuration) {
                              onUpdatePomoDuration(customPomoMinutes);
                            }
                            setIsEditingPomo(false);
                          }}
                          className="ms-auto flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'تطبيق' : 'Apply'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Timer Display with Click-to-Edit Trigger */
                    <div className="flex items-center gap-6 py-2">
                      {/* Clickable Ring */}
                      <div
                        onClick={() => !isPomoRunning && setIsEditingPomo(true)}
                        title={
                          isPomoRunning
                            ? 'Pause timer to edit'
                            : lang === 'ar'
                            ? 'اضغط لتعديل المدة'
                            : 'Click to edit duration'
                        }
                        className={`relative w-24 h-24 shrink-0 flex items-center justify-center group ${
                          !isPomoRunning ? 'cursor-pointer' : ''
                        }`}
                      >
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-mono font-extrabold text-lg text-[#e8e8f0] group-hover:text-purple-300 transition-colors">
                            {formatTimer(pomoTimeLeft)}
                          </span>
                          {!isPomoRunning && (
                            <span className="text-[9px] text-[#8888a8] opacity-0 group-hover:opacity-100 transition-opacity">
                              {lang === 'ar' ? 'تعديل' : 'Edit'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details and controls */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                            {pomoMode === 'focus' ? t('focus', lang) : t('break', lang)}
                          </span>
                          {!isPomoRunning && (
                            <button
                              type="button"
                              onClick={() => setIsEditingPomo(true)}
                              className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold underline flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{lang === 'ar' ? 'تغيير' : 'Change'}</span>
                            </button>
                          )}
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
                  )}
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetStats', lang)}
                      </h3>
                    </div>
                    {renderWidgetHeaderControls(w.id, w.size, index)}
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

            case 'aiUsage':
              return (
                <div
                  key="aiUsage"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetAiUsage', lang)}
                      </h3>
                    </div>
                    {renderWidgetHeaderControls(
                      w.id,
                      w.size,
                      index,
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Gemini 3.8 Flash
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8888a8]">
                        {lang === 'ar' ? 'الاستدعاءات اليومية' : 'Daily Calls'}
                      </span>
                      <span className="font-mono font-bold text-[#e8e8f0]">
                        {state.settings.aiUsageToday || 0} / 50
                      </span>
                    </div>

                    <div className="w-full bg-[#1c1c3a] rounded-full h-2 overflow-hidden border border-[#2a2a4a]/50">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            ((state.settings.aiUsageToday || 0) / 50) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    {!state.settings.apiKey && (
                      <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
                        <span className="text-purple-300 text-[11px]">
                          {t('pleaseAddKey', lang)}
                        </span>
                        <button
                          onClick={onOpenSettings}
                          className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shrink-0"
                        >
                          {t('openSettings', lang)}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );

            case 'goals':
              return (
                <div
                  key="goals"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetGoals', lang)}
                      </h3>
                    </div>
                    {renderWidgetHeaderControls(w.id, w.size, index)}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#8888a8]">
                          {t('dailyGoal', lang)} ({dailyGoal} {t('minutes', lang)})
                        </span>
                        <span className="font-mono font-bold text-[#e8e8f0]">
                          {todayMinutes} / {dailyGoal} min
                        </span>
                      </div>
                      <div className="w-full bg-[#1c1c3a] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${dailyGoalPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#8888a8]">
                          {t('weeklyGoal', lang)} ({weeklyGoal} {t('minutes', lang)})
                        </span>
                        <span className="font-mono font-bold text-[#e8e8f0]">
                          {weekTotalMinutes} / {weeklyGoal} min
                        </span>
                      </div>
                      <div className="w-full bg-[#1c1c3a] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${weeklyGoalPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );

            case 'streak':
              return (
                <div
                  key="streak"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-500" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetStreak', lang)}
                      </h3>
                    </div>
                    {renderWidgetHeaderControls(
                      w.id,
                      w.size,
                      index,
                      <button
                        onClick={onOpenStreakModal}
                        className="text-xs font-semibold text-purple-400 hover:text-purple-300"
                      >
                        {t('calTitle', lang)}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <Flame className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-[#e8e8f0]">
                        {todaySessions.length > 0 ? 1 : 0} {t('streakDays', lang)}
                      </div>
                      <p className="text-xs text-[#8888a8]">
                        {todaySessions.length > 0
                          ? t('streakActiveToday', lang)
                          : t('streakInactive', lang)}
                      </p>
                    </div>
                  </div>
                </div>
              );

            case 'weeklyActivity':
              return (
                <div
                  key="weeklyActivity"
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
                    {renderWidgetHeaderControls(
                      w.id,
                      w.size,
                      index,
                      <span className="text-xs font-bold text-purple-400">
                        {weekTotalMinutes} min {t('thisWeek', lang)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-2 pt-2">
                    {weekActivity.map((day) => {
                      const isToday = day.isToday;
                      const maxMin = Math.max(1, ...weekActivity.map((d) => d.minutes));
                      const barPct = Math.min(100, Math.round((day.minutes / maxMin) * 100));

                      return (
                        <div key={day.dateKey} className="flex flex-col items-center gap-1.5">
                          <div className="w-full bg-[#1c1c3a] rounded-xl h-20 flex flex-col justify-end p-1 border border-[#2a2a4a]/40">
                            {day.minutes > 0 ? (
                              <div
                                style={{ height: `${Math.max(15, barPct)}%` }}
                                className="w-full rounded-lg bg-gradient-to-t from-purple-600 to-teal-400 shadow-sm"
                              />
                            ) : null}
                          </div>
                          <span
                            className={`text-[10px] font-bold ${
                              isToday ? 'text-purple-400' : 'text-[#8888a8]'
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

            case 'sessions':
              return (
                <div
                  key="sessions"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetSessionsToday', lang)}
                      </h3>
                    </div>
                    {renderWidgetHeaderControls(
                      w.id,
                      w.size,
                      index,
                      <span className="text-xs text-[#8888a8]">
                        {todaySessions.length} {t('sessions', lang)}
                      </span>
                    )}
                  </div>

                  {todaySessions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#8888a8]">
                      {t('noSessions', lang)}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {todaySessions.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a]/40 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-400" />
                            <span className="font-semibold text-[#e8e8f0]">
                              {s.categoryTitle || 'Focus Session'}
                            </span>
                          </div>
                          <span className="font-mono text-[#8888a8]">{s.minutes} min</span>
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetExams', lang)}
                      </h3>
                    </div>
                    {renderWidgetHeaderControls(
                      w.id,
                      w.size,
                      index,
                      <button
                        onClick={onOpenAddExam}
                        className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('addExam', lang)}</span>
                      </button>
                    )}
                  </div>

                  {allExams.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#8888a8]">
                      {t('noExams', lang)}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {allExams.slice(0, 4).map((ex) => (
                        <div
                          key={ex.id}
                          onClick={() => onSelectCategory(ex.categoryId, 'exams')}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a]/40 hover:border-purple-500/30 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: ex.categoryColor }}
                            />
                            <span className="font-semibold text-[#e8e8f0]">{ex.title}</span>
                          </div>
                          <span className="text-[11px] font-bold text-amber-400">
                            {daysUntil(ex.date)} {t('daysLeft', lang)}
                          </span>
                        </div>
                      ))}
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetTasks', lang)}
                      </h3>
                    </div>
                    {renderWidgetHeaderControls(
                      w.id,
                      w.size,
                      index,
                      <button
                        onClick={onOpenAddTask}
                        className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('addTask', lang)}</span>
                      </button>
                    )}
                  </div>

                  {allTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#8888a8]">
                      {t('noTasks', lang)}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {allTasks.slice(0, 4).map((tk) => (
                        <div
                          key={tk.id}
                          onClick={() => onSelectCategory(tk.categoryId, 'tasks')}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a]/40 hover:border-purple-500/30 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tk.categoryColor }}
                            />
                            <span className="font-semibold text-[#e8e8f0]">{tk.title}</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-purple-400">
                            {tk.priority}
                          </span>
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
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetGrades', lang)}
                      </h3>
                    </div>
                    {renderWidgetHeaderControls(
                      w.id,
                      w.size,
                      index,
                      <span className="text-xs text-[#8888a8]">
                        {allGrades.length} {t('graded', lang)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-mono font-extrabold text-purple-400">
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

            case 'quizAverage':
              return (
                <div
                  key="quizAverage"
                  className={`${getSizeClass(
                    w.size
                  )} bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-purple-500/30`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                        {t('widgetQuizAvg', lang)}
                      </h3>
                    </div>
                    {renderWidgetHeaderControls(
                      w.id,
                      w.size,
                      index,
                      <span className="text-xs text-[#8888a8]">
                        {allQuizzes.length} {lang === 'ar' ? 'كويزات' : 'quizzes'}
                      </span>
                    )}
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                      {t('widgetActions', lang)}
                    </h3>
                    {renderWidgetHeaderControls(w.id, w.size, index)}
                  </div>
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
