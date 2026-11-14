import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
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
  Edit3,
  Check,
  X,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  MeasuringStrategy,
  CollisionDetection,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppState, Category, WidgetConfig, WidgetSize } from '../types/index.ts';
import {
  formatTimer,
  calculateCardStats,
  calculateWeeklyActivity,
  calculateWeightedGPA,
  calculateStreak,
  getQualifiedStreakDates,
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

interface SortableWidgetProps {
  id: string;
  sizeClass: string;
  isCurrentlyDragged: boolean;
  isOverTarget: boolean;
  children: (dragHandleProps: any) => React.ReactNode;
}

const SortableWidgetWrapper: React.FC<SortableWidgetProps> = ({
  id,
  sizeClass,
  isCurrentlyDragged,
  isOverTarget,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 220ms cubic-bezier(0.2, 0, 0, 1)',
    zIndex: isCurrentlyDragged || isDragging ? 30 : isOverTarget ? 10 : 1,
  };

  const content = children({ ...attributes, ...listeners });
  if (!content) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${sizeClass} relative group/widget flex flex-col ${
        isCurrentlyDragged || isDragging
          ? 'opacity-30 border-2 border-dashed border-emerald-500/70 rounded-2xl bg-emerald-950/15'
          : isOverTarget
          ? 'ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-[#0a0a16] rounded-2xl'
          : ''
      }`}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {content}
      </div>
    </div>
  );
};

interface CardResizeHandleProps {
  widgetId: string;
  currentSize: WidgetSize;
  lang: 'ar' | 'en';
  gridRef: React.RefObject<HTMLDivElement | null>;
  onChangeSize?: (widgetId: string, newSize: WidgetSize) => void;
}

const CardResizeHandle: React.FC<CardResizeHandleProps> = ({
  widgetId,
  currentSize,
  lang,
  gridRef,
  onChangeSize,
}) => {
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}

    const containerEl = gridRef.current;
    const containerWidth = containerEl
      ? containerEl.getBoundingClientRect().width
      : window.innerWidth;
    const widgetCard = target.closest('.group\\/widget') as HTMLElement;
    const widgetRect = widgetCard
      ? widgetCard.getBoundingClientRect()
      : target.getBoundingClientRect();

      let lastSize = currentSize;
      const onPointerMove = (ev: PointerEvent) => {
        const isRTL = lang === 'ar';
        const widthPx = isRTL
          ? widgetRect.right - ev.clientX
          : ev.clientX - widgetRect.left;

        const ratio = Math.max(160, Math.min(containerWidth, widthPx)) / containerWidth;

        let targetSize: WidgetSize = 'third';
        if (ratio < 0.42) {
          targetSize = 'third';
        } else if (ratio < 0.58) {
          targetSize = 'half';
        } else if (ratio < 0.82) {
          targetSize = 'two-thirds';
        } else {
          targetSize = 'full';
        }

        if (targetSize !== lastSize && onChangeSize) {
          lastSize = targetSize;
          onChangeSize(widgetId, targetSize);
        }
      };

    const onPointerUp = (ev: PointerEvent) => {
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      title={lang === 'ar' ? 'اسحب الحافة لتغيير الحجم' : 'Drag edge to resize'}
      className="absolute bottom-1.5 end-1.5 p-1 cursor-ew-resize rounded-lg text-[#5a5a78] hover:text-emerald-400 hover:bg-[#1c1c3a] active:text-emerald-300 transition-colors touch-none z-10 opacity-70 hover:opacity-100"
    >
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M21 15L15 21M21 8L8 21" />
      </svg>
    </div>
  );
};

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

  // Setup dnd-kit sensors (supports mouse and mobile touch with 5px threshold)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Aggregate stats across all categories
  const cardStats = calculateCardStats(state.categories);

  // All completed pomodoro sessions across all categories
  const allSessions = state.categories.flatMap((c) => c.sessions || []);

  // Today's sessions
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todaySessions = allSessions.filter((s) => {
    const d = new Date(s.ts);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return k === todayKey;
  });

  const completedTodayMinutes = todaySessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  // Real-time active focus seconds while timer is running
  const activeFocusSeconds =
    pomoMode === 'focus' && pomoTotalDuration > pomoTimeLeft
      ? pomoTotalDuration - pomoTimeLeft
      : 0;
  const activeFocusMinutes = Math.floor(activeFocusSeconds / 60);
  const totalTodaySeconds = completedTodayMinutes * 60 + activeFocusSeconds;
  const todayMinutes = Math.floor(totalTodaySeconds / 60);

  // Streak information computed strictly from days that cleared the daily goal
  const qualifiedStreakDates = getQualifiedStreakDates(
    allSessions,
    state.settings.goalDaily || 60,
    activeFocusSeconds
  );
  const streakInfo = calculateStreak([], qualifiedStreakDates);

  // Weekly minutes
  const weekActivity = calculateWeeklyActivity(allSessions, lang);
  const weekTotalMinutes =
    weekActivity.reduce((acc, d) => acc + d.minutes, 0) + activeFocusMinutes;

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

  // Goals (Real-time second-by-second calculation)
  const dailyGoal = state.settings.goalDaily || 60;
  const dailyGoalSeconds = dailyGoal * 60;
  const weeklyGoal = state.settings.goalWeekly || 420;
  const weeklyGoalSeconds = weeklyGoal * 60;

  const dailyGoalPct = Math.min(
    100,
    Math.round((totalTodaySeconds / Math.max(1, dailyGoalSeconds)) * 1000) / 10
  );
  const weeklyGoalPct = Math.min(
    100,
    Math.round(((weekTotalMinutes * 60) / Math.max(1, weeklyGoalSeconds)) * 1000) / 10
  );

  // Lifetime study time saver (exact cumulative seconds used in Pomodoro focus timer)
  const totalLifetimeSeconds = state.lifetimeFocusSeconds || 0;

  const formatLifetimeStudyTime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) {
      return lang === 'ar'
        ? `${hours} س ${mins} د ${secs} ث`
        : `${hours}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return lang === 'ar'
        ? `${mins} د ${secs} ث`
        : `${mins}m ${secs}s`;
    }
    return lang === 'ar' ? `${secs} ث` : `${secs}s`;
  };

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
      case 'two-thirds':
        return 'col-span-12 lg:col-span-8';
      case 'full':
        return 'col-span-12';
      case 'half':
      default:
        return 'col-span-12 md:col-span-6 lg:col-span-6';
    }
  };

  const gridRef = useRef<HTMLDivElement>(null);

  // Derive widgets directly from state
  const widgets = state.settings.dashboard || [];
  const visibleWidgets = useMemo(() => widgets.filter((w) => w.visible), [widgets]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [draggedDimensions, setDraggedDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Pointer-first collision detection:
  // Always resolves to the exact slot where the user's mouse cursor is (never shifts to card center)
  const customCollisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    const { pointerCoordinates, droppableRects, droppableContainers } = args;
    if (pointerCoordinates) {
      let closestContainer = null;
      let minDist = Infinity;

      for (const container of droppableContainers) {
        const rect = droppableRects.get(container.id);
        if (!rect) continue;
        const clampedX = Math.max(rect.left, Math.min(pointerCoordinates.x, rect.right));
        const clampedY = Math.max(rect.top, Math.min(pointerCoordinates.y, rect.bottom));
        const dx = pointerCoordinates.x - clampedX;
        const dy = pointerCoordinates.y - clampedY;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          closestContainer = container;
        }
      }

      if (closestContainer) {
        return [{ id: closestContainer.id }];
      }
    }

    return closestCenter(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    setOverId(id);
    const initialRect = event.active.rect.current.initial;
    if (initialRect) {
      setDraggedDimensions({
        width: initialRect.width,
        height: initialRect.height,
      });
    } else {
      setDraggedDimensions(null);
    }
    try {
      document.body.classList.add('is-dragging');
    } catch {}
  };

  const handleDragOver = (event: DragOverEvent) => {
    const nextOver = event.over ? (event.over.id as string) : null;
    if (nextOver !== overId) {
      setOverId(nextOver);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const currentActive = active.id as string;
    const currentOver = over ? (over.id as string) : null;

    setActiveId(null);
    setOverId(null);
    setDraggedDimensions(null);
    try {
      document.body.classList.remove('is-dragging');
    } catch {}

    if (currentOver && currentActive !== currentOver) {
      const oldIndex = widgets.findIndex((w) => w.id === currentActive);
      const newIndex = widgets.findIndex((w) => w.id === currentOver);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const finalWidgets = arrayMove(widgets, oldIndex, newIndex);
        if (onReorderWidgets) {
          onReorderWidgets(finalWidgets);
        }
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setDraggedDimensions(null);
    try {
      document.body.classList.remove('is-dragging');
    } catch {}
  };

  // Size cycling helper: third -> half -> two-thirds -> full -> third
  const handleCycleSize = (widgetId: string, currentSize: WidgetSize) => {
    const order: WidgetSize[] = ['third', 'half', 'two-thirds', 'full'];
    const currentIdx = order.indexOf(currentSize);
    const nextSize = order[(currentIdx + 1) % order.length];
    if (onChangeWidgetSize) {
      onChangeWidgetSize(widgetId, nextSize);
    }
  };

  const sizeLabels: Record<WidgetSize, string> = {
    quarter: lang === 'ar' ? 'ربع العرض' : 'Quarter (1/4)',
    third: lang === 'ar' ? 'ثلث العرض' : 'Third (1/3)',
    half: lang === 'ar' ? 'نصف العرض' : 'Half (1/2)',
    'two-thirds': lang === 'ar' ? 'ثلثي العرض' : 'Two-Thirds (2/3)',
    full: lang === 'ar' ? 'كامل العرض' : 'Full Width',
  };

  const sizeShortLabels: Record<WidgetSize, string> = {
    quarter: lang === 'ar' ? 'ربع' : '1/4',
    third: lang === 'ar' ? 'ثلث' : '1/3',
    half: lang === 'ar' ? 'نصف' : '1/2',
    'two-thirds': lang === 'ar' ? 'ثلثين' : '2/3',
    full: lang === 'ar' ? 'كامل' : 'Full',
  };

  // Universal Clean Widget Header Controls: Square shape toggle + square drag handle (no up/down arrows)
  const renderWidgetHeaderControls = (
    widgetId: string,
    currentSize: WidgetSize,
    index: number,
    dragHandleProps: any,
    extraAction?: React.ReactNode
  ) => {
    const isCompact = currentSize === 'third' || currentSize === 'quarter';

    return (
      <div className="flex items-center gap-1.5 shrink-0">
        {extraAction}

        {/* Square-shaped Compact / Expanded Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const nextSize: WidgetSize = isCompact ? 'two-thirds' : 'third';
            if (onChangeWidgetSize) onChangeWidgetSize(widgetId, nextSize);
          }}
          title={
            lang === 'ar'
              ? isCompact
                ? 'توسيع لعرض مزيد من التفاصيل'
                : 'تصغير إلى شكل مربع'
              : isCompact
              ? 'Expand for more details'
              : 'Shrink to square'
          }
          className="w-8 h-8 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/50 hover:bg-[#242448] flex items-center justify-center text-[#8888a8] hover:text-white transition-all active:scale-95 shadow-xs"
        >
          {isCompact ? (
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </button>

        {/* Dedicated Square 6-dots Drag Handle */}
        <div
          data-tour="drag-handle"
          {...dragHandleProps}
          title={lang === 'ar' ? 'اضغط واسحب لإعادة الترتيب' : 'Drag to reorder'}
          className="w-8 h-8 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/50 hover:bg-[#242448] flex items-center justify-center cursor-grab active:cursor-grabbing text-[#8888a8] hover:text-emerald-400 touch-none transition-all shadow-xs"
          aria-label="Drag widget handle"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
    );
  };

  // Render content of specific widget
  const renderWidgetContent = (
    w: WidgetConfig,
    index: number,
    dragHandleProps: any
  ) => {
    const isExpanded = w.size !== 'third' && w.size !== 'quarter';

    switch (w.id) {
      case 'pomodoro':
        return (
          <div
            data-tour="pomodoro"
            className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                  {t('widgetPomodoro', lang)}
                </h3>
              </div>

              {renderWidgetHeaderControls(
                w.id,
                w.size,
                index,
                dragHandleProps,
                <button
                  onClick={onOpenFullscreenPomo}
                  title={t('fullscreen', lang)}
                  aria-label={t('fullscreen', lang)}
                  className="w-8 h-8 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/40 flex items-center justify-center text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Inline Timer Editor Mode */}
            {isEditingPomo ? (
              <div className="p-3.5 rounded-xl bg-[#1c1c3a] border border-emerald-500/40 space-y-3 my-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#e8e8f0]">
                  <span className="flex items-center gap-1.5 text-emerald-300">
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
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-[#12122a] border border-[#2a2a4a] text-[#8888a8] hover:text-[#e8e8f0] hover:border-emerald-500/30'
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
                    placeholder="25"
                    value={customPomoMinutes === 0 ? '' : customPomoMinutes}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                      setCustomPomoMinutes(raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0));
                    }}
                    className="w-16 px-2.5 py-1 rounded-lg bg-[#12122a] border border-[#2a2a4a] text-xs font-mono font-bold text-[#e8e8f0] focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-[#8888a8]">
                    {lang === 'ar' ? 'دقيقة مخصصة' : 'custom min'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const mins = Number(customPomoMinutes) || 25;
                      if (mins > 0 && onUpdatePomoDuration) {
                        onUpdatePomoDuration(mins);
                      }
                      setIsEditingPomo(false);
                    }}
                    className="ms-auto flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تطبيق' : 'Apply'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Timer Display with Click-to-Edit Trigger */
              <div className="space-y-3 py-1">
                <div className="flex items-center gap-5">
                  {/* Clickable Ring */}
                  <div
                    onClick={() => {
                      if (!isPomoRunning) {
                        setCustomPomoMinutes(Math.round(pomoTotalDuration / 60) || 25);
                        setIsEditingPomo(true);
                      }
                    }}
                    title={
                      isPomoRunning
                        ? 'Pause timer to edit'
                        : lang === 'ar'
                        ? 'اضغط لتعديل المدة'
                        : 'Click to edit duration'
                    }
                    className={`relative w-22 h-22 shrink-0 flex items-center justify-center group ${
                      !isPomoRunning ? 'cursor-pointer' : ''
                    }`}
                  >
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40"
                        stroke="#1c1c3a"
                        strokeWidth="7"
                        fill="transparent"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40"
                        stroke={pomoMode === 'focus' ? 'var(--primary)' : '#00d4aa'}
                        strokeWidth="7"
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray="251"
                        strokeDashoffset={251 - 251 * pomoProgress}
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono font-extrabold text-base text-[#e8e8f0] group-hover:text-emerald-300 transition-colors">
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
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        {pomoMode === 'focus' ? t('focus', lang) : t('break', lang)}
                      </span>
                      {!isPomoRunning && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomPomoMinutes(Math.round(pomoTotalDuration / 60) || 25);
                            setIsEditingPomo(true);
                          }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1"
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
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all active:scale-95"
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
                        className="p-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/40 text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Detail View: Presets & Today's stats */}
                {isExpanded && (
                  <div className="pt-2 border-t border-[#2a2a4a]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#8888a8] text-[11px]">
                        {lang === 'ar' ? 'التركيز اليوم:' : 'Today:'}
                      </span>
                      <span className="font-mono font-bold text-emerald-300">
                        {todayMinutes} min
                      </span>
                      <span className="text-[#5a5a78]">·</span>
                      <span className="text-[#8888a8] text-[11px]">
                        {todaySessions.length} {lang === 'ar' ? 'جلسات' : 'sessions'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[15, 25, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => {
                            if (onUpdatePomoDuration) onUpdatePomoDuration(mins);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                            Math.round(pomoTotalDuration / 60) === mins
                              ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/40'
                              : 'bg-[#1c1c3a] text-[#8888a8] hover:text-white'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      case 'stats':
        return (
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                  {t('widgetStats', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>

            <div className={`grid ${isExpanded ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'} gap-2.5`}>
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
                  {streakInfo.currentStreak}
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

            {/* Expanded Detailed Breakdown */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-[#2a2a4a]/50 flex items-center justify-between text-xs text-[#8888a8]">
                <span>
                  {lang === 'ar' ? 'نسبة الإتقان:' : 'Mastery Rate:'}{' '}
                  <strong className="text-teal-400 font-mono">{cardStats.masteryPct}%</strong>
                </span>
                <span>
                  {state.categories.length} {t('categories', lang)} ·{' '}
                  {state.categories.flatMap((c) => c.decks || []).length}{' '}
                  {lang === 'ar' ? 'مجموعات' : 'decks'}
                </span>
              </div>
            )}

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      case 'aiUsage':
        return (
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                  {t('widgetAiUsage', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(
                w.id,
                w.size,
                index,
                dragHandleProps,
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
                  {state.settings.aiTier === 'paid'
                    ? `${state.settings.aiUsageToday || 0} calls (High Quota)`
                    : `${state.settings.aiUsageToday || 0} / 20`}
                </span>
              </div>

              <div className="w-full bg-[#1c1c3a] rounded-full h-2 overflow-hidden border border-[#2a2a4a]/50">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      state.settings.aiTier === 'paid'
                        ? '100%'
                        : `${Math.min(100, ((state.settings.aiUsageToday || 0) / 20) * 100)}%`
                    }`,
                  }}
                />
              </div>

              {isExpanded && (
                <div className="pt-2 border-t border-[#2a2a4a]/40 flex items-center justify-between text-[11px] text-[#8888a8]">
                  <span>{lang === 'ar' ? 'إعادة التعيين:' : 'Reset:'} 12:00 AM Midnight</span>
                  <span className="font-semibold text-emerald-300">
                    {state.settings.apiKey ? '✓ Key Active' : 'No Key'}
                  </span>
                </div>
              )}

              {!state.settings.apiKey && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 text-[11px]">
                    {t('pleaseAddKey', lang)}
                  </span>
                  <button
                    onClick={onOpenSettings}
                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0"
                  >
                    {t('openSettings', lang)}
                  </button>
                </div>
              )}
            </div>

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      case 'goals':
        return (
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                  {t('widgetGoals', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#8888a8] flex items-center gap-1.5">
                    <span>{t('dailyGoal', lang)} ({dailyGoal} {t('minutes', lang)})</span>
                    {isPomoRunning && pomoMode === 'focus' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 animate-pulse">
                        ● {lang === 'ar' ? 'تركيز نشط الآن' : 'Live Focus'}
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-[#e8e8f0]">
                    {isPomoRunning && pomoMode === 'focus'
                      ? `${todayMinutes}m ${totalTodaySeconds % 60}s / ${dailyGoal} min`
                      : `${todayMinutes} / ${dailyGoal} min`}
                  </span>
                </div>
                <div className="w-full bg-[#1c1c3a] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-400 h-2 rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(45,212,191,0.5)]"
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
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${weeklyGoalPct}%` }}
                  />
                </div>
              </div>

              {/* Lifetime Study Time - Indefinite counter without progress bar */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#8888a8]">
                  {lang === 'ar' ? 'الوقت الإجمالي للدراسة مدى الحياة' : 'Lifetime Study Time'}
                </span>
                <span className="font-mono font-bold text-[#e8e8f0]">
                  {formatLifetimeStudyTime(totalLifetimeSeconds)}
                </span>
              </div>

              {isExpanded && (
                <div className="pt-2 border-t border-[#2a2a4a]/40 flex items-center justify-between text-[11px] text-[#8888a8]">
                  <span>
                    {lang === 'ar' ? 'المتبقي لليوم:' : 'Remaining today:'}{' '}
                    <strong className="text-teal-300 font-mono">
                      {Math.max(0, Math.ceil((dailyGoalSeconds - totalTodaySeconds) / 60))} min
                    </strong>
                  </span>
                  <span className="font-semibold text-emerald-300">
                    {dailyGoalPct >= 100
                      ? lang === 'ar'
                        ? 'مكتمل بنجاح!'
                        : 'Goal Reached!'
                      : `${dailyGoalPct}% Completed`}
                  </span>
                </div>
              )}
            </div>

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      case 'streak':
        return (
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <Flame className={`w-4 h-4 ${streakInfo.activeToday ? 'text-rose-500 animate-pulse' : 'text-[#8888a8]'}`} />
                </div>
                <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                  {t('widgetStreak', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(
                w.id,
                w.size,
                index,
                dragHandleProps,
                <button
                  type="button"
                  onClick={onOpenStreakModal}
                  title={t('calTitle', lang)}
                  aria-label={t('calTitle', lang)}
                  className="w-8 h-8 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/50 hover:bg-[#242448] flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${
                streakInfo.activeToday
                  ? 'bg-rose-500/15 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'bg-[#1c1c3a] border-[#2a2a4a]'
              }`}>
                <Flame className={`w-6 h-6 ${streakInfo.activeToday ? 'text-rose-500 animate-bounce' : 'text-[#8888a8]'}`} />
              </div>
              <div>
                <div className="text-xl font-extrabold text-[#e8e8f0]">
                  {streakInfo.currentStreak} {t('streakDays', lang)}
                </div>
                <p className="text-xs text-[#8888a8]">
                  {streakInfo.activeToday
                    ? t('streakActiveToday', lang)
                    : t('streakInactive', lang)}
                </p>
              </div>
            </div>

            {isExpanded && (
              <div className="pt-2 border-t border-[#2a2a4a]/40 text-xs text-[#8888a8] flex items-center justify-between">
                <span>{lang === 'ar' ? 'سجل الأيام السابقة:' : 'Daily consistency tracking'}</span>
                <button
                  type="button"
                  onClick={onOpenStreakModal}
                  className="text-emerald-400 hover:underline font-bold text-[11px]"
                >
                  {lang === 'ar' ? 'عرض التقويم' : 'View Calendar'}
                </button>
              </div>
            )}

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      case 'weeklyActivity':
      case 'activity':
        return (
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-[#e8e8f0] truncate">
                    {t('widgetActivity', lang)}
                  </h3>
                  <div className="text-[11px] font-bold text-emerald-400 truncate">
                    {weekTotalMinutes} min {t('thisWeek', lang)}
                  </div>
                </div>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2">
              {(() => {
                const targetMax = Math.max(
                  dailyGoal,
                  ...weekActivity.map((d) =>
                    d.isToday ? d.minutes + activeFocusSeconds / 60 : d.minutes
                  )
                );
                return weekActivity.map((day) => {
                  const isToday = day.isToday;
                  const effectiveMinutes = isToday
                    ? day.minutes + activeFocusSeconds / 60
                    : day.minutes;
                  const barPct =
                    effectiveMinutes > 0
                      ? Math.min(100, Math.round((effectiveMinutes / targetMax) * 100))
                      : 0;

                  return (
                    <div
                      key={day.dateKey}
                      title={`${Math.round(effectiveMinutes)} / ${dailyGoal} min`}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="w-full bg-[#1c1c3a] rounded-xl h-20 flex flex-col justify-end p-1 border border-[#2a2a4a]/40">
                        {effectiveMinutes > 0 ? (
                          <div
                            style={{ height: `${Math.max(4, barPct)}%` }}
                            className="w-full rounded-lg bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm transition-all duration-300"
                          />
                        ) : null}
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          isToday ? 'text-emerald-400' : 'text-[#8888a8]'
                        }`}
                      >
                        {day.dayLabel}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-[#2a2a4a]/50 flex items-center justify-between text-xs text-[#8888a8]">
                <span>
                  {lang === 'ar' ? 'المعدل اليومي:' : 'Daily Average:'}{' '}
                  <strong className="text-emerald-300 font-mono">
                    {Math.round(weekTotalMinutes / 7)} min
                  </strong>
                </span>
                <span>
                  {todaySessions.length} {lang === 'ar' ? 'جلسات اليوم' : 'sessions today'}
                </span>
              </div>
            )}

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      case 'sessions':
      case 'sessionsToday':
        const displaySessions = isExpanded ? todaySessions.slice(0, 6) : todaySessions.slice(0, 3);

        return (
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                  {t('widgetSessionsToday', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(
                w.id,
                w.size,
                index,
                dragHandleProps,
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
                {displaySessions.map((s) => (
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

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      case 'exams':
        const displayExams = isExpanded ? allExams.slice(0, 6) : allExams.slice(0, 3);

        return (
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                  {t('widgetExams', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(
                w.id,
                w.size,
                index,
                dragHandleProps,
                <button
                  type="button"
                  onClick={onOpenAddExam}
                  title={t('addExam', lang)}
                  aria-label={t('addExam', lang)}
                  className="w-8 h-8 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/50 hover:bg-[#242448] flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {allExams.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8888a8]">
                {t('noExams', lang)}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {displayExams.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => onSelectCategory(ex.categoryId, 'exams')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a]/40 hover:border-emerald-500/30 cursor-pointer text-xs"
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

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      case 'tasks':
        const displayTasks = isExpanded ? allTasks.slice(0, 6) : allTasks.slice(0, 3);

        return (
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                  {t('widgetTasks', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(
                w.id,
                w.size,
                index,
                dragHandleProps,
                <button
                  type="button"
                  onClick={onOpenAddTask}
                  title={t('addTask', lang)}
                  aria-label={t('addTask', lang)}
                  className="w-8 h-8 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/50 hover:bg-[#242448] flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {allTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8888a8]">
                {t('noTasks', lang)}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {displayTasks.map((tk) => (
                  <div
                    key={tk.id}
                    onClick={() => onSelectCategory(tk.categoryId, 'tasks')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a]/40 hover:border-emerald-500/30 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tk.categoryColor }}
                      />
                      <span className="font-semibold text-[#e8e8f0]">{tk.title}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400">
                      {tk.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      case 'grades':
        return (
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                  {t('widgetGrades', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
                <span className="text-lg font-mono font-extrabold text-emerald-400">
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

            {isExpanded && (
              <div className="pt-2 border-t border-[#2a2a4a]/40 text-xs text-[#8888a8] flex items-center justify-between">
                <span>{allGrades.length} {lang === 'ar' ? 'تقييمات مسجلة' : 'assessments recorded'}</span>
                <span className="text-emerald-300 font-semibold">{gpaInfo.gpa >= 85 ? 'Excellent Standing' : 'Good Progress'}</span>
              </div>
            )}

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      case 'quizzes':
      case 'quizAvg':
        return (
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                </div>
                <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                  {t('widgetQuizAvg', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(
                w.id,
                w.size,
                index,
                dragHandleProps,
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

            {isExpanded && (
              <div className="pt-2 border-t border-[#2a2a4a]/40 text-xs text-[#8888a8] flex items-center justify-between">
                <span>{scoredQuizzes.length} {lang === 'ar' ? 'اختبارات مكتملة' : 'completed quiz tests'}</span>
                <span className="text-teal-400 font-bold">{avgQuizScore >= 80 ? 'Mastery Level' : 'Developing'}</span>
              </div>
            )}

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      case 'actions':
        return (
          <div
            data-tour="quick-actions"
            className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col justify-between h-full relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] flex items-center justify-center shrink-0 shadow-xs">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                  {t('widgetActions', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={onOpenNewCategory}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/40 text-xs font-bold text-[#e8e8f0] hover:text-emerald-300 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>{t('newCategory', lang)}</span>
              </button>
              <button
                onClick={onOpenNewDeck}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/40 text-xs font-bold text-[#e8e8f0] hover:text-emerald-300 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>{t('newDeck', lang)}</span>
              </button>
              <button
                onClick={onOpenGenerateCards}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/40 text-xs font-bold text-[#e8e8f0] hover:text-emerald-300 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>{t('generateAI', lang)}</span>
              </button>
              <button
                onClick={onOpenFullscreenPomo}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-bold text-emerald-300 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <Play className="w-4 h-4 fill-emerald-300" />
                <span>{t('start', lang)}</span>
              </button>
            </div>

            <CardResizeHandle
              widgetId={w.id}
              currentSize={w.size}
              lang={lang}
              gridRef={gridRef}
              onChangeSize={onChangeWidgetSize}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Scope & Timeline Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12122a] border border-[#2a2a4a] p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-500/30 hover:bg-emerald-600/25 text-xs font-bold text-emerald-300 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ar' ? 'الجدول الدراسي' : 'Timetable'}</span>
            </button>
          )}

          <button
            onClick={onOpenCustomize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/40 text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('customizeDashboard', lang)}</span>
          </button>
        </div>
      </div>

      {/* Grid of Draggable Widgets using dnd-kit Sortable */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        autoScroll={false}
      >
        <SortableContext
          items={visibleWidgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div ref={gridRef} className="grid grid-cols-12 gap-5">
            {visibleWidgets.map((w, index) => (
              <SortableWidgetWrapper
                key={w.id}
                id={w.id}
                sizeClass={getSizeClass(w.size)}
                isCurrentlyDragged={w.id === activeId}
                isOverTarget={Boolean(activeId && overId === w.id && activeId !== w.id)}
              >
                {(dragHandleProps) => renderWidgetContent(w, index, dragHandleProps)}
              </SortableWidgetWrapper>
            ))}
          </div>
        </SortableContext>

        <DragOverlay
          dropAnimation={{
            duration: 220,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          {activeId ? (
            (() => {
              const activeWidget = visibleWidgets.find((w) => w.id === activeId);
              if (!activeWidget) return null;
              return (
                <div
                  style={
                    draggedDimensions
                      ? { width: draggedDimensions.width, height: draggedDimensions.height }
                      : undefined
                  }
                  className="scale-[1.02] shadow-2xl ring-2 ring-emerald-500 rounded-2xl pointer-events-none cursor-grabbing opacity-95 bg-[#12122a]"
                >
                  {renderWidgetContent(activeWidget, 0, {})}
                </div>
              );
            })()
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
