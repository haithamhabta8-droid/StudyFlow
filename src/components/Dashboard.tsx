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
  DragOverlay,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { AppState, WidgetConfig, WidgetSize } from '../types/index.ts';
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
import { getModelInfo } from '../utils/gemini.ts';
import { useGeminiModels } from '../hooks/useGeminiModels.ts';

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

const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, option, [role="button"], [data-no-dnd="true"]';

function isInteractiveDragBlock(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest('[data-drag-handle="true"]')) return false;
  return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

class SmartMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: 'onMouseDown' as const,
      handler: ({ nativeEvent }: { nativeEvent: MouseEvent }) => {
        if (nativeEvent.button !== 0) return false;
        return !isInteractiveDragBlock(nativeEvent.target);
      },
    },
  ];
}

class SmartTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: 'onTouchStart' as const,
      handler: ({ nativeEvent }: { nativeEvent: TouchEvent }) => {
        if (nativeEvent.touches.length > 1) return false;
        return !isInteractiveDragBlock(nativeEvent.target);
      },
    },
  ];
}

function reorderIds<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;
  const copy = items.slice();
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

interface DraggableWidgetProps {
  id: string;
  sizeClass: string;
  title: string;
  lang: 'ar' | 'en';
  isCurrentlyDragged: boolean;
  children: (dragHandleProps: any) => React.ReactNode;
}

