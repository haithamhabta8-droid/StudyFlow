import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Lock,
  RefreshCw,
  Plus,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Flame,
  Check,
  MapPin,
  FileText,
} from 'lucide-react';
import { CalendarEventItem } from '../types/index.ts';
import {
  fetchGoogleCalendarEventsForMonth,
  isEventTimeGated,
  formatEventTime,
  formatEventDate,
} from '../utils/googleCalendar.ts';
import { getStoredAccessToken, requestGoogleAccessToken } from '../utils/googleDrive.ts';
import { playChime } from '../utils/audio.ts';

interface TimelineViewProps {
  events: CalendarEventItem[];
  lang: 'ar' | 'en';
  primaryColor: string;
  isGoogleConnected: boolean;
  onUpdateEvents: (events: CalendarEventItem[]) => void;
  onEventCompleted: (event: CalendarEventItem) => void;
  onConnectGoogle: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  lang,
  primaryColor,
  isGoogleConnected,
  onUpdateEvents,
  onEventCompleted,
  onConnectGoogle,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Modal for adding manual schedule items
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('15:00');

  // Update current time every 15 seconds for accurate time-gating evaluation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  // Sync Google Calendar for the selected month
  const handleSyncMonth = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccessMsg(null);

    let token = getStoredAccessToken();
    if (!token) {
      try {
        token = await requestGoogleAccessToken();
      } catch (err: any) {
        setSyncError(err?.message || 'Google authorization required to access calendar.');
        setIsSyncing(false);
        return;
      }
    }

    try {
      const fetchedEvents = await fetchGoogleCalendarEventsForMonth(
        token,
        currentYear,
        currentMonth
      );

      // Merge fetched events with existing events to preserve completed statuses
      const existingMap = new Map(events.map((e) => [e.id, e]));
      const mergedEvents = fetchedEvents.map((fe) => {
        const existing = existingMap.get(fe.id);
        if (existing && existing.completed) {
          return { ...fe, completed: true, completedAt: existing.completedAt };
        }
        return fe;
      });

      // Keep any manual events from this month
      const manualEvents = events.filter((e) => e.source === 'manual');
      const allMerged = [...manualEvents, ...mergedEvents.filter((me) => !manualEvents.some((m) => m.id === me.id))];

      onUpdateEvents(allMerged);
      setSyncSuccessMsg(
        lang === 'ar'
          ? `تم مزامنة تقويم Google بنجاح! (${fetchedEvents.length} أحداث)`
          : `Synced with Google Calendar (${fetchedEvents.length} events)`
      );
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setSyncError(err?.message || 'Failed to sync Google Calendar.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-fetch on first view load if connected and no events cached for this month
  useEffect(() => {
    if (isGoogleConnected && events.length === 0) {
      handleSyncMonth().catch(() => null);
    }
  }, [isGoogleConnected]);

  // Navigate dates
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Filter events for the currently selected date
  const selectedDayStart = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    0,
    0,
    0
  ).getTime();

  const selectedDayEnd = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    23,
    59,
    59,
    999
  ).getTime();

  const dayEvents = events
    .filter((e) => e.startTime >= selectedDayStart && e.startTime <= selectedDayEnd)
    .sort((a, b) => a.startTime - b.startTime);

  const completedCount = dayEvents.filter((e) => e.completed).length;

  // Handle Confirm Completion (Time-gated)
  const handleConfirmCompletion = (event: CalendarEventItem) => {
    if (isEventTimeGated(event.startTime)) {
      return;
    }

    const updated = events.map((e) =>
      e.id === event.id ? { ...e, completed: true, completedAt: Date.now() } : e
    );

    onUpdateEvents(updated);
    playChime();
    onEventCompleted({ ...event, completed: true, completedAt: Date.now() });
  };

  // Handle Manual Event Creation
  const handleCreateManualEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const [startH, startM] = newStartTime.split(':').map(Number);
    const [endH, endM] = newEndTime.split(':').map(Number);

