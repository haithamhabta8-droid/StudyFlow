import React from 'react';
import {
  User,
  Edit3,
  Settings,
  Cloud,
  Award,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { AppState, Category, UserProfile } from '../types/index.ts';
import {
  calculateCardStats,
  calculateWeightedGPA,
  calculateStreak,
} from '../utils/calculations.ts';
import { t } from '../utils/translations.ts';

interface ProfileViewProps {
  state: AppState;
  lang: 'ar' | 'en';
  onOpenEditModal: () => void;
  onOpenSettings: () => void;
  onConnectGoogle: () => void;
  onSelectCategory: (categoryId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  state,
  lang,
  onOpenEditModal,
  onOpenSettings,
  onConnectGoogle,
  onSelectCategory,
}) => {
  const profile = state.profile || { name: 'Student', level: 'university' };
  const allSessions = state.categories.flatMap((c) => c.sessions || []);
  const allGrades = state.categories.flatMap((c) => c.grades || []);
  const allQuizzes = state.categories.flatMap((c) => c.quizzes || []);
  const cardStats = calculateCardStats(state.categories);
  const gpaInfo = calculateWeightedGPA(allGrades);
  const streakInfo = calculateStreak(
    allSessions.map((s) => s.ts),
    state.studiedDates
  );

  const scoredQuizzes = allQuizzes.filter((q) => q.score !== undefined);
  const avgQuizScore =
    scoredQuizzes.length > 0
      ? Math.round(
          scoredQuizzes.reduce((acc, q) => acc + (q.score || 0), 0) / scoredQuizzes.length
        )
      : 0;

  const totalMinutes = allSessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const uniqueStudyDaysCount = Math.max(1, streakInfo.uniqueDays.length);
  const avgDailyMinutes = Math.round(totalMinutes / uniqueStudyDaysCount);

  const isGoogleConnected = Boolean(profile.signedIn || profile.email);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Main Profile Banner Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#12122a] border border-[#2a2a4a] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -start-24 w-64 h-64 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
          {/* Avatar */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-purple-600 to-teal-400 p-0.5 shadow-xl shadow-purple-600/25 shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#12122a] flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-extrabold text-3xl text-[#e8e8f0]">
                  {profile.name?.charAt(0).toUpperCase() || <User className="w-10 h-10" />}
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#e8e8f0]">
                {profile.name || (lang === 'ar' ? 'طالب متميز' : 'Student')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 capitalize">
                {profile.level || 'University'}
              </span>
            </div>

            <p className="text-xs text-[#8888a8] leading-relaxed max-w-lg">
              {profile.bio ||
                (lang === 'ar'
                  ? 'أضف نبذة عن أهدافك الدراسية ومجالات اهتمامك...'
                  : 'Add a bio about your study goals, major, and learning routine...')}
            </p>

            {profile.email && (
              <span className="inline-block text-[11px] text-teal-400 font-mono">
                {profile.email}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10 self-stretch sm:self-auto justify-end">
          <button
            onClick={onOpenEditModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0] transition-all hover:scale-105 active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('editProfile', lang)}</span>
          </button>

          {!isGoogleConnected ? (
            <button
              onClick={onConnectGoogle}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'ربط حساب Google' : 'Sign in with Google'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'Google متصل' : 'Google Connected'}</span>
            </div>
          )}

          <button
            onClick={onOpenSettings}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0] transition-all hover:scale-105 active:scale-95"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t('settings', lang)}</span>
          </button>
        </div>
      </div>

      {/* 2. Stats Grid (6 KPIs) */}
      <div>
        <h2 className="text-sm font-extrabold text-[#e8e8f0] mb-3">
          {lang === 'ar' ? 'إحصائيات الأداء الدراسي' : 'Study Performance Statistics'}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* GPA */}
          <div className="p-4 rounded-2xl bg-[#12122a] border border-[#2a2a4a] space-y-1">
            <span className="text-[11px] font-bold text-[#8888a8] flex items-center gap-1.5 truncate">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('overallGpa', lang)}</span>
            </span>
            <div className="text-xl font-mono font-extrabold text-[#e8e8f0]">
              {gpaInfo.gpa}%
            </div>
            <span className="text-[10px] font-semibold text-purple-400 block">
              Grade: {gpaInfo.letter}
            </span>
          </div>

          {/* Quiz Avg */}
          <div className="p-4 rounded-2xl bg-[#12122a] border border-[#2a2a4a] space-y-1">
            <span className="text-[11px] font-bold text-[#8888a8] flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('quizAvg', lang)}</span>
            </span>
            <div className="text-xl font-mono font-extrabold text-teal-400">
              {avgQuizScore}%
            </div>
            <span className="text-[10px] text-[#8888a8] block">
              {scoredQuizzes.length} {lang === 'ar' ? 'اختبارات' : 'quizzes'}
            </span>
          </div>

          {/* Total Cards */}
          <div className="p-4 rounded-2xl bg-[#12122a] border border-[#2a2a4a] space-y-1">
            <span className="text-[11px] font-bold text-[#8888a8] flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('totalCards', lang)}</span>
            </span>
            <div className="text-xl font-mono font-extrabold text-[#e8e8f0]">
              {cardStats.total}
            </div>
            <span className="text-[10px] text-[#8888a8] block">
              Across all decks
            </span>
          </div>

          {/* Mastered */}
          <div className="p-4 rounded-2xl bg-[#12122a] border border-[#2a2a4a] space-y-1">
            <span className="text-[11px] font-bold text-[#8888a8] flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('mastered', lang)}</span>
            </span>
            <div className="text-xl font-mono font-extrabold text-emerald-400">
              {cardStats.mastered}
            </div>
            <span className="text-[10px] text-emerald-400/80 block">
              {cardStats.masteryPct}% mastery
            </span>
          </div>

          {/* Avg Daily Minutes */}
          <div className="p-4 rounded-2xl bg-[#12122a] border border-[#2a2a4a] space-y-1">
            <span className="text-[11px] font-bold text-[#8888a8] flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ar' ? 'المعدل اليومي' : 'Daily Avg'}</span>
            </span>
            <div className="text-xl font-mono font-extrabold text-amber-400">
              {avgDailyMinutes}m
            </div>
            <span className="text-[10px] text-[#8888a8] block">
              {totalMinutes}m total
            </span>
          </div>

          {/* Day Streak */}
          <div className="p-4 rounded-2xl bg-[#12122a] border border-[#2a2a4a] space-y-1">
            <span className="text-[11px] font-bold text-[#8888a8] flex items-center gap-1.5 truncate">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('streakDays', lang)}</span>
            </span>
            <div className="text-xl font-mono font-extrabold text-rose-400">
              {streakInfo.currentStreak}
            </div>
            <span className="text-[10px] text-rose-400/80 block">
              Best: {streakInfo.bestStreak} days
            </span>
          </div>
        </div>
      </div>

      {/* 3. Categories & Mastery Progress */}
      <div className="p-6 rounded-3xl bg-[#12122a] border border-[#2a2a4a] space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-extrabold text-[#e8e8f0]">
              {lang === 'ar' ? 'المواد الدراسية ومستويات الإتقان' : 'Categories & Mastery Progress'}
            </h2>
          </div>
          <span className="text-xs text-[#8888a8]">
            {state.categories.length} {t('categories', lang)}
          </span>
        </div>

        {state.categories.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8888a8]">
            {lang === 'ar' ? 'لا توجد تصنيفات حالياً.' : 'No categories created yet.'}
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {state.categories.map((cat) => {
              const catStats = calculateCardStats([cat]);
              const decksCount = cat.decks?.length || 0;
              const tasksCount = cat.tasks?.length || 0;

              return (
                <div
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className="group p-4 rounded-2xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 cursor-pointer transition-all hover:-translate-y-0.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <span className="font-extrabold text-sm text-[#e8e8f0] group-hover:text-purple-300 transition-colors">
                          {lang === 'ar' ? cat.name : cat.nameEn || cat.name}
                        </span>
                        <span className="text-xs text-[#8888a8] ms-3">
                          {decksCount} decks · {catStats.total} cards · {tasksCount} tasks
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-teal-400">
                        {catStats.masteryPct}%
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8888a8] group-hover:text-[#e8e8f0] rtl:rotate-180 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#12122a] rounded-full h-2 overflow-hidden border border-[#2a2a4a]/40">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${catStats.masteryPct}%`,
                        backgroundColor: cat.color || '#7c5cfc',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
