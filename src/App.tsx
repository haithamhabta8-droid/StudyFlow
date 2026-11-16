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
import { InitialGoogleConnectModal } from './components/modals/InitialGoogleConnectModal.tsx';
import { TermsModal } from './components/modals/TermsModal.tsx';
import { CookieConsentModal } from './components/modals/CookieConsentModal.tsx';
import { Footer } from './components/Footer.tsx';

import { AppState, Category, Card, PomodoroSession } from './types/index.ts';
import {
  loadAppState,
  saveAppState,
  getDefaultState,
  importAppState,
  clearAllLocalStorageAndCookies,
} from './utils/storage.ts';
import {
  uploadBackupToDrive,
  restoreBackupFromDrive,
  getStoredAccessToken,
  requestGoogleAccessToken,
  fetchGoogleUserProfile,
} from './utils/googleDrive.ts';
import { calculateStreak, calculateCardStats, getQualifiedStreakDates } from './utils/calculations.ts';
import { playChime } from './utils/audio.ts';
import { t } from './utils/translations.ts';
import { applyAdaptiveUserFont } from './utils/font.ts';
import { User, Award, Layers, Clock } from 'lucide-react';

// URL Hash routing parser
function parseHashRoute(): { tab: string; catId: string | null } {
  try {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/category/')) {
      const parts = hash.replace('#/category/', '').split('/');
      const catId = parts[0] || null;
      const tab = parts[1] || 'overview';
      return { tab, catId };
    }
    if (hash.startsWith('#/')) {
      const tab = hash.slice(2);
      if (['timeline', 'profile', 'settings', 'askai', 'home'].includes(tab)) {
        return { tab, catId: null };
      }
    }
  } catch (e) {
    console.warn('Hash parse error:', e);
  }
  return { tab: 'home', catId: null };
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());

  // Navigation with URL Hash synchronization
  const initialRoute = parseHashRoute();
  const [currentCatId, setCurrentCatId] = useState<string | null>(initialRoute.catId);
  const [currentTab, setCurrentTab] = useState<string>(initialRoute.tab);
  const [returnActionAfterCategory, setReturnActionAfterCategory] = useState<'generate' | 'deck' | null>(null);

  const navigateTo = (tab: string, catId: string | null = null) => {
    setCurrentTab(tab);
    setCurrentCatId(catId);
    const targetHash = catId ? `#/category/${catId}/${tab}` : `#/${tab}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ tab, catId }, '', targetHash);
    }
  };

  // Synchronize browser history (back/forward navigation & mobile back gestures)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseHashRoute();
      setCurrentTab(route.tab);
      setCurrentCatId(route.catId);
    };

    if (!window.location.hash) {
      window.history.replaceState({ tab: 'home', catId: null }, '', '#/home');
    }

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

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
  const pendingCompletedSessionIdRef = useRef<string | null>(null);

  // Google Initial Onboarding Modal State
  const [isInitialGoogleOpen, setIsInitialGoogleOpen] = useState(() => {
    try {
      const prompted = localStorage.getItem('studyflow_google_prompted') === 'true';
      return !prompted && !state.profile?.signedIn;
    } catch {
      return false;
    }
  });

  // Terms and Privacy Modal State
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState<'terms' | 'privacy'>('terms');

  const handleOpenTerms = (tab: 'terms' | 'privacy') => {
    setTermsModalTab(tab);
    setIsTermsModalOpen(true);
  };

  // Cookie Consent Modal State
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(() => {
    try {
      return localStorage.getItem('studyflow_cookie_consent') === null;
    } catch {
      return false;
    }
  });

  const handleAcceptAllCookies = () => {
    try {
      localStorage.setItem('studyflow_cookie_consent', 'all');
    } catch {}
    setIsCookieModalOpen(false);
  };

  const handleAcceptNecessaryCookies = () => {
    try {
      localStorage.setItem('studyflow_cookie_consent', 'necessary');
    } catch {}
    setIsCookieModalOpen(false);
  };

  // Starting Welcome Tour State
  const [isWelcomeTourOpen, setIsWelcomeTourOpen] = useState(() => {
    try {
      const prompted = localStorage.getItem('studyflow_google_prompted') === 'true';
      const onboarded = localStorage.getItem('studyflow_onboarded') === 'true';
      return prompted && !onboarded;
    } catch {
      return false;
    }
  });

  // Midnight AI Usage Auto-Reset
  useEffect(() => {
    const checkDailyReset = () => {
      const todayKey = new Date().toISOString().slice(0, 10);
      setState((prev) => {
        if (prev.settings.aiUsageDate !== todayKey) {
          return {
            ...prev,
            settings: {
              ...prev.settings,
              aiUsageToday: 0,
              aiUsageDate: todayKey,
            },
          };
        }
        return prev;
      });
    };

    checkDailyReset();
    const interval = setInterval(checkDailyReset, 30000); // Check every 30s
    const handleVisChange = () => {
      if (document.visibilityState === 'visible') {
        checkDailyReset();
      }
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisChange);
    };
  }, []);

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
  const skipNextSaveRef = useRef(false);
  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current);
        autoSyncTimerRef.current = null;
      }
      return;
    }

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

  // Periodic 5-minute auto-backup to Google Drive appDataFolder
  useEffect(() => {
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const interval = setInterval(async () => {
      if (state.profile?.signedIn) {
        const token = getStoredAccessToken();
        if (token) {
          try {
            await uploadBackupToDrive(token, state);
          } catch (e) {
            console.warn('5-minute periodic auto-backup to Google Drive failed:', e);
          }
        }
      }
    }, FIVE_MINUTES_MS);
    return () => clearInterval(interval);
  }, [state.profile?.signedIn, state]);

  // Handle Replaying Tutorial: navigate back to Home, expand sidebar, and start tour
  const handleReplayTutorial = () => {
    setCurrentCatId(null);
    setCurrentTab('home');
    setIsCollapsedDesktop(false);
    setIsWelcomeTourOpen(true);
  };

  // Sync theme, direction, and primary accent color
  useEffect(() => {
    const theme = state.settings.theme || 'black';
    document.documentElement.classList.remove('dark', 'light', 'black');
    document.documentElement.classList.add(theme);

    const isRTL = state.settings.lang === 'ar';
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', state.settings.lang);
    applyAdaptiveUserFont();

    const primary = state.settings.primaryColor || '#15803D';
    document.documentElement.style.setProperty('--primary', primary);
    const r = parseInt(primary.slice(1, 3), 16) || 21;
    const g = parseInt(primary.slice(3, 5), 16) || 128;
    const b = parseInt(primary.slice(5, 7), 16) || 61;
    document.documentElement.style.setProperty(
      '--primary-glow',
      `rgba(${r}, ${g}, ${b}, 0.28)`
    );
  }, [state.settings.theme, state.settings.lang, state.settings.primaryColor]);

  // Pomodoro Interval Loop (pure 1-second tick)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPomoRunning) {
      timer = setInterval(() => {
        setPomoTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPomoRunning]);

  // Exact 1:1 lifetime focus timer sync: adds +1 second for each elapsed focus second
  const prevPomoTimeLeftRef = useRef(pomoTimeLeft);
  useEffect(() => {
    const prev = prevPomoTimeLeftRef.current;
    prevPomoTimeLeftRef.current = pomoTimeLeft;
    if (
      isPomoRunning &&
      pomoMode === 'focus' &&
      prev > pomoTimeLeft &&
      prev - pomoTimeLeft === 1
    ) {
      setState((s) => ({
        ...s,
        lifetimeFocusSeconds: (s.lifetimeFocusSeconds || 0) + 1,
      }));
    }
  }, [pomoTimeLeft, isPomoRunning, pomoMode]);

  // Pomodoro Session Completion Trigger (handles completion cleanly outside interval tick)
  useEffect(() => {
    if (isPomoRunning && pomoTimeLeft === 0) {
      playChime();
      setIsPomoRunning(false);
      if (pomoMode === 'focus') {
        const finishedMins = Math.max(1, Math.round(pomoTotalDuration / 60));
        const sessionId = Math.random().toString(36).slice(2, 9);
        pendingCompletedSessionIdRef.current = sessionId;

        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const autoSession: PomodoroSession = {
          id: sessionId,
          minutes: finishedMins,
          ts: now.getTime(),
        };

        // Immediately commit completed focus session so Daily Goal & Today's Sessions never reset
        setState((prev) => {
          const cats = [...prev.categories];
          const targetIdx = currentCatId
            ? cats.findIndex((c) => c.id === currentCatId)
            : 0;
          if (cats.length > 0) {
            const idx = targetIdx >= 0 ? targetIdx : 0;
            cats[idx] = {
              ...cats[idx],
              sessions: [autoSession, ...(cats[idx].sessions || [])],
            };
          } else {
            cats.push({
              id: 'cat-general',
              name: 'عام',
              nameEn: 'General',
              subject: 'General Study',
              color: '#10b981',
              decks: [],
              sessions: [autoSession],
              tasks: [],
              exams: [],
              grades: [],
              quizzes: [],
              notes: [],
              log: [],
            });
          }
          return {
            ...prev,
            categories: cats,
          };
        });

        setCompletedSessionDuration(finishedMins);
        setIsSessionEndModalOpen(true);
        setPomoMode('break');
        setPomoTotalDuration(5 * 60);
        setPomoTimeLeft(5 * 60);
      } else {
        setPomoBreaksCount((b) => b + 1);
        setPomoMode('focus');
        const defaultFocus = (state.settings.pomoWorkMinutes || 25) * 60;
        setPomoTotalDuration(defaultFocus);
        setPomoTimeLeft(defaultFocus);
      }
    }
  }, [pomoTimeLeft, isPomoRunning, pomoMode, pomoTotalDuration, state.settings.pomoWorkMinutes, currentCatId]);

  // Save any elapsed focus session so Study Goals Progress and streak never reset
  const saveElapsedFocusSession = () => {
    if (pomoMode === 'focus' && pomoTotalDuration > pomoTimeLeft) {
      const elapsedSeconds = pomoTotalDuration - pomoTimeLeft;
      if (elapsedSeconds >= 1) {
        const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setState((prev) => {
          const cats = [...prev.categories];
          const newSession: PomodoroSession = {
            id: Math.random().toString(36).slice(2, 9),
            minutes: elapsedMinutes,
            ts: now.getTime(),
          };
          if (cats.length > 0) {
            cats[0] = {
              ...cats[0],
              sessions: [...(cats[0].sessions || []), newSession],
            };
          } else {
            cats.push({
              id: 'cat-general',
              name: 'عام',
              nameEn: 'General',
              subject: 'General Study',
              color: '#10b981',
              decks: [],
              sessions: [newSession],
              tasks: [],
              exams: [],
              grades: [],
              quizzes: [],
              notes: [],
              log: [],
            });
          }
          return {
            ...prev,
            categories: cats,
          };
        });
      }
    }
  };

  const activeFocusSecondsToday =
    pomoMode === 'focus' && pomoTotalDuration > pomoTimeLeft
      ? pomoTotalDuration - pomoTimeLeft
      : 0;

  // Real-time daily goal completion check -> sync studiedDates strictly when daily goal is cleared
  useEffect(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const goalDaily = Math.max(1, state.settings.goalDaily || 60);
    const allSessions = state.categories.flatMap((c) => c.sessions || []);
    const completedTodayMinutes = allSessions
      .filter((s) => {
        const d = new Date(s.ts);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return k === todayKey;
      })
      .reduce((acc, s) => acc + (s.minutes || 0), 0);
    const totalTodaySeconds = completedTodayMinutes * 60 + activeFocusSecondsToday;
    const goalDailySeconds = goalDaily * 60;
    const goalClearedToday = totalTodaySeconds >= goalDailySeconds;

    setState((prev) => {
      const dates = prev.studiedDates || [];
      const hasToday = dates.includes(todayKey);
      if (goalClearedToday && !hasToday) {
        return {
          ...prev,
          studiedDates: [...dates, todayKey],
        };
      }
      if (!goalClearedToday && hasToday) {
        return {
          ...prev,
          studiedDates: dates.filter((d) => d !== todayKey),
        };
      }
      return prev;
    });
  }, [
    activeFocusSecondsToday,
    state.settings.goalDaily,
    state.categories,
  ]);

  // Current category object
  const currentCategory = state.categories.find((c) => c.id === currentCatId) || null;

  // Streak info computed strictly from days that cleared the daily study goal
  const allSessions = state.categories.flatMap((c) => c.sessions || []);
  const qualifiedStreakDates = getQualifiedStreakDates(
    allSessions,
    state.settings.goalDaily || 60,
    activeFocusSecondsToday
  );
  const streakInfo = calculateStreak([], qualifiedStreakDates);

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

    // If the user came from a modal warning (e.g. Generate with AI or New Deck), reopen it
    if (returnActionAfterCategory === 'generate') {
      setIsGenerateCardsOpen(true);
      setReturnActionAfterCategory(null);
    } else if (returnActionAfterCategory === 'deck') {
      setIsNewDeckOpen(true);
      setReturnActionAfterCategory(null);
    } else {
      navigateTo('overview', newCat.id);
    }
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
    navigateTo('cards', categoryId);
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

  // Session Logging (updates auto-saved session with note, target category, or quiz)
  const handleSaveCompletedSession = (
    categoryId: string,
    note: string,
    shouldGenerateQuiz: boolean
  ) => {
    const pendingId = pendingCompletedSessionIdRef.current;
    pendingCompletedSessionIdRef.current = null;

    const now = new Date();

    setState((prev) => {

      let existingSession: PomodoroSession | null = null;
      let cats = prev.categories.map((c) => {
        if (pendingId && (c.sessions || []).some((s) => s.id === pendingId)) {
          existingSession = (c.sessions || []).find((s) => s.id === pendingId) || null;
          return {
            ...c,
            sessions: (c.sessions || []).filter((s) => s.id !== pendingId),
          };
        }
        return c;
      });

      const sessionItem: PomodoroSession = existingSession
        ? { ...(existingSession as PomodoroSession), note: note || undefined }
        : {
            id: pendingId || Math.random().toString(36).slice(2, 9),
            minutes: completedSessionDuration,
            ts: now.getTime(),
            note: note || undefined,
          };

      if (cats.length === 0) {
        cats = [
          {
            id: 'cat-general',
            name: 'عام',
            nameEn: 'General',
            subject: 'General Study',
            color: '#10b981',
            decks: [],
            sessions: [],
            tasks: [],
            exams: [],
            grades: [],
            quizzes: [],
            notes: [],
            log: [],
          },
        ];
      }

      const targetId = categoryId || cats[0].id;
      const updatedCats = cats.map((c) => {
        if (c.id === targetId) {
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
      });

      return {
        ...prev,
        categories: updatedCats,
      };
    });

    setIsSessionEndModalOpen(false);
  };

  // Settings, Profile & Reset
  const handleUpdateSettings = (partial: Partial<AppState['settings']>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partial },
    }));
  };

  const handleUpdateProfile = (partial: Partial<AppState['profile']>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...partial },
    }));
  };

  const handleRestoreState = (restored: AppState) => {
    saveAppState(restored);
    setState(restored);
  };

  const handleConnectGoogleUnified = async () => {
    try {
      const token = await requestGoogleAccessToken();
      const profile = await fetchGoogleUserProfile(token);
      handleUpdateProfile({ ...profile, signedIn: true });

      // Automatically restore cloud backup from Google Drive upon login
      try {
        const restored = await restoreBackupFromDrive(token);
        if (restored && restored.categories) {
          handleRestoreState(restored);
        }
      } catch (restoreErr) {
        console.log('No prior backup found or restore skipped:', restoreErr);
      }
    } catch (e) {
      console.warn('Google connect error:', e);
    }
  };

  const handleResetAll = (options?: { preserveTab?: boolean; wipeAll?: boolean }) => {
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }

    if (options?.wipeAll) {
      skipNextSaveRef.current = true;
      clearAllLocalStorageAndCookies();
    } else {
      localStorage.removeItem('studyFlow_v14');
    }

    const fresh = getDefaultState();
    fresh.settings.aiUsageDate = new Date().toISOString().slice(0, 10);
    setState(fresh);

    if (!options?.preserveTab) {
      setCurrentCatId(null);
      setCurrentTab('home');
    }
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
    <div className="min-h-screen bg-[#0a0a1a] text-[#e8e8f0] flex flex-col antialiased animate-page-fade">
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
                onStartTutorial={handleReplayTutorial}
                onOpenTerms={handleOpenTerms}
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
                onEventCompleted={() => {}}
                onConnectGoogle={handleConnectGoogleUnified}
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
                onConnectGoogle={handleConnectGoogleUnified}
                onSelectCategory={(id) => {
                  setCurrentCatId(id);
                  setCurrentTab('overview');
                }}
              />
            ) : currentTab === 'askai' ? (
              <AskAIView
                category={currentCategory}
                lang={state.settings.lang}
                model={state.settings.model}
                thinkingLevel={state.settings.thinkingLevel}
                onChangeModel={(modelId) =>
                  handleUpdateSettings({
                    model: modelId,
                    thinkingLevel:
                      state.settings.thinkingLevel === 'XHIGH' && modelId !== 'gemini-4-hydrogen'
                        ? 'HIGH'
                        : state.settings.thinkingLevel,
                  })
                }
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
                  saveElapsedFocusSession();
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
                  saveElapsedFocusSession();
                  setIsPomoRunning(false);
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
                  model={state.settings.model}
                  thinkingLevel={state.settings.thinkingLevel}
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
                  model={state.settings.model}
                  thinkingLevel={state.settings.thinkingLevel}
                  onChangeModel={(modelId) =>
                    handleUpdateSettings({
                      model: modelId,
                      thinkingLevel:
                        state.settings.thinkingLevel === 'XHIGH' && modelId !== 'gemini-4-hydrogen'
                          ? 'HIGH'
                          : state.settings.thinkingLevel,
                    })
                  }
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

          {/* Persistent StudyFlow Footer with dynamic year, terms, and cookie settings */}
          <Footer
            lang={state.settings.lang}
            onOpenTerms={handleOpenTerms}
            onOpenCookies={() => setIsCookieModalOpen(true)}
          />
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
          saveElapsedFocusSession();
          setIsPomoRunning(false);
          const resetMins = state.settings.pomoWorkMinutes || 25;
          setPomoTimeLeft(resetMins * 60);
          setPomoTotalDuration(resetMins * 60);
          setPomoMode('focus');
        }}
        onSkip={() => {
          saveElapsedFocusSession();
          setIsPomoRunning(false);
          if (pomoMode === 'focus') {
            setPomoMode('break');
            setPomoTimeLeft(5 * 60);
            setPomoTotalDuration(5 * 60);
          } else {
            setPomoMode('focus');
            const focusMins = state.settings.pomoWorkMinutes || 25;
            setPomoTimeLeft(focusMins * 60);
            setPomoTotalDuration(focusMins * 60);
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
        model={state.settings.model}
        thinkingLevel={state.settings.thinkingLevel}
        onClose={() => setIsGenerateCardsOpen(false)}
        onOpenSettings={() => {
          setCurrentCatId(null);
          setCurrentTab('settings');
        }}
        onOpenNewCategory={() => {
          setReturnActionAfterCategory('generate');
          setIsNewCategoryOpen(true);
        }}
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
        sessionTimestamps={[]}
        studiedDates={qualifiedStreakDates}
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

      {/* Initial Google Connect Pop-up (Shows before tour on first visit) */}
      <InitialGoogleConnectModal
        isOpen={isInitialGoogleOpen}
        lang={state.settings.lang}
        onConnectGoogle={async () => {
          try {
            await handleConnectGoogleUnified();
          } catch (e) {
            console.warn('Initial Google Connect error:', e);
          } finally {
            try {
              localStorage.setItem('studyflow_google_prompted', 'true');
            } catch {}
            setIsInitialGoogleOpen(false);
            if (localStorage.getItem('studyflow_onboarded') !== 'true') {
              setIsWelcomeTourOpen(true);
            }
          }
        }}
        onSkip={() => {
          try {
            localStorage.setItem('studyflow_google_prompted', 'true');
          } catch {}
          setIsInitialGoogleOpen(false);
          if (localStorage.getItem('studyflow_onboarded') !== 'true') {
            setIsWelcomeTourOpen(true);
          }
        }}
        onOpenTerms={handleOpenTerms}
      />

      {/* Comprehensive In-App Terms of Service & Privacy Policy Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        initialTab={termsModalTab}
        lang={state.settings.lang}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* GDPR / Privacy Cookie Consent Settings Modal */}
      <CookieConsentModal
        isOpen={isCookieModalOpen}
        lang={state.settings.lang}
        onAcceptAll={handleAcceptAllCookies}
        onAcceptNecessary={handleAcceptNecessaryCookies}
        onOpenPrivacy={() => handleOpenTerms('privacy')}
        onClose={() => setIsCookieModalOpen(false)}
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
        onDismiss={() => {
          pendingCompletedSessionIdRef.current = null;
          setIsSessionEndModalOpen(false);
        }}
      />
    </div>
  );
}