const DraggableWidgetWrapper: React.FC<DraggableWidgetProps> = ({
  id,
  sizeClass,
  title,
  lang,
  isCurrentlyDragged,
  children,
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });

  // Attach accessibility attributes only to the dedicated 6-dot drag handle (never wrap inner buttons in role="button")
  const content = children(attributes);
  if (!content) return null;

  return (
    <div
      ref={setNodeRef}
      data-widget-id={id}
      {...listeners}
      className={`${sizeClass} min-w-0 relative group/widget flex flex-col cursor-grab active:cursor-grabbing touch-pan-y transition-[grid-column] duration-200 ${
        isCurrentlyDragged ? 'min-h-[160px]' : ''
      }`}
    >
      {isCurrentlyDragged ? (
        <div className="flex-1 rounded-xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 flex flex-col items-center justify-center gap-1 p-4 text-center select-none">
          <span className="text-xs font-semibold text-[#e8e8f0]">{title}</span>
          <span className="text-[11px] font-medium text-[#8888a8]">
            {lang === 'ar' ? 'أفلت الأداة هنا' : 'Drop widget here'}
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 min-w-0">{content}</div>
      )}
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
  const [isResizing, setIsResizing] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}
    setIsResizing(true);

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

      const ratio = Math.max(70, Math.min(containerWidth, widthPx)) / containerWidth;

      let targetSize: WidgetSize = 'third';
      if (ratio < 0.295) {
        targetSize = 'quarter';
      } else if (ratio < 0.42) {
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
      setIsResizing(false);
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const sizeBadge =
    currentSize === 'quarter'
      ? '1/4'
      : currentSize === 'third'
      ? '1/3'
      : currentSize === 'half'
      ? '1/2'
      : currentSize === 'two-thirds'
      ? '2/3'
      : 'Full';

  return (
    <div
      data-no-dnd="true"
      onPointerDown={handlePointerDown}
      title={lang === 'ar' ? 'اسحب الحافة لتغيير الحجم' : 'Drag edge to resize'}
      className="absolute bottom-1.5 end-1.5 p-1 cursor-ew-resize rounded-lg text-[#5a5a78] hover:text-emerald-400 hover:bg-[#1c1c3a] active:text-emerald-300 transition-colors touch-none z-10 opacity-70 hover:opacity-100 flex items-center gap-1"
    >
      {isResizing && (
        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold pointer-events-none shadow-sm">
          {sizeBadge}
        </span>
      )}
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
  const [openSizeMenuId, setOpenSizeMenuId] = useState<string | null>(null);
  const { models: liveModels } = useGeminiModels(false);

  useEffect(() => {
    if (!openSizeMenuId) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        e.target instanceof Element &&
        !e.target.closest('[data-size-menu="true"]')
      ) {
        setOpenSizeMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [openSizeMenuId]);

  // Android OS-style sensors: drag cleanly from header/card with Mouse (6px) or long-press Touch (180ms)
  const sensors = useSensors(
    useSensor(SmartMouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(SmartTouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
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
  const [previewOrder, setPreviewOrder] = useState<string[] | null>(null);
  const [draggedDimensions, setDraggedDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const activeIdRef = useRef<string | null>(null);
  const previewOrderRef = useRef<string[] | null>(null);
  const startPointerRef = useRef<{ x: number; y: number } | null>(null);
  const livePointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerToCardCenterOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const lockedSwapIdRef = useRef<string | null>(null);
  const lastSwapRef = useRef<{
    swappedWith: string | null;
    px: number;
    py: number;
    ts: number;
  } | null>(null);

  const displayedVisibleWidgets = useMemo(() => {
    if (!activeId || !previewOrder) return visibleWidgets;
    const byId = new Map<string, WidgetConfig>(visibleWidgets.map((w) => [w.id, w]));
    const ordered: WidgetConfig[] = [];
    for (const id of previewOrder) {
      const w = byId.get(id);
      if (w) {
        ordered.push(w);
        byId.delete(id);
      }
    }
    for (const w of byId.values()) ordered.push(w);
    return ordered;
  }, [activeId, previewOrder, visibleWidgets]);

  const getWidgetTitle = (id: string): string => {
    switch (id) {
      case 'pomodoro':
        return t('widgetPomodoro', lang);
      case 'tasks':
        return t('widgetTasks', lang);
      case 'goals':
        return t('widgetGoals', lang);
      case 'sessions':
      case 'sessionsToday':
        return t('widgetSessionsToday', lang);
      case 'weeklyActivity':
      case 'activity':
        return t('widgetActivity', lang);
      case 'actions':
        return t('widgetActions', lang);
      case 'streak':
        return t('widgetStreak', lang);
      case 'exams':
        return t('widgetExams', lang);
      case 'stats':
        return t('widgetStats', lang);
      case 'grades':
        return t('widgetGrades', lang);
      case 'quizzes':
      case 'quizAvg':
        return t('widgetQuizAvg', lang);
      case 'aiUsage':
        return t('widgetAiUsage', lang);
      default:
        return id;
    }
  };

  useEffect(() => {
    if (!activeId) return;
    const onPointerMove = (e: PointerEvent) => {
      livePointerRef.current = { x: e.clientX, y: e.clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        livePointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [activeId]);

  const computeAndroidTargetOrder = (
    currentOrder: string[],
    dragId: string,
    px: number,
    py: number
  ): string[] | null => {
    const gridEl = gridRef.current;
    if (!gridEl) return null;

    const slotEls = Array.from(
      gridEl.querySelectorAll<HTMLElement>('[data-widget-id]')
    );
    const rectMap = new Map<string, DOMRect>();
    for (const el of slotEls) {
      const id = el.getAttribute('data-widget-id');
      if (id) rectMap.set(id, el.getBoundingClientRect());
    }

    const activeIdx = currentOrder.indexOf(dragId);
    if (activeIdx === -1) return null;

    // 1. If pointer is already inside the active "Drop here" placeholder, clear swap lock & stay put
    const activeRect = rectMap.get(dragId);
    if (
      activeRect &&
      px >= activeRect.left &&
      px <= activeRect.right &&
      py >= activeRect.top &&
      py <= activeRect.bottom
    ) {
      lockedSwapIdRef.current = null;
      return null;
    }

    // Clear lockedSwapIdRef once the pointer exits that widget's bounding rect
    if (lockedSwapIdRef.current) {
      const lockedRect = rectMap.get(lockedSwapIdRef.current);
      if (
        !lockedRect ||
        px < lockedRect.left ||
        px > lockedRect.right ||
        py < lockedRect.top ||
        py > lockedRect.bottom
      ) {
        lockedSwapIdRef.current = null;
      }
    }

    const isRTL = lang === 'ar';

    // 2. Direct hit on another widget card (Android OS swap/shift into hovered widget's position)
    for (let i = 0; i < currentOrder.length; i++) {
      const targetId = currentOrder[i];
      if (targetId === dragId) continue;
      const r = rectMap.get(targetId);
      if (!r) continue;
      if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
        if (lockedSwapIdRef.current === targetId) {
          return null;
        }
        const lastSwap = lastSwapRef.current;
        if (
          lastSwap &&
          lastSwap.swappedWith === targetId &&
          (Date.now() - lastSwap.ts < 180 ||
            Math.hypot(px - lastSwap.px, py - lastSwap.py) < 18)
        ) {
          return null;
        }
        lockedSwapIdRef.current = targetId;
        lastSwapRef.current = { swappedWith: targetId, px, py, ts: Date.now() };
        return reorderIds(currentOrder, activeIdx, i);
      }
    }

    // 3. Pointer is in an empty grid gap / partial row right-side / above or below grid
    const measured = currentOrder
      .map((id, idx) => ({ id, idx, rect: rectMap.get(id) }))
      .filter((item): item is { id: string; idx: number; rect: DOMRect } => Boolean(item.rect));

    if (measured.length === 0) return null;

    // Cluster items into rendered horizontal rows
    const byTop = [...measured].sort((a, b) => a.rect.top - b.rect.top);
    const rows: {
      top: number;
      bottom: number;
      items: typeof measured;
    }[] = [];

    for (const item of byTop) {
      const existingRow = rows.find((row) => Math.abs(item.rect.top - row.top) < 36);
      if (existingRow) {
        existingRow.items.push(item);
        existingRow.top = Math.min(existingRow.top, item.rect.top);
        existingRow.bottom = Math.max(existingRow.bottom, item.rect.bottom);
      } else {
        rows.push({
          top: item.rect.top,
          bottom: item.rect.bottom,
          items: [item],
        });
      }
    }

    for (const row of rows) {
      row.items.sort((a, b) =>
        isRTL ? b.rect.left - a.rect.left : a.rect.left - b.rect.left
      );
    }

    const firstRow = rows[0];
    const lastRow = rows[rows.length - 1];
    const withoutActive = currentOrder.filter((id) => id !== dragId);

    if (py < firstRow.top - 12) {
      if (activeIdx === 0) return null;
      lastSwapRef.current = { swappedWith: '__top__', px, py, ts: Date.now() };
      return [dragId, ...withoutActive];
    }

    if (py > lastRow.bottom + 12) {
      if (activeIdx === currentOrder.length - 1) return null;
      lastSwapRef.current = { swappedWith: '__bottom__', px, py, ts: Date.now() };
      return [...withoutActive, dragId];
    }

    // Find row strictly containing py, or break vertical gutter ties using dragged card center
    let chosenRow = rows.find((row) => py >= row.top && py <= row.bottom);
    if (!chosenRow) {
      const cardCenterY = py + pointerToCardCenterOffsetRef.current.dy;
      chosenRow = rows.find((row) => cardCenterY >= row.top && cardCenterY <= row.bottom);
    }
    if (!chosenRow) {
      let bestDist = Infinity;
      for (const row of rows) {
        const dist = py < row.top ? row.top - py : py - row.bottom;
        if (dist < bestDist) {
          bestDist = dist;
          chosenRow = row;
        }
      }
    }

    if (!chosenRow || chosenRow.items.length === 0) return null;

    // Determine exact horizontal insertion slot within the chosen row (handles empty row ends!)
    const rowOthers = chosenRow.items.filter((item) => item.id !== dragId);
    if (rowOthers.length === 0) return null;

    let insertAfterId: string | null = null;
    for (const item of rowOthers) {
      const centerX = item.rect.left + item.rect.width / 2;
      const isPast = isRTL ? px < centerX : px > centerX;
      if (isPast) {
        insertAfterId = item.id;
      }
    }

    let insertIdxInWithout: number;
    if (insertAfterId === null) {
      insertIdxInWithout = withoutActive.indexOf(rowOthers[0].id);
    } else {
      insertIdxInWithout = withoutActive.indexOf(insertAfterId) + 1;
    }

    if (insertIdxInWithout < 0) insertIdxInWithout = withoutActive.length;
    const nextOrder = withoutActive.slice();
    nextOrder.splice(insertIdxInWithout, 0, dragId);

    const changed = nextOrder.some((id, idx) => id !== currentOrder[idx]);
    if (!changed) return null;

    const swapKey = `__gap_${chosenRow.top}_${insertAfterId || 'start'}`;
    const lastSwap = lastSwapRef.current;
    if (
      lastSwap &&
      lastSwap.swappedWith === swapKey &&
      (Date.now() - lastSwap.ts < 220 ||
        Math.hypot(px - lastSwap.px, py - lastSwap.py) < 20)
    ) {
      return null;
    }
    lastSwapRef.current = { swappedWith: swapKey, px, py, ts: Date.now() };
    return nextOrder;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    const initialOrder = visibleWidgets.map((w) => w.id);
    activeIdRef.current = id;
    previewOrderRef.current = initialOrder;
    setActiveId(id);
    setPreviewOrder(initialOrder);
    lastSwapRef.current = null;
    lockedSwapIdRef.current = null;

    const activator = event.activatorEvent as any;
    const clientX =
      typeof activator?.clientX === 'number'
        ? activator.clientX
        : activator?.touches?.[0]?.clientX;
    const clientY =
      typeof activator?.clientY === 'number'
        ? activator.clientY
        : activator?.touches?.[0]?.clientY;

    if (typeof clientX === 'number' && typeof clientY === 'number') {
      startPointerRef.current = { x: clientX, y: clientY };
      livePointerRef.current = { x: clientX, y: clientY };
    } else {
      startPointerRef.current = null;
      livePointerRef.current = null;
    }

    const initialRect = event.active.rect.current.initial;
    if (initialRect) {
      setDraggedDimensions({
        width: initialRect.width,
        height: initialRect.height,
      });
      if (typeof clientX === 'number' && typeof clientY === 'number') {
        pointerToCardCenterOffsetRef.current = {
          dx: initialRect.left + initialRect.width / 2 - clientX,
          dy: initialRect.top + initialRect.height / 2 - clientY,
        };
      } else {
        pointerToCardCenterOffsetRef.current = { dx: 0, dy: 0 };
      }
    } else {
      setDraggedDimensions(null);
      pointerToCardCenterOffsetRef.current = { dx: 0, dy: 0 };
    }
    try {
      document.body.classList.add('is-dragging');
    } catch {}
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const currentDragId = activeIdRef.current;
    const currentOrder = previewOrderRef.current;
    if (!currentDragId || !currentOrder) return;

    let px: number | null = null;
    let py: number | null = null;

    if (livePointerRef.current) {
      px = livePointerRef.current.x;
      py = livePointerRef.current.y;
    } else if (startPointerRef.current) {
      px = startPointerRef.current.x + event.delta.x;
      py = startPointerRef.current.y + event.delta.y;
    }

    if (px === null || py === null) return;

    const nextOrder = computeAndroidTargetOrder(currentOrder, currentDragId, px, py);
    if (nextOrder) {
      previewOrderRef.current = nextOrder;
      setPreviewOrder(nextOrder);
    }
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    const finalVisibleOrder = previewOrderRef.current;

    activeIdRef.current = null;
    previewOrderRef.current = null;
    setActiveId(null);
    setPreviewOrder(null);
    setDraggedDimensions(null);
    startPointerRef.current = null;
    livePointerRef.current = null;
    lastSwapRef.current = null;
    lockedSwapIdRef.current = null;
    try {
      document.body.classList.remove('is-dragging');
    } catch {}

    if (finalVisibleOrder && onReorderWidgets) {
      const currentVisibleIds = visibleWidgets.map((w) => w.id);
      const changed =
        finalVisibleOrder.length === currentVisibleIds.length &&
        finalVisibleOrder.some((id, idx) => id !== currentVisibleIds[idx]);
      if (changed) {
        const byId = new Map<string, WidgetConfig>(widgets.map((w) => [w.id, w]));
        const hiddenWidgets = widgets.filter((w) => !w.visible);
        const reorderedVisible = finalVisibleOrder
          .map((id) => byId.get(id))
          .filter((w): w is WidgetConfig => Boolean(w));
        onReorderWidgets([...reorderedVisible, ...hiddenWidgets]);
      }
    }
  };

  const handleDragCancel = () => {
    activeIdRef.current = null;
    previewOrderRef.current = null;
    setActiveId(null);
    setPreviewOrder(null);
    setDraggedDimensions(null);
    startPointerRef.current = null;
    livePointerRef.current = null;
    lastSwapRef.current = null;
    lockedSwapIdRef.current = null;
    try {
      document.body.classList.remove('is-dragging');
    } catch {}
  };

  // Size presets available directly from widget headers
  const sizeOptions: Array<{ value: WidgetSize; short: string }> = [
    { value: 'quarter', short: '1/4' },
    { value: 'third', short: '1/3' },
    { value: 'half', short: '1/2' },
    { value: 'two-thirds', short: '2/3' },
    { value: 'full', short: 'Full' },
  ];

  // Quiet Header Controls: compact width selector + drag handle
  const renderWidgetHeaderControls = (
    widgetId: string,
    currentSize: WidgetSize,
    _index: number,
    dragHandleProps: any,
    extraAction?: React.ReactNode
  ) => {
    const isQuarterCtrl = currentSize === 'quarter';
    const isMenuOpen = openSizeMenuId === widgetId;
    const currentShort =
      currentSize === 'quarter'
        ? '1/4'
        : currentSize === 'third'
        ? '1/3'
        : currentSize === 'half'
        ? '1/2'
        : currentSize === 'two-thirds'
        ? '2/3'
        : 'Full';

    return (
      <div className={`flex items-center ${isQuarterCtrl ? 'gap-0.5' : 'gap-1'} shrink-0`}>
        {extraAction}

        <div className="relative" data-size-menu="true" data-no-dnd="true">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenSizeMenuId((prev) => (prev === widgetId ? null : widgetId));
            }}
            title={
              lang === 'ar'
                ? 'تغيير عرض البطاقة (1/4 لوضع 4 بطاقات في صف واحد)'
                : 'Resize widget width (pick 1/4 for 4 per row)'
            }
            aria-label={`Resize widget (${currentShort})`}
            className={`${isQuarterCtrl ? 'h-6 px-1 text-[10px]' : 'h-7 px-1.5 text-[10px]'} rounded-lg hover:bg-[#1c1c3a] flex items-center justify-center font-mono font-semibold text-[#8888a8] hover:text-[#e8e8f0] transition-colors tabular-nums`}
          >
            {currentShort}
          </button>

          {isMenuOpen && (
            <div className="absolute end-0 top-8 z-30 flex items-center gap-0.5 p-1 rounded-xl bg-[#12122a] border border-[#2a2a4a] shadow-xl whitespace-nowrap">
              {sizeOptions.map((opt) => {
                const active = opt.value === currentSize;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onChangeWidgetSize) onChangeWidgetSize(widgetId, opt.value);
                      setOpenSizeMenuId(null);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'text-[#8888a8] hover:text-[#e8e8f0] hover:bg-[#1c1c3a]'
                    }`}
                  >
                    {opt.short}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          data-tour="drag-handle"
          data-drag-handle="true"
          {...dragHandleProps}
          title={lang === 'ar' ? 'اضغط واسحب لإعادة الترتيب' : 'Drag to reorder'}
          className={`${isQuarterCtrl ? 'w-5 h-5' : 'w-7 h-7'} rounded-lg hover:bg-[#1c1c3a] flex items-center justify-center cursor-grab active:cursor-grabbing text-[#5a5a78] hover:text-[#e8e8f0] touch-none transition-colors`}
          aria-label="Drag widget handle"
        >
          <GripVertical className="w-3.5 h-3.5" />
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
    const isQuarter = w.size === 'quarter';
    const cardPad = isQuarter ? 'p-3.5' : 'p-5';
    const titleClass = isQuarter
      ? 'font-semibold text-xs tracking-tight text-[#e8e8f0] truncate'
      : 'font-semibold text-sm tracking-tight text-[#e8e8f0] truncate';
    const extraBtnSize = isQuarter ? 'w-5 h-5' : 'w-7 h-7';

    switch (w.id) {
      case 'pomodoro':
        return (
          <div
            data-tour="pomodoro"
            className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className={titleClass}>
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
                  className={`${extraBtnSize} rounded-lg hover:bg-[#1c1c3a] flex items-center justify-center text-[#8888a8] hover:text-[#e8e8f0] transition-colors`}
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
                <div className={isQuarter ? 'flex flex-col items-center text-center gap-3' : 'flex items-center gap-5'}>
                  {/* Clickable Ring */}
                  <div
                    data-no-dnd="true"
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
                    className={`relative ${isQuarter ? 'w-20 h-20' : 'w-22 h-22'} shrink-0 flex items-center justify-center group ${
                      !isPomoRunning ? 'cursor-pointer' : ''
                    }`}
                  >
                    <svg viewBox="0 0 96 96" className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="var(--border)"
                        strokeWidth="7"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
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
                  <div className={`flex-1 min-w-0 space-y-2 ${isQuarter ? 'flex flex-col items-center' : ''}`}>
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
                    {!isQuarter && (
                      <div className="text-xs text-[#8888a8]">
                        {t('nextBreak', lang)}: 05:00
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={onTogglePomo}
                        className={`flex items-center gap-1.5 ${isQuarter ? 'px-3 py-1.5' : 'px-4 py-2'} rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all active:scale-95 whitespace-nowrap`}
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
                        className="p-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-emerald-500/40 text-[#8888a8] hover:text-[#e8e8f0] transition-colors shrink-0"
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
          <div className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className={titleClass}>
                  {t('widgetStats', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>

            <div
              className={`grid ${
                isExpanded
                  ? 'grid-cols-2 sm:grid-cols-4 gap-3'
                  : 'grid-cols-2 border-y border-[#2a2a4a]/50'
              }`}
            >
              <div
                className={
                  isExpanded
                    ? 'py-2 px-1 flex flex-col justify-between min-w-0'
                    : 'py-2.5 pe-2.5 border-e border-b border-[#2a2a4a]/50 flex flex-col justify-between min-w-0'
                }
              >
                <div className="text-[11px] font-medium text-[#8888a8] leading-snug">
                  {t('totalCards', lang)}
                </div>
                <div className="text-xl font-bold font-mono text-[#e8e8f0] mt-1 tabular-nums">
                  {cardStats.total}
                </div>
              </div>
              <div
                className={
                  isExpanded
                    ? 'py-2 px-1 flex flex-col justify-between min-w-0'
                    : 'py-2.5 ps-3 border-b border-[#2a2a4a]/50 flex flex-col justify-between min-w-0'
                }
              >
                <div className="text-[11px] font-medium text-[#8888a8] leading-snug">
                  {t('mastered', lang)}
                </div>
                <div className="text-xl font-bold font-mono text-teal-400 mt-1 tabular-nums">
                  {cardStats.mastered}
                </div>
              </div>
              <div
                className={
                  isExpanded
                    ? 'py-2 px-1 flex flex-col justify-between min-w-0'
                    : 'py-2.5 pe-2.5 border-e border-[#2a2a4a]/50 flex flex-col justify-between min-w-0'
                }
              >
                <div className="text-[11px] font-medium text-[#8888a8] leading-snug">
                  {t('streakDays', lang)}
                </div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-1 tabular-nums">
                  {streakInfo.currentStreak}
                </div>
              </div>
              <div
                className={
                  isExpanded
                    ? 'py-2 px-1 flex flex-col justify-between min-w-0'
                    : 'py-2.5 ps-3 flex flex-col justify-between min-w-0'
                }
              >
                <div className="text-[11px] font-medium text-[#8888a8] leading-snug">
                  {t('graded', lang)}
                </div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
                  {allGrades.length}
                </div>
              </div>
            </div>

            {/* Mastery & Deck Breakdown */}
            <div className="mt-3 pt-2 flex flex-wrap items-center justify-between gap-1 text-xs text-[#8888a8]">
              <span>
                {lang === 'ar' ? 'نسبة الإتقان:' : 'Mastery:'}{' '}
                <strong className="text-teal-400 font-mono tabular-nums">{cardStats.masteryPct}%</strong>
              </span>
              {isExpanded && (
                <span>
                  {state.categories.length} {t('categories', lang)} ·{' '}
                  {state.categories.flatMap((c) => c.decks || []).length}{' '}
                  {lang === 'ar' ? 'مجموعات' : 'decks'}
                </span>
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

      case 'aiUsage': {
        const activeModelInfo =
          liveModels.find((m) => m.id === state.settings.model) ||
          getModelInfo(state.settings.model);
        const modelTierLabel =
          activeModelInfo.tier === 'paid'
            ? lang === 'ar'
              ? 'مدفوع'
              : 'Paid'
            : activeModelInfo.badge === 'new'
            ? lang === 'ar'
              ? 'جديد'
              : 'New'
            : activeModelInfo.badge === 'latest'
            ? lang === 'ar'
              ? 'تلقائي'
              : 'Latest'
            : lang === 'ar'
            ? 'سريع'
            : 'Free';

        return (
          <div className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className={titleClass}>
                  {t('widgetAiUsage', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-emerald-400 truncate">
                  {activeModelInfo.name}
                </span>
                <span className="text-[11px] font-semibold text-[#8888a8] shrink-0">
                  {modelTierLabel}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8888a8]">
                  {lang === 'ar' ? 'الاستدعاءات اليومية' : 'Daily Calls'}
                </span>
                <span className="font-mono font-bold text-[#e8e8f0] tabular-nums">
                  {state.settings.aiTier === 'paid'
                    ? `${state.settings.aiUsageToday || 0} (High)`
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
                <div
                  className={`p-2.5 rounded-lg bg-[#1c1c3a] border border-[#2a2a4a] flex gap-2 text-xs ${
                    isExpanded
                      ? 'items-center justify-between'
                      : 'flex-col items-stretch'
                  }`}
                >
                  <span className="text-[#8888a8] text-[11px] leading-snug">
                    {t('pleaseAddKey', lang)}
                  </span>
                  <button
                    onClick={onOpenSettings}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shrink-0 whitespace-nowrap text-center transition-colors"
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
      }

      case 'goals':
        return (
          <div className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className={titleClass}>
                  {t('widgetGoals', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>

            <div className="space-y-3 pb-1.5">
              <div>
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <span className="text-[#8888a8] flex items-center gap-1.5 min-w-0 truncate">
                    <span className="truncate">
                      {isExpanded
                        ? `${t('dailyGoal', lang)} (${dailyGoal} ${t('minutes', lang)})`
                        : lang === 'ar'
                        ? 'الهدف اليومي'
                        : 'Daily Goal'}
                    </span>
                    {isPomoRunning && pomoMode === 'focus' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-400 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        <span>{lang === 'ar' ? 'نشط' : 'Live'}</span>
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-[#e8e8f0] whitespace-nowrap shrink-0 tabular-nums">
                    {isPomoRunning && pomoMode === 'focus'
                      ? `${todayMinutes}m ${totalTodaySeconds % 60}s / ${dailyGoal} min`
                      : `${todayMinutes} / ${dailyGoal} min`}
                  </span>
                </div>
                <div className="w-full bg-[#1c1c3a] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${dailyGoalPct}%`,
                      backgroundColor: dailyGoalPct >= 100 ? '#22c55e' : 'var(--primary)',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <span className="text-[#8888a8] truncate min-w-0">
                    {isExpanded
                      ? `${t('weeklyGoal', lang)} (${weeklyGoal} ${t('minutes', lang)})`
                      : lang === 'ar'
                      ? 'الهدف الأسبوعي'
                      : 'Weekly Goal'}
                  </span>
                  <span className="font-mono font-bold text-[#e8e8f0] whitespace-nowrap shrink-0 tabular-nums">
                    {weekTotalMinutes} / {weeklyGoal} min
                  </span>
                </div>
                <div className="w-full bg-[#1c1c3a] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${weeklyGoalPct}%`,
                      backgroundColor: weeklyGoalPct >= 100 ? '#22c55e' : 'var(--primary)',
                    }}
                  />
                </div>
              </div>

              {/* Lifetime Study Time - Indefinite counter without progress bar */}
              <div className="flex items-center justify-between gap-2 text-xs pt-1 pe-4">
                <span className="text-[#8888a8] truncate min-w-0">
                  {lang === 'ar' ? 'الوقت الإجمالي للدراسة مدى الحياة' : 'Lifetime Study Time'}
                </span>
                <span className="font-mono font-bold text-[#e8e8f0] whitespace-nowrap shrink-0 tabular-nums">
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
                  <span
                    className="font-semibold"
                    style={{ color: dailyGoalPct >= 100 ? '#22c55e' : 'var(--primary)' }}
                  >
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
          <div className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <Flame className={`w-4 h-4 ${streakInfo.activeToday ? 'text-rose-500' : 'text-[#8888a8]'}`} />
                </div>
                <h3 className={titleClass}>
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
                  className={`${extraBtnSize} rounded-lg hover:bg-[#1c1c3a] flex items-center justify-center text-[#8888a8] hover:text-[#e8e8f0] transition-colors`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="py-2 my-auto space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#e8e8f0] tabular-nums">
                  {streakInfo.currentStreak}
                </span>
                <span className="text-sm font-semibold text-[#8888a8]">
                  {t('streakDays', lang)}
                </span>
                {streakInfo.activeToday && (
                  <Flame className="w-4 h-4 text-rose-500 fill-rose-500 ms-auto shrink-0" />
                )}
              </div>
              <p className="text-xs text-[#8888a8] leading-relaxed">
                {streakInfo.activeToday
                  ? t('streakActiveToday', lang)
                  : t('streakInactive', lang)}
              </p>
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
          <div className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className={titleClass}>
                    {t('widgetActivity', lang)}
                  </h3>
                  <div className="text-[11px] font-bold text-emerald-400 truncate">
                    {weekTotalMinutes} min {t('thisWeek', lang)}
                  </div>
                </div>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>

            <div className={`grid grid-cols-7 ${isQuarter ? 'gap-1' : 'gap-2'} pt-2`}>
              {weekActivity.map((day) => {
                const isToday = day.isToday;
                const effectiveMinutes = isToday
                  ? day.minutes + activeFocusSeconds / 60
                  : day.minutes;
                const isGoalAchieved = dailyGoal > 0 && effectiveMinutes >= dailyGoal;
                const barPct =
                  effectiveMinutes > 0
                    ? Math.min(100, Math.round((effectiveMinutes / Math.max(1, dailyGoal)) * 100))
                    : 0;

                return (
                  <div
                    key={day.dateKey}
                    title={
                      isGoalAchieved
                        ? `${Math.round(effectiveMinutes)} / ${dailyGoal} min · ${
                            lang === 'ar' ? 'تم تحقيق الهدف' : 'Goal achieved'
                          }`
                        : `${Math.round(effectiveMinutes)} / ${dailyGoal} min`
                    }
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`w-full bg-[#1c1c3a] rounded-xl h-20 flex flex-col justify-end p-1 border transition-colors ${
                        isGoalAchieved ? 'border-[#22c55e]/50' : 'border-[#2a2a4a]/40'
                      }`}
                    >
                      {effectiveMinutes > 0 ? (
                        <div
                          style={{
                            height: `${isGoalAchieved ? 100 : Math.max(4, barPct)}%`,
                            backgroundColor: isGoalAchieved ? '#22c55e' : 'var(--primary)',
                          }}
                          className="w-full rounded-lg shadow-sm transition-all duration-300"
                        />
                      ) : null}
                    </div>
                    <span
                      style={isGoalAchieved ? { color: '#22c55e' } : undefined}
                      className={`${isQuarter ? 'text-[9px]' : 'text-[10px]'} font-bold ${
                        isGoalAchieved
                          ? ''
                          : isToday
                          ? 'text-emerald-400'
                          : 'text-[#8888a8]'
                      }`}
                    >
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
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
          <div className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className={titleClass}>
                  {t('widgetSessionsToday', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(
                w.id,
                w.size,
                index,
                dragHandleProps,
                !isQuarter ? (
                  <span className="text-xs text-[#8888a8] whitespace-nowrap">
                    {todaySessions.length} {t('sessions', lang)}
                  </span>
                ) : undefined
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
          <div className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className={titleClass}>
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
                  className={`${extraBtnSize} rounded-lg hover:bg-[#1c1c3a] flex items-center justify-center text-[#8888a8] hover:text-[#e8e8f0] transition-colors`}
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
                    data-no-dnd="true"
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
          <div className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className={titleClass}>
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
                  className={`${extraBtnSize} rounded-lg hover:bg-[#1c1c3a] flex items-center justify-center text-[#8888a8] hover:text-[#e8e8f0] transition-colors`}
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
                    data-no-dnd="true"
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
          <div className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className={titleClass}>
                  {t('widgetGrades', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>

            <div className="py-2 my-auto space-y-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  {gpaInfo.gpa}%
                </span>
                <span className="text-xs font-semibold text-[#e8e8f0]">
                  {t('overallGpa', lang)}: {gpaInfo.letter}
                </span>
              </div>
              <p className="text-[11px] text-[#8888a8] leading-snug">
                {allGrades.length} {lang === 'ar' ? 'تقييمات مسجلة' : 'assessments'}
              </p>
            </div>

            <div className={`mt-3 pt-3 border-t border-[#2a2a4a]/40 text-xs text-[#8888a8] flex items-center justify-between gap-2 ${isQuarter ? 'pe-4' : ''}`}>
              <span>{lang === 'ar' ? 'متوسط مرجّح' : 'Weighted GPA'}</span>
              <span className="text-emerald-300 font-semibold">
                {allGrades.length === 0
                  ? lang === 'ar'
                    ? 'لا توجد درجات'
                    : 'No grades yet'
                  : gpaInfo.gpa >= 85
                  ? 'Excellent Standing'
                  : 'Good Progress'}
              </span>
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

      case 'quizzes':
      case 'quizAvg':
        return (
          <div className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                </div>
                <h3 className={titleClass}>
                  {t('widgetQuizAvg', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>

            <div className="py-2 my-auto space-y-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-bold font-mono text-teal-400 tabular-nums">
                  {avgQuizScore}%
                </span>
                <span className="text-xs font-semibold text-[#e8e8f0]">
                  {t('quizAvg', lang)}
                </span>
              </div>
              <p className="text-[11px] text-[#8888a8] leading-snug">
                {allQuizzes.length} {lang === 'ar' ? 'كويزات' : 'quizzes'} · {scoredQuizzes.length}{' '}
                {lang === 'ar' ? 'مكتمل' : 'scored'}
              </p>
            </div>

            <div className={`mt-3 pt-3 border-t border-[#2a2a4a]/40 text-xs text-[#8888a8] flex items-center justify-between gap-2 ${isQuarter ? 'pe-4' : ''}`}>
              <span>{scoredQuizzes.length} {lang === 'ar' ? 'مكتمل' : 'scored'}</span>
              <span className="text-teal-400 font-bold">
                {scoredQuizzes.length === 0
                  ? lang === 'ar'
                    ? 'جاهز للبدء'
                    : 'Ready'
                  : avgQuizScore >= 80
                  ? 'Mastery Level'
                  : 'Developing'}
              </span>
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

      case 'actions':
        return (
          <div
            data-tour="quick-actions"
            className={`bg-[#12122a] border border-[#2a2a4a] rounded-xl ${cardPad} transition-colors hover:border-[#3a3a5a] flex flex-col justify-between h-full relative min-w-0`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center text-[#8888a8]">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className={titleClass}>
                  {t('widgetActions', lang)}
                </h3>
              </div>
              {renderWidgetHeaderControls(w.id, w.size, index, dragHandleProps)}
            </div>
            <div className={`grid ${isExpanded ? 'grid-cols-2 sm:grid-cols-4' : isQuarter ? 'grid-cols-1' : 'grid-cols-2'} ${isQuarter ? 'gap-1.5' : 'gap-2'}`}>
              <button
                onClick={onOpenNewCategory}
                className={`flex items-center justify-center gap-1.5 ${isQuarter ? 'px-2.5 py-1.5' : 'p-2.5'} rounded-lg bg-[#1c1c3a] border border-[#2a2a4a] hover:bg-[#242448] text-xs font-medium text-[#e8e8f0] transition-colors min-w-0`}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{t('newCategory', lang)}</span>
              </button>
              <button
                onClick={onOpenNewDeck}
                className={`flex items-center justify-center gap-1.5 ${isQuarter ? 'px-2.5 py-1.5' : 'p-2.5'} rounded-lg bg-[#1c1c3a] border border-[#2a2a4a] hover:bg-[#242448] text-xs font-medium text-[#e8e8f0] transition-colors min-w-0`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{t('newDeck', lang)}</span>
              </button>
              <button
                onClick={onOpenGenerateCards}
                className={`flex items-center justify-center gap-1.5 ${isQuarter ? 'px-2.5 py-1.5' : 'p-2.5'} rounded-lg bg-[#1c1c3a] border border-[#2a2a4a] hover:bg-[#242448] text-xs font-medium text-[#e8e8f0] transition-colors min-w-0`}
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate">{t('generateAI', lang)}</span>
              </button>
              <button
                onClick={onOpenFullscreenPomo}
                className={`flex items-center justify-center gap-1.5 ${isQuarter ? 'px-2.5 py-1.5' : 'p-2.5'} rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors min-w-0`}
              >
                <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                <span className="truncate">{t('start', lang)}</span>
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
    <div className="space-y-5">
      {/* Top Overview Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-0.5">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-base font-semibold tracking-tight text-[#e8e8f0]">
            {t('scopeAll', lang)}
          </h2>
          <span className="text-xs text-[#8888a8]">
            {state.categories.length} {t('categories', lang)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToTimeline && (
            <button
              onClick={onNavigateToTimeline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#12122a] border border-[#2a2a4a] hover:bg-[#1c1c3a] text-xs font-medium text-[#e8e8f0] transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#8888a8]" />
              <span>{lang === 'ar' ? 'الجدول الدراسي' : 'Timetable'}</span>
            </button>
          )}

          <button
            onClick={onOpenCustomize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#12122a] border border-[#2a2a4a] hover:bg-[#1c1c3a] text-xs font-medium text-[#e8e8f0] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-[#8888a8]" />
            <span>{t('customizeDashboard', lang)}</span>
          </button>
        </div>
      </div>

      {/* Grid of Draggable Widgets (Android OS-style free drag, auto-scroll, and live slot reflow) */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        autoScroll={{
          threshold: { x: 0.1, y: 0.16 },
          acceleration: 14,
        }}
      >
        <div ref={gridRef} className="grid grid-cols-12 gap-5 select-none">
          {displayedVisibleWidgets.map((w, index) => (
            <DraggableWidgetWrapper
              key={w.id}
              id={w.id}
              sizeClass={getSizeClass(w.size)}
              title={getWidgetTitle(w.id)}
              lang={lang}
              isCurrentlyDragged={w.id === activeId}
            >
              {(dragHandleProps) => renderWidgetContent(w, index, dragHandleProps)}
            </DraggableWidgetWrapper>
          ))}
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 200,
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
                  className="scale-[1.015] shadow-xl ring-1 ring-emerald-500/60 rounded-xl pointer-events-none cursor-grabbing opacity-95 bg-[#12122a]"
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
