import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { PomodoroFullscreen } from './components/PomodoroFullscreen.tsx';
import { CardsView } from './components/CardsView.tsx';
import { TasksView } from './components/TasksView.tsx';
import { ExamsView } from './components/ExamsView.tsx';
import { GradesView } from './components/GradesView.tsx';
import { MindMapView } from './components/MindMapView.tsx';
import { QuizView } from './components/QuizView.tsx';
import { NotesView } from './components/NotesView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { TimelineView } from './components/TimelineView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { AskAIView } from './components/AskAIView.tsx';

// Modals
import { CategoryModal } from './components/modals/CategoryModal.tsx';
import { DeckModal } from './components/modals/DeckModal.tsx';
import { GenerateModal } from './components/modals/GenerateModal.tsx';
import { SearchModal } from './components/modals/SearchModal.tsx';
import { StreakModal } from './components/modals/StreakModal.tsx';
import { CustomizeDashboardModal } from './components/modals/CustomizeDashboardModal.tsx';
import { ProfileModal } from './components/modals/ProfileModal.tsx';
import { SessionEndModal } from './components/modals/SessionEndModal.tsx';
import { WelcomeTourModal } from './components/modals/WelcomeTourModal.tsx';

import { AppState, Category, Card, PomodoroSession } from './types/index.ts';
import {
  loadAppState,
  saveAppState,
  getDefaultState,
  importAppState,
} from './utils/storage.ts';
import {
  uploadBackupToDrive,
  getStoredAccessToken,
  requestGoogleAccessToken,
  fetchGoogleUserProfile,
} from './utils/googleDrive.ts';
import { calculateStreak, calculateCardStats } from './utils/calculations.ts';
import { playChime } from './utils/audio.ts';
import { t } from './utils/translations.ts';
import { User, Award, Layers, Clock } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());

  // Navigation
  const [currentCatId, setCurrentCatId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Responsive Layout
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(
    state.settings.sidebarCollapsed || false
  );

  // Modals visibility
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [isNewDeckOpen, setIsNewDeckOpen] = useState(false);
  const [isGenerateCardsOpen, setIsGenerateCardsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSessionEndModalOpen, setIsSessionEndModalOpen] = useState(false);
  const [completedSessionDuration, setCompletedSessionDuration] = useState(25);

  const [isWelcomeTourOpen, setIsWelcomeTourOpen] = useState(() => {
    try {
      return localStorage.getItem('studyflow_onboarded') !== 'true';
    } catch {
      return false;
    }
  });

  // Pomodoro Timer State
  const defaultPomoMins = state.settings.pomoWorkMinutes || 25;
  const [pomoTimeLeft, setPomoTimeLeft] = useState(defaultPomoMins * 60);
  const [pomoTotalDuration, setPomoTotalDuration] = useState(defaultPomoMins * 60);
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [pomoMode, setPomoMode] = useState<'focus' | 'break'>('focus');
  const [pomoBreaksCount, setPomoBreaksCount] = useState(0);
  const [pomoHideTime, setPomoHideTime] = useState(false);
  const [isPomoFullscreen, setIsPomoFullscreen] = useState(false);

  // Sync state to localStorage immediately, and auto-sync to Google Drive appDataFolder
  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    saveAppState(state);

    if (state.profile?.signedIn) {
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current);
      }
      autoSyncTimerRef.current = setTimeout(async () => {
        const token = getStoredAccessToken();
        if (token) {
          try {
            await uploadBackupToDrive(token, state);
          } catch (e) {
            console.warn('Auto-sync to Google Drive error:', e);
          }
        }
      }, 1500);
    }
  }, [state]);

  // Sync theme, direction, and primary accent color
  useEffect(() => {
    const theme = state.settings.theme || 'dark';
    document.documentElement.classList.remove('dark', 'light', 'black');
    document.documentElement.classList.add(theme);

    const isRTL = state.settings.lang === 'ar';
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', state.settings.lang);

    const primary = state.settings.primaryColor || '#7c5cfc';
    document.documentElement.style.setProperty('--primary', primary);
    const r = parseInt(primary.slice(1, 3), 16) || 124;
    const g = parseInt(primary.slice(3, 5), 16) || 92;
    const b = parseInt(primary.slice(5, 7), 16) || 252;
    document.documentElement.style.setProperty(
      '--primary-glow',
      `rgba(${r}, ${g}, ${b}, 0.35)`
    );
  }, [state.settings.theme, state.settings.lang, state.settings.primaryColor]);

  // Pomodoro Interval Loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPomoRunning) {
      timer = setInterval(() => {
        setPomoTimeLeft((prev) => {
          if (prev <= 1) {
            playChime();
            if (pomoMode === 'focus') {
              // Focus ended -> trigger session summary modal & switch to break
              setIsPomoRunning(false);
              setCompletedSessionDuration(Math.round(pomoTotalDuration / 60));
              setIsSessionEndModalOpen(true);
              setPomoMode('break');
              setPomoTotalDuration(5 * 60);
              return 5 * 60;
            } else {
              // Break ended -> switch to focus
              setPomoBreaksCount((b) => b + 1);
              setPomoMode('focus');
              setPomoTotalDuration(25 * 60);
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPomoRunning, pomoMode, pomoTotalDuration]);

  // Current category object
  const currentCategory = state.categories.find((c) => c.id === currentCatId) || null;

  // Streak info including completed calendar tasks and sessions
  const allSessions = state.categories.flatMap((c) => c.sessions || []);
  const streakInfo = calculateStreak(
    allSessions.map((s) => s.ts),
    state.studiedDates
  );

  // Category Actions
  const handleCreateCategory = (name: string, subject: string, color: string) => {
    const newCat: Category = {
      id: Math.random().toString(36).slice(2, 9),
      name,
      nameEn: name,
      subject,
      subjectEn: subject,
      color,
      decks: [],
      tasks: [],
      exams: [],
      grades: [],
      quizzes: [],
      notes: [],
      sessions: [],
      log: [],
    };
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
    setCurrentCatId(newCat.id);
    setCurrentTab('overview');
  };

  const handleUpdateCategory = (updated: Category) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === updated.id ? updated : c)),
    }));
  };

  const handleDeleteCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
      pinned: prev.pinned.filter((pid) => pid !== id),
    }));
    if (currentCatId === id) {
      setCurrentCatId(null);
      setCurrentTab('home');
    }
  };

  const handleTogglePin = (id: string) => {
    setState((prev) => ({
      ...prev,
      pinned: prev.pinned.includes(id)
        ? prev.pinned.filter((pid) => pid !== id)
        : [...prev.pinned, id],
    }));
  };

  // Deck & AI Generation Actions
  const handleCreateDeck = (categoryId: string, name: string, color: string) => {
    const targetCat = state.categories.find((c) => c.id === categoryId);
    if (!targetCat) return;

    const newDeck = {
      id: Math.random().toString(36).slice(2, 9),
      name,
      nameEn: name,
      color,
      cards: [],
      created: Date.now(),
      source: 'manual',
    };

    handleUpdateCategory({
      ...targetCat,
      decks: [...(targetCat.decks || []), newDeck],
    });
    setCurrentCatId(categoryId);
    setCurrentTab('cards');
  };

  const handleGeneratedCards = (
    categoryId: string,
    deckName: string,
    cards: Card[]
  ) => {
    const targetCat = state.categories.find((c) => c.id === categoryId);
    if (!targetCat) return;

    const newDeck = {
      id: Math.random().toString(36).slice(2, 9),
      name: deckName,
      nameEn: deckName,
      color: targetCat.color,
      cards,
      created: Date.now(),
      source: 'ai',
    };

    handleUpdateCategory({
      ...targetCat,
      decks: [...(targetCat.decks || []), newDeck],
    });
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        aiUsageToday: (prev.settings.aiUsageToday || 0) + 1,
      },
    }));
    setCurrentCatId(categoryId);
    setCurrentTab('cards');
  };

  // Session Logging
  const handleSaveCompletedSession = (
    categoryId: string,
    note: string,
    shouldGenerateQuiz: boolean
  ) => {
    const sessionItem: PomodoroSession = {
      id: Math.random().toString(36).slice(2, 9),
      minutes: completedSessionDuration,
      ts: Date.now(),
      note: note || undefined,
    };

    const todayStr = new Date().toISOString().slice(0, 10);

    setState((prev) => {
      const dates = prev.studiedDates || [];
      const updatedDates = dates.includes(todayStr) ? dates : [...dates, todayStr];

      // If a category was chosen, save session to it
      if (categoryId) {
        return {
          ...prev,
          studiedDates: updatedDates,
          categories: prev.categories.map((c) => {
            if (c.id === categoryId) {
              const updatedQuizzes = shouldGenerateQuiz
                ? [
                    {
                      id: Math.random().toString(36).slice(2, 9),
                      title: `Quiz: ${note ? note.slice(0, 30) : 'Session Recall'}`,
                      questions: [
                        {
                          id: 'sq-1',
                          question: `What was the key topic in your focus session: "${note}"?`,
                          options: [
                            note || 'Core Concept',
                            'Unrelated Topic A',
                            'Unrelated Topic B',
                            'Unrelated Topic C',
                          ],
                          correctIndex: 0,
                        },
                      ],
                      created: Date.now(),
                    },
                    ...(c.quizzes || []),
                  ]
                : c.quizzes || [];

              return {
                ...c,
                sessions: [sessionItem, ...(c.sessions || [])],
                quizzes: updatedQuizzes,
              };
            }
            return c;
          }),
        };
      }
      return {
        ...prev,
        studiedDates: updatedDates,
      };
    });

    setIsSessionEndModalOpen(false);
  };

  // Settings, Profile & Reset
  const handleUpdateSettings = (partial: Partial<AppState['settings']>) => {
    setState((prev) => {
      const nextSettings = { ...prev.settings, ...partial };
      const nextState = { ...prev, settings: nextSettings };
      saveAppState(nextState);
      return nextState;
    });
  };

  const handleUpdateProfile = (partial: Partial<AppState['profile']>) => {
    setState((prev) => {
      const nextProfile = { ...prev.profile, ...partial };
      const nextState = { ...prev, profile: nextProfile };
      saveAppState(nextState);
      return nextState;
    });
  };

  const handleRestoreState = (restored: AppState) => {
    saveAppState(restored);
    setState(restored);
  };

  const handleResetAll = () => {
    localStorage.removeItem('studyFlow_v14');
    setState(getDefaultState());
    setCurrentCatId(null);
    setCurrentTab('home');
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        const imported = importAppState(content);
        if (imported) {
          setState(imported);
          alert('StudyFlow data imported successfully!');
        } else {
          alert('Invalid backup file. Could not parse JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Margin calculation based on responsive sidebar
  const sidebarOffsetClass = isCollapsedDesktop ? 'lg:ms-0' : 'lg:ms-72';

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-[#e8e8f0] flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        categories={state.categories}
        pinnedIds={state.pinned}
        currentCatId={currentCatId}
        currentTab={currentTab}
        lang={state.settings.lang}
        profile={state.profile}
        isOpenMobile={isMobileOpen}
        isCollapsedDesktop={isCollapsedDesktop}
        onSelectCategory={(id) => {
          setCurrentCatId(id);
          setCurrentTab('overview');
          setIsMobileOpen(false);
        }}
        onOpenNewCategory={() => {
          setIsNewCategoryOpen(true);
          setIsMobileOpen(false);
        }}
        onTogglePin={handleTogglePin}
        onDeleteCategory={handleDeleteCategory}
        onReorderCategories={(newCats) => setState((prev) => ({ ...prev, categories: newCats }))}
        onGoHome={() => {
          setCurrentCatId(null);
          setCurrentTab('home');
          setIsMobileOpen(false);
        }}
        onOpenSearch={() => {
          setIsSearchOpen(true);
          setIsMobileOpen(false);
        }}
        onOpenProfile={() => {
          setCurrentCatId(null);
          setCurrentTab('profile');
          setIsMobileOpen(false);
        }}
        onOpenSettings={() => {
          setCurrentCatId(null);
          setCurrentTab('settings');
          setIsMobileOpen(false);
        }}
        onToggleCollapseDesktop={() => {
          const next = !isCollapsedDesktop;
          setIsCollapsedDesktop(next);
          handleUpdateSettings({ sidebarCollapsed: next });
        }}
        onCloseMobile={() => setIsMobileOpen(false)}
        onOpenTimeline={() => {
          setCurrentCatId(null);
          setCurrentTab('timeline');
          setIsMobileOpen(false);
        }}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOffsetClass}`}
      >
        {/* Top Header */}
        <Header
          currentCategory={currentCategory}
          currentTab={currentTab}
          lang={state.settings.lang}
          streakCount={streakInfo.currentStreak}
          streakActiveToday={streakInfo.activeToday}
          isSidebarCollapsed={isCollapsedDesktop}
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setIsMobileOpen((prev) => !prev);
            } else {
              const next = !isCollapsedDesktop;
              setIsCollapsedDesktop(next);
              handleUpdateSettings({ sidebarCollapsed: next });
            }
          }}
          onGoHome={() => {
            setCurrentCatId(null);
            setCurrentTab('home');
          }}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenStreakModal={() => setIsStreakModalOpen(true)}
          onOpenSettings={() => {
            setCurrentCatId(null);
            setCurrentTab('settings');
          }}
          onToggleLang={() => {
            handleUpdateSettings({
              lang: state.settings.lang === 'ar' ? 'en' : 'ar',
            });
          }}
          onOpenTimeline={() => {
            setCurrentCatId(null);
            setCurrentTab('timeline');
          }}
          onSwitchTab={(tab) => setCurrentTab(tab)}
        />

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'home' || !currentCategory ? (
            currentTab === 'settings' ? (
              <SettingsView
                state={state}
                lang={state.settings.lang}
                onUpdateSettings={handleUpdateSettings}
                onUpdateProfile={handleUpdateProfile}
                onRestoreState={handleRestoreState}
                onImportState={handleImportFile}
                onResetAll={handleResetAll}
                onStartTutorial={() => setIsWelcomeTourOpen(true)}
              />
            ) : currentTab === 'timeline' ? (
              <TimelineView
                events={state.calendarEvents || []}
                lang={state.settings.lang}
                primaryColor={state.settings.primaryColor}
                isGoogleConnected={Boolean(state.profile.signedIn)}
                onUpdateEvents={(updatedEvents) => {
                  setState((prev) => ({
                    ...prev,
                    calendarEvents: updatedEvents,
                  }));
                }}
                onEventCompleted={(event) => {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  setState((prev) => {
                    const dates = prev.studiedDates || [];
                    const updatedDates = dates.includes(todayStr) ? dates : [...dates, todayStr];
                    return {
                      ...prev,
                      studiedDates: updatedDates,
                    };
                  });
                }}
                onConnectGoogle={async () => {
                  try {
                    const token = await requestGoogleAccessToken();
                    const profile = await fetchGoogleUserProfile(token);
                    handleUpdateProfile({ ...profile, signedIn: true });
                  } catch (e) {
                    console.warn('Google connect error:', e);
                  }
                }}
              />
            ) : currentTab === 'profile' ? (
              <ProfileView
                state={state}
                lang={state.settings.lang}
                onOpenEditModal={() => setIsProfileModalOpen(true)}
                onOpenSettings={() => {
                  setCurrentCatId(null);
                  setCurrentTab('settings');
                }}
                onConnectGoogle={async () => {
                  try {
                    const token = await requestGoogleAccessToken();
                    const profile = await fetchGoogleUserProfile(token);
                    handleUpdateProfile({ ...profile, signedIn: true });
                  } catch (e) {
                    console.warn('Google connect error:', e);
                  }
                }}
                onSelectCategory={(id) => {
                  setCurrentCatId(id);
                  setCurrentTab('overview');
                }}
              />
            ) : currentTab === 'askai' ? (
              <AskAIView
                category={currentCategory}
                lang={state.settings.lang}
                onOpenSettings={() => {
                  setCurrentCatId(null);
                  setCurrentTab('settings');
                }}
              />
            ) : (
              /* Dashboard Home */
              <Dashboard
                state={state}
                pomoTimeLeft={pomoTimeLeft}
                pomoTotalDuration={pomoTotalDuration}
                isPomoRunning={isPomoRunning}
                pomoMode={pomoMode}
                lang={state.settings.lang}
                onTogglePomo={() => setIsPomoRunning((prev) => !prev)}
                onResetPomo={() => {
                  setIsPomoRunning(false);
                  const resetMins = state.settings.pomoWorkMinutes || 25;
                  setPomoTimeLeft(resetMins * 60);
                  setPomoTotalDuration(resetMins * 60);
                  setPomoMode('focus');
                }}
                onOpenFullscreenPomo={() => setIsPomoFullscreen(true)}
                onOpenCustomize={() => setIsCustomizeOpen(true)}
                onOpenStreakModal={() => setIsStreakModalOpen(true)}
                onOpenNewCategory={() => setIsNewCategoryOpen(true)}
                onOpenNewDeck={() => setIsNewDeckOpen(true)}
                onOpenGenerateCards={() => setIsGenerateCardsOpen(true)}
                onOpenAddTask={() => {
                  if (state.categories.length > 0) {
                    setCurrentCatId(state.categories[0].id);
                    setCurrentTab('tasks');
                  } else {
                    setIsNewCategoryOpen(true);
                  }
                }}
                onOpenAddExam={() => {
                  if (state.categories.length > 0) {
                    setCurrentCatId(state.categories[0].id);
                    setCurrentTab('exams');
                  } else {
                    setIsNewCategoryOpen(true);
                  }
                }}
                onSelectCategory={(id, tab = 'overview') => {
                  setCurrentCatId(id);
                  setCurrentTab(tab);
                }}
                onOpenSettings={() => {
                  setCurrentCatId(null);
                  setCurrentTab('settings');
                }}
                onReorderWidgets={(newDashboard) =>
                  handleUpdateSettings({ dashboard: newDashboard })
                }
                onChangeWidgetSize={(widgetId, newSize) => {
                  const updatedDashboard = (state.settings.dashboard || []).map((w) =>
                    w.id === widgetId ? { ...w, size: newSize } : w
                  );
                  handleUpdateSettings({ dashboard: updatedDashboard });
                }}
                onUpdatePomoDuration={(mins) => {
                  setPomoTotalDuration(mins * 60);
                  setPomoTimeLeft(mins * 60);
                  handleUpdateSettings({ pomoWorkMinutes: mins });
                }}
                onNavigateToTimeline={() => {
                  setCurrentCatId(null);
                  setCurrentTab('timeline');
                }}
              />
            )
          ) : (
            /* Inside a Selected Category */
            <div>
              {currentTab === 'cards' && (
                <CardsView
                  category={currentCategory}
                  lang={state.settings.lang}
                  onUpdateCategory={handleUpdateCategory}
                  onOpenGenerateModal={() => setIsGenerateCardsOpen(true)}
                  onOpenNewDeckModal={() => setIsNewDeckOpen(true)}
                />
              )}

              {currentTab === 'tasks' && (
                <TasksView
                  category={currentCategory}
                  lang={state.settings.lang}
                  showCompleted={state.settings.showCompletedTasks}
                  onToggleShowCompleted={(v) =>
                    handleUpdateSettings({ showCompletedTasks: v })
                  }
                  onUpdateCategory={handleUpdateCategory}
                />
              )}

              {currentTab === 'exams' && (
                <ExamsView
                  category={currentCategory}
                  lang={state.settings.lang}
                  onUpdateCategory={handleUpdateCategory}
                />
              )}

              {currentTab === 'grades' && (
                <GradesView
                  category={currentCategory}
                  lang={state.settings.lang}
                  onUpdateCategory={handleUpdateCategory}
                />
              )}

              {currentTab === 'mindmap' && (
                <MindMapView
                  category={currentCategory}
                  lang={state.settings.lang}
                  onUpdateCategory={handleUpdateCategory}
                />
              )}

              {currentTab === 'quiz' && (
                <QuizView
                  category={currentCategory}
                  lang={state.settings.lang}
                  onUpdateCategory={handleUpdateCategory}
                />
              )}

              {currentTab === 'notes' && (
                <NotesView
                  category={currentCategory}
                  lang={state.settings.lang}
                  onUpdateCategory={handleUpdateCategory}
                />
              )}

              {currentTab === 'askai' && (
                <AskAIView
                  category={currentCategory}
                  lang={state.settings.lang}
                  onOpenSettings={() => {
                    setCurrentCatId(null);
                    setCurrentTab('settings');
                  }}
                />
              )}

              {currentTab === 'overview' && (
                <div className="space-y-6">
                  {/* Category Summary KPIs */}
                  {(() => {
                    const cStats = calculateCardStats([currentCategory]);
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a]">
                          <span className="text-xs text-[#8888a8] font-bold uppercase tracking-wider block">
                            {t('totalCards', state.settings.lang)}
                          </span>
                          <span className="text-3xl font-extrabold font-mono text-[#e8e8f0] mt-1 block">
                            {cStats.total}
                          </span>
                        </div>
                        <div className="p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a]">
                          <span className="text-xs text-[#8888a8] font-bold uppercase tracking-wider block">
                            {t('mastered', state.settings.lang)}
                          </span>
                          <span className="text-3xl font-extrabold font-mono text-teal-400 mt-1 block">
                            {cStats.mastered}
                          </span>
                        </div>
                        <div className="p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a]">
                          <span className="text-xs text-[#8888a8] font-bold uppercase tracking-wider block">
                            {t('masteryPct', state.settings.lang)}
                          </span>
                          <span className="text-3xl font-extrabold font-mono text-purple-400 mt-1 block">
                            {cStats.masteryPct}%
                          </span>
                        </div>
                        <div className="p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a]">
                          <span className="text-xs text-[#8888a8] font-bold uppercase tracking-wider block">
                            {t('reviewsWeek', state.settings.lang)}
                          </span>
                          <span className="text-3xl font-extrabold font-mono text-amber-400 mt-1 block">
                            {currentCategory.log?.length || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Shortcuts */}
                  <div className="p-6 rounded-2xl bg-[#12122a] border border-[#2a2a4a] space-y-4">
                    <h3 className="font-extrabold text-sm text-[#e8e8f0]">
                      Quick Shortcuts
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setCurrentTab('cards')}
                        className="px-4 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0]"
                      >
                        {t('tabCards', state.settings.lang)} (
                        {(currentCategory.decks || []).reduce(
                          (acc, d) => acc + (d.cards?.length || 0),
                          0
                        )}
                        )
                      </button>
                      <button
                        onClick={() => setCurrentTab('tasks')}
                        className="px-4 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0]"
                      >
                        {t('tabTasks', state.settings.lang)} (
                        {currentCategory.tasks?.length || 0})
                      </button>
                      <button
                        onClick={() => setCurrentTab('exams')}
                        className="px-4 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0]"
                      >
                        {t('tabExams', state.settings.lang)} (
                        {currentCategory.exams?.length || 0})
                      </button>
                      <button
                        onClick={() => setCurrentTab('mindmap')}
                        className="px-4 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0]"
                      >
                        {t('tabMindmap', state.settings.lang)}
                      </button>
                      <button
                        onClick={() => setCurrentTab('quiz')}
                        className="px-4 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0]"
                      >
                        {t('tabQuiz', state.settings.lang)} (
                        {currentCategory.quizzes?.length || 0})
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Pomodoro Fullscreen Modal */}
      <PomodoroFullscreen
        isOpen={isPomoFullscreen}
        timeLeft={pomoTimeLeft}
        totalDuration={pomoTotalDuration}
        isRunning={isPomoRunning}
        mode={pomoMode}
        breaksCount={pomoBreaksCount}
        hideTime={pomoHideTime}
        lang={state.settings.lang}
        onTogglePlay={() => setIsPomoRunning((prev) => !prev)}
        onReset={() => {
          setIsPomoRunning(false);
          setPomoTimeLeft(25 * 60);
          setPomoTotalDuration(25 * 60);
          setPomoMode('focus');
        }}
        onSkip={() => {
          setIsPomoRunning(false);
          if (pomoMode === 'focus') {
            setPomoMode('break');
            setPomoTimeLeft(5 * 60);
            setPomoTotalDuration(5 * 60);
          } else {
            setPomoMode('focus');
            setPomoTimeLeft(25 * 60);
            setPomoTotalDuration(25 * 60);
          }
        }}
        onToggleHideTime={() => setPomoHideTime((prev) => !prev)}
        onClose={() => setIsPomoFullscreen(false)}
      />

      {/* Modals */}
      <CategoryModal
        isOpen={isNewCategoryOpen}
        lang={state.settings.lang}
        onClose={() => setIsNewCategoryOpen(false)}
        onCreate={handleCreateCategory}
      />

      <DeckModal
        isOpen={isNewDeckOpen}
        categories={state.categories}
        currentCatId={currentCatId}
        lang={state.settings.lang}
        onClose={() => setIsNewDeckOpen(false)}
        onCreate={handleCreateDeck}
      />

      <GenerateModal
        isOpen={isGenerateCardsOpen}
        categories={state.categories}
        currentCatId={currentCatId}
        lang={state.settings.lang}
        onClose={() => setIsGenerateCardsOpen(false)}
        onOpenSettings={() => {
          setCurrentCatId(null);
          setCurrentTab('settings');
        }}
        onOpenNewCategory={() => setIsNewCategoryOpen(true)}
        onGenerated={handleGeneratedCards}
      />

      <SearchModal
        isOpen={isSearchOpen}
        categories={state.categories}
        lang={state.settings.lang}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(catId, tab) => {
          setCurrentCatId(catId);
          setCurrentTab(tab);
        }}
      />

      <StreakModal
        isOpen={isStreakModalOpen}
        sessionTimestamps={allSessions.map((s) => s.ts)}
        studiedDates={state.studiedDates || []}
        lang={state.settings.lang}
        onClose={() => setIsStreakModalOpen(false)}
      />

      <WelcomeTourModal
        isOpen={isWelcomeTourOpen}
        currentLang={state.settings.lang}
        onSelectLang={(newLang) => handleUpdateSettings({ lang: newLang })}
        onFinish={() => {
          try {
            localStorage.setItem('studyflow_onboarded', 'true');
          } catch {}
          setIsWelcomeTourOpen(false);
        }}
      />

      <CustomizeDashboardModal
        isOpen={isCustomizeOpen}
        dashboardWidgets={state.settings.dashboard}
        lang={state.settings.lang}
        onClose={() => setIsCustomizeOpen(false)}
        onUpdateWidgets={(updated) => handleUpdateSettings({ dashboard: updated })}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        profile={state.profile}
        lang={state.settings.lang}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={(updated) => setState((prev) => ({ ...prev, profile: updated }))}
      />

      <SessionEndModal
        isOpen={isSessionEndModalOpen}
        categories={state.categories}
        currentCatId={currentCatId}
        durationMinutes={completedSessionDuration}
        lang={state.settings.lang}
        onSaveSession={handleSaveCompletedSession}
        onDismiss={() => setIsSessionEndModalOpen(false)}
      />
    </div>
  );
}
