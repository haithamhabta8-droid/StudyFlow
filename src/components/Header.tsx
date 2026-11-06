import React from 'react';
import {
  Menu,
  Search,
  Home,
  Flame,
  Globe,
  Settings,
  Layers,
  CheckSquare,
  Calendar,
  Award,
  GitBranch,
  HelpCircle,
  FileText,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Category } from '../types/index.ts';
import { t, TranslationKey } from '../utils/translations.ts';

interface HeaderProps {
  currentCategory: Category | null;
  currentTab: string;
  lang: 'ar' | 'en';
  streakCount: number;
  streakActiveToday: boolean;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onGoHome: () => void;
  onOpenSearch: () => void;
  onOpenStreakModal: () => void;
  onOpenSettings: () => void;
  onToggleLang: () => void;
  onSwitchTab: (tab: string) => void;
  onOpenTimeline?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  currentTab,
  lang,
  streakCount,
  streakActiveToday,
  isSidebarCollapsed,
  onToggleSidebar,
  onGoHome,
  onOpenSearch,
  onOpenStreakModal,
  onOpenSettings,
  onToggleLang,
  onSwitchTab,
  onOpenTimeline,
}) => {
  const [isOnline, setIsOnline] = React.useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const tabs: { id: string; labelKey: TranslationKey; icon: React.ReactNode }[] = [
    { id: 'overview', labelKey: 'tabOverview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'cards', labelKey: 'tabCards', icon: <Layers className="w-4 h-4" /> },
    { id: 'tasks', labelKey: 'tabTasks', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'exams', labelKey: 'tabExams', icon: <Calendar className="w-4 h-4" /> },
    { id: 'grades', labelKey: 'tabGrades', icon: <Award className="w-4 h-4" /> },
    { id: 'mindmap', labelKey: 'tabMindmap', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'quiz', labelKey: 'tabQuiz', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'notes', labelKey: 'tabNotes', icon: <FileText className="w-4 h-4" /> },
    { id: 'askai', labelKey: 'tabAskAi', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a1a]/85 backdrop-blur-md border-b border-[#2a2a4a] px-4 lg:px-8 py-3 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left / Start Zone */}
        <div className="flex items-center gap-3">
          {/* Capsule Button Bar (for mobile & collapsed sidebar) */}
          <div className="flex items-center gap-1 bg-[#12122a] border border-[#2a2a4a] p-1 rounded-full shadow-sm">
            <button
              onClick={onToggleSidebar}
              title="Menu"
              aria-label="Toggle Navigation Menu"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#8888a8] hover:text-white hover:bg-purple-600/20 hover:text-purple-400 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSearch}
              title={t('searchTitle', lang)}
              aria-label={t('searchTitle', lang)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#8888a8] hover:text-white hover:bg-purple-600/20 hover:text-purple-400 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-[#2a2a4a] my-auto" />
            <button
              onClick={onGoHome}
              title={t('home', lang)}
              aria-label={t('home', lang)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#8888a8] hover:text-white hover:bg-purple-600/20 hover:text-purple-400 transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Title and context */}
          <div className="min-w-0">
            {currentCategory && currentTab !== 'home' ? (
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: currentCategory.color }}
                />
                <h1 className="text-base lg:text-lg font-extrabold text-[#e8e8f0] truncate">
                  {lang === 'ar'
                    ? currentCategory.name
                    : currentCategory.nameEn || currentCategory.name}
                </h1>
                {(currentCategory.subject || currentCategory.subjectEn) && (
                  <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 truncate">
                    {lang === 'ar'
                      ? currentCategory.subject
                      : currentCategory.subjectEn || currentCategory.subject}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-base lg:text-lg font-extrabold text-[#e8e8f0]">
                  StudyFlow
                </h1>
                <span className="text-xs text-[#8888a8] hidden sm:inline">
                  {t('welcome', lang)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center Zone: Tabs (Visible when inside a category) */}
        {currentCategory && currentTab !== 'home' && (
          <nav className="flex items-center gap-1 overflow-x-auto py-1 px-1 bg-[#12122a] border border-[#2a2a4a] rounded-xl scrollbar-none max-w-full">
            {tabs.map((tab) => {
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSwitchTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-[#8888a8] hover:text-[#e8e8f0] hover:bg-[#1c1c3a]'
                  }`}
                >
                  {tab.icon}
                  <span>{t(tab.labelKey, lang)}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right / End Zone: Badges & Controls */}
        <div className="flex items-center gap-2 ms-auto lg:ms-0">
          {/* Live Online / Offline Network Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
            title={
              isOnline
                ? 'Online: connected and live'
                : 'Offline: cached schedule available'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Timeline / Calendar Shortcut */}
          {onOpenTimeline && (
            <button
              onClick={onOpenTimeline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#12122a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0] transition-colors"
              title="Timeline & Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'الجدول' : 'Timeline'}</span>
            </button>
          )}

          {/* Streak Flame Badge */}
          <button
            onClick={onOpenStreakModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all ${
              streakActiveToday
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 shadow-sm shadow-rose-950'
                : 'bg-[#12122a] border-[#2a2a4a] text-[#8888a8] hover:border-purple-500/40 hover:text-purple-300'
            }`}
            title={streakActiveToday ? t('streakActiveToday', lang) : t('streakInactive', lang)}
          >
            <Flame
              className={`w-4 h-4 ${
                streakActiveToday
                  ? 'fill-rose-500 text-rose-500 animate-pulse'
                  : 'text-[#8888a8]'
              }`}
            />
            <span className="font-mono text-sm">{streakCount}</span>
            <span className="text-[11px] font-medium">{t('streakShort', lang)}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