    const startMs = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      startH || 12,
      startM || 0
    ).getTime();

    const endMs = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      endH || 13,
      endM || 0
    ).getTime();

    const newItem: CalendarEventItem = {
      id: `manual-${Math.random().toString(36).slice(2, 9)}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      startTime: startMs,
      endTime: Math.max(endMs, startMs + 1800000),
      source: 'manual',
      completed: false,
      color: primaryColor,
    };

    onUpdateEvents([newItem, ...events]);
    setNewTitle('');
    setNewDesc('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Calendar Sync Controls */}
      <div className="p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-extrabold text-[#e8e8f0]">
              {lang === 'ar' ? 'الجدول الزمني والتقويم' : 'Study Timeline & Calendar'}
            </h1>
          </div>
          <p className="text-xs text-[#8888a8] mt-1">
            {lang === 'ar'
              ? 'مزامنة كاملة مع تقويم Google وحفظ جدول الشهر محلياً للعمل بدون إنترنت مع تأكيد الإنجاز.'
              : 'Full Google Calendar integration with offline monthly schedule caching and time-gated completions.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isGoogleConnected ? (
            <button
              onClick={handleSyncMonth}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? lang === 'ar'
                    ? 'جارٍ المزامنة...'
                    : 'Syncing Calendar...'
                  : lang === 'ar'
                  ? 'مزامنة تقويم Google'
                  : 'Sync Google Calendar'}
              </span>
            </button>
          ) : (
            <button
              onClick={onConnectGoogle}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0] transition-colors"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'ar' ? 'ربط تقويم Google' : 'Connect Google Calendar'}</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-teal-400" />
            <span>{lang === 'ar' ? 'إضافة موعد' : 'Add Task / Event'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Messages */}
      {syncSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 stroke-[3]" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}
      {syncError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Date Navigation & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#12122a] border border-[#2a2a4a]">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-[#8888a8] hover:text-white transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs font-bold text-[#e8e8f0] hover:text-purple-300 transition-colors"
          >
            {lang === 'ar' ? 'اليوم' : 'Today'}
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-[#8888a8] hover:text-white transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-sm font-extrabold text-[#e8e8f0] ms-2">
            {formatEventDate(selectedDate.getTime(), lang)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#8888a8]">
            {lang === 'ar'
              ? `${dayEvents.length} مهام مبرمجة اليوم`
              : `${dayEvents.length} scheduled items`}
          </span>
          {completedCount > 0 && (
            <span className="flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {completedCount} {lang === 'ar' ? 'مكتملة' : 'Completed'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Events Timeline List */}
      <div className="space-y-3">
        {dayEvents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#12122a] border border-[#2a2a4a] space-y-3">
            <Clock className="w-10 h-10 text-[#5a5a78] mx-auto stroke-[1.5]" />
            <p className="text-sm font-bold text-[#e8e8f0]">
              {lang === 'ar' ? 'لا توجد مواعيد مجدولة لهذا اليوم' : 'No scheduled items for this day'}
            </p>
            <p className="text-xs text-[#8888a8] max-w-md mx-auto">
              {lang === 'ar'
                ? 'اضغط على مزامنة تقويم Google لاستيراد مواعيدك، أو أضف مهمة دراسية يدوياً.'
                : 'Click "Sync Google Calendar" to pull your schedule, or add a custom study task.'}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة مهمة دراسية' : 'Add Study Event'}</span>
            </button>
          </div>
        ) : (
          dayEvents.map((event) => {
            const isLocked = isEventTimeGated(event.startTime);
            const isCompleted = Boolean(event.completed);

            return (
              <div
                key={event.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : isLocked
                    ? 'bg-[#12122a] border-[#2a2a4a]'
                    : 'bg-[#12122a] border-purple-500/40 hover:border-purple-500/60'
                }`}
              >
                {/* Event Details */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isLocked
                        ? 'bg-[#1c1c3a] text-[#8888a8]'
                        : 'bg-purple-600/20 text-purple-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm font-extrabold ${
                          isCompleted
                            ? 'line-through text-[#8888a8]'
                            : 'text-[#e8e8f0]'
                        }`}
                      >
                        {event.title}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1c1c3a] text-[#8888a8] border border-[#2a2a4a]">
                        {event.source === 'google' ? 'Google Calendar' : 'StudyFlow'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#8888a8]">
                      <span className="flex items-center gap-1 font-mono font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {formatEventTime(event.startTime, lang)} -{' '}
                          {formatEventTime(event.endTime, lang)}
                        </span>
                      </span>

                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" />
                          <span className="truncate max-w-[200px]">{event.location}</span>
                        </span>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-xs text-[#8888a8] leading-relaxed line-clamp-2 pt-0.5">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Time-Gated Confirmation Action */}
                <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                  {isCompleted ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{lang === 'ar' ? 'تم الإنجاز (+1 حماس)' : 'Completed (+1 Streak)'}</span>
                    </div>
                  ) : isLocked ? (
                    <div
                      title={
                        lang === 'ar'
                          ? `هذا الموعد مقفل حتى وقت بدايته: ${formatEventTime(event.startTime, lang)}`
                          : `Locked until start time: ${formatEventTime(event.startTime, lang)}`
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-[#8888a8] text-xs font-medium cursor-not-allowed opacity-75"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'ar'
                          ? `مقفل حتى ${formatEventTime(event.startTime, lang)}`
                          : `Locked until ${formatEventTime(event.startTime, lang)}`}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConfirmCompletion(event)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-md shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'تأكيد الإنجاز' : 'Confirm Completion'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Task Add Modal */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#e8e8f0]">
              {lang === 'ar' ? 'إضافة موعد أو مهمة جديدة' : 'Add Scheduled Event / Task'}
            </h3>

            <form onSubmit={handleCreateManualEvent} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {lang === 'ar' ? 'عنوان المهمة' : 'Title'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Biology Chapter 4 Review"
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8888a8] block mb-1">
                    {lang === 'ar' ? 'وقت البدء' : 'Start Time'}
                  </label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8888a8] block mb-1">
                    {lang === 'ar' ? 'وقت الانتهاء' : 'End Time'}
                  </label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {lang === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Description (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g., Focus on practice questions 1-20"
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1c1c3a] text-xs font-bold text-[#8888a8] hover:text-white"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  {lang === 'ar' ? 'حفظ الموعد' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
