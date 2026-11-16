import { AppState, WidgetConfig } from '../types/index.ts';

export const STORE_KEY = 'studyFlow_v14';

export const CURRENT_LAYOUT_PRESET_VERSION = 2;

// 3-Tier Asymmetric Bento Layout (sums to 12 cols per desktop row: 8+4, 4+4+4, 4+4+4, 3+3+3+3)
export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'pomodoro', size: 'two-thirds', visible: true },
  { id: 'tasks', size: 'third', visible: true },
  { id: 'goals', size: 'third', visible: true },
  { id: 'sessions', size: 'third', visible: true },
  { id: 'weeklyActivity', size: 'third', visible: true },
  { id: 'actions', size: 'third', visible: true },
  { id: 'streak', size: 'third', visible: true },
  { id: 'exams', size: 'third', visible: true },
  { id: 'stats', size: 'quarter', visible: true },
  { id: 'grades', size: 'quarter', visible: true },
  { id: 'quizzes', size: 'quarter', visible: true },
  { id: 'aiUsage', size: 'quarter', visible: true },
];

export const DASHBOARD_PRESETS: Record<'bento' | 'classic' | 'compact' | 'fourColumn', WidgetConfig[]> = {
  bento: DEFAULT_WIDGETS,
  classic: [
    { id: 'pomodoro', size: 'half', visible: true },
    { id: 'sessions', size: 'half', visible: true },
    { id: 'goals', size: 'half', visible: true },
    { id: 'tasks', size: 'half', visible: true },
    { id: 'stats', size: 'half', visible: true },
    { id: 'aiUsage', size: 'half', visible: true },
    { id: 'actions', size: 'half', visible: true },
    { id: 'streak', size: 'half', visible: true },
    { id: 'grades', size: 'half', visible: true },
    { id: 'exams', size: 'half', visible: true },
    { id: 'weeklyActivity', size: 'half', visible: true },
    { id: 'quizzes', size: 'half', visible: true },
  ],
  compact: DEFAULT_WIDGETS.map((w) => ({ ...w, size: 'third' as const })),
  fourColumn: DEFAULT_WIDGETS.map((w) => ({ ...w, size: 'quarter' as const })),
};

export const PRIMARY_COLORS = [
  '#7c5cfc', // Violet
  '#6366f1', // Indigo
  '#8b5cf6', // Light Violet
  '#a855f7', // Purple
  '#d946ef', // Magenta
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber / Gold
  '#84cc16', // Lime
  '#22c55e', // Green
  '#065f46', // Dark Green
  '#15803d', // Forest Green
  '#10b981', // Mint Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky Blue
  '#3b82f6', // Electric Blue
  '#64748b', // Slate Gray
];

export function getSystemPreferredTheme(): 'light' | 'dark' | 'black' {
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
  } catch {}
  return 'dark';
}

export function getDefaultState(): AppState {
  return {
    categories: [],
    pinned: [],
    profile: {
      name: '',
      email: '',
      avatar: '',
      bio: '',
      level: 'university',
      signedIn: false,
    },
    settings: {
      provider: 'gemini',
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: 'gemini-4-hydrogen',
      goalDaily: 60,
      goalWeekly: 420,
      lang: 'en',
      theme: 'black',
      primaryColor: '#15803D',
      dashboard: JSON.parse(JSON.stringify(DEFAULT_WIDGETS)),
      showCompletedTasks: false,
      sidebarCollapsed: false,
      aiUsageToday: 0,
      aiTokensToday: 0,
      models: [
        {
          id: 'm-1',
          name: 'Gemini 4 Hydrogen',
          provider: 'gemini',
          modelId: 'gemini-4-hydrogen',
          callsToday: 0,
          maxCallsDaily: 20,
          active: true,
        },
        {
          id: 'm-2',
          name: 'Gemini 4 Carbon',
          provider: 'gemini',
          modelId: 'gemini-4-carbon',
          callsToday: 0,
          maxCallsDaily: 20,
          active: false,
        },
        {
          id: 'm-3',
          name: 'Gemini 4 Argon',
          provider: 'gemini',
          modelId: 'gemini-4-argon',
          callsToday: 0,
          maxCallsDaily: 20,
          active: false,
        },
        {
          id: 'm-4',
          name: 'Gemini 3.5 Flash Lite',
          provider: 'gemini',
          modelId: 'gemini-3.5-flash-lite',
          callsToday: 0,
          maxCallsDaily: 20,
          active: false,
        },
      ],
      activeModelId: 'm-1',
      uniformWidgetsMigrated: true,
      layoutPresetVersion: CURRENT_LAYOUT_PRESET_VERSION,
      aiModelV4Migrated: true,
    },
    breakHistory: [],
    lifetimeFocusSeconds: 0,
  };
}

export function setStorageCookie(name: string, value: string, days = 365): void {
  try {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('Failed to set cookie:', e);
  }
}

export function getStorageCookie(name: string): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

export function loadAppState(): AppState {
  try {
    const todayKey = new Date().toISOString().slice(0, 10);
    let raw = localStorage.getItem(STORE_KEY) || localStorage.getItem('studyFlow_v13');
    
    // If localStorage was cleared, attempt recovery from cookies
    if (!raw) {
      const cookieData = getStorageCookie('studyflow_meta');
      if (cookieData) {
        try {
          const cookieParsed = JSON.parse(cookieData);
          const def = getDefaultState();
          return {
            ...def,
            profile: { ...def.profile, ...(cookieParsed.profile || {}) },
            settings: {
              ...def.settings,
              theme: cookieParsed.theme || def.settings.theme,
              lang: cookieParsed.lang || def.settings.lang,
              primaryColor: cookieParsed.primaryColor || def.settings.primaryColor,
              aiUsageDate: todayKey,
              aiUsageToday: 0,
            },
          };
        } catch {
          // fallback to default
        }
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      const def = getDefaultState();

      const loadedSettings = {
        ...def.settings,
        ...(parsed.settings || {}),
        dashboard: (Array.isArray(parsed.settings?.dashboard)
          ? parsed.settings.dashboard
          : def.settings.dashboard
        ).map((w: any) => {
          let id = w.id;
          if (id === 'activity') id = 'weeklyActivity';
          if (id === 'sessionsToday') id = 'sessions';
          if (id === 'quizAvg') id = 'quizzes';
          return { ...w, id };
        }),
      };

      // Always upgrade deprecated model strings to gemini-4-hydrogen
      if (
        !loadedSettings.model ||
        loadedSettings.model.includes('2.5') ||
        loadedSettings.model.includes('1.5') ||
        loadedSettings.model.includes('2.0') ||
        loadedSettings.model.includes('groq') ||
        loadedSettings.model.includes('llama') ||
        (!loadedSettings.aiModelV4Migrated && loadedSettings.model === 'gemini-3.8-flash')
      ) {
        loadedSettings.model = 'gemini-4-hydrogen';
        loadedSettings.provider = 'gemini';
      }
      loadedSettings.aiModelV4Migrated = true;

      // Migrate old purple default to forest green
      if (!loadedSettings.primaryColor || loadedSettings.primaryColor === '#7c5cfc') {
        loadedSettings.primaryColor = '#15803D';
      }

      // One-time migration to the 3-tier asymmetric Bento layout while preserving visibility toggles
      if (loadedSettings.layoutPresetVersion !== CURRENT_LAYOUT_PRESET_VERSION) {
        const visibilityMap = new Map<string, boolean>(
          (loadedSettings.dashboard || []).map((w: any) => [w.id, w.visible !== false])
        );
        loadedSettings.dashboard = DEFAULT_WIDGETS.map((w) => ({
          ...w,
          visible: visibilityMap.has(w.id) ? Boolean(visibilityMap.get(w.id)) : w.visible,
        }));
        loadedSettings.layoutPresetVersion = CURRENT_LAYOUT_PRESET_VERSION;
        loadedSettings.uniformWidgetsMigrated = true;
      }

      // Automatically reset daily AI usage if day has passed
      if (loadedSettings.aiUsageDate !== todayKey) {
        loadedSettings.aiUsageToday = 0;
        loadedSettings.aiUsageDate = todayKey;
      }

      const loadedCategories = Array.isArray(parsed.categories) ? parsed.categories : [];
      const legacySessionSeconds = loadedCategories.reduce(
        (sum: number, c: any) =>
          sum +
          (Array.isArray(c.sessions)
            ? c.sessions.reduce((sAcc: number, s: any) => sAcc + (s.minutes || 0) * 60, 0)
            : 0),
        0
      );

      return {
        categories: loadedCategories,
        pinned: Array.isArray(parsed.pinned) ? parsed.pinned : [],
        profile: { ...def.profile, ...(parsed.profile || {}) },
        settings: loadedSettings,
        breakHistory: Array.isArray(parsed.breakHistory) ? parsed.breakHistory : [],
        calendarEvents: Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : [],
        studiedDates: Array.isArray(parsed.studiedDates) ? parsed.studiedDates : [],
        lifetimeFocusSeconds:
          typeof parsed.lifetimeFocusSeconds === 'number'
            ? parsed.lifetimeFocusSeconds
            : legacySessionSeconds,
      };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }
  return getDefaultState();
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));

    // Dual persistence: sync core preferences to cookie as well
    const metaToCookie = {
      theme: state.settings.theme,
      lang: state.settings.lang,
      primaryColor: state.settings.primaryColor,
      profile: {
        name: state.profile?.name,
        email: state.profile?.email,
        signedIn: state.profile?.signedIn,
      },
      aiUsageToday: state.settings.aiUsageToday,
      aiUsageDate: state.settings.aiUsageDate,
      categoriesCount: state.categories.length,
      updatedAt: Date.now(),
    };
    setStorageCookie('studyflow_meta', JSON.stringify(metaToCookie), 365);
  } catch (e) {
    console.error('Failed to save state to localStorage / cookie:', e);
  }
}

export function clearAllLocalStorageAndCookies(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  } catch (e) {
    console.warn('Failed to clear sessionStorage:', e);
  }

  try {
    if (typeof document !== 'undefined') {
      const cookieNames = new Set<string>(['studyflow_meta']);
      if (document.cookie) {
        for (const rawCookie of document.cookie.split(';')) {
          const eqIdx = rawCookie.indexOf('=');
          const name = (eqIdx >= 0 ? rawCookie.slice(0, eqIdx) : rawCookie).trim();
          if (name) cookieNames.add(name);
        }
      }
      const pathname = typeof window !== 'undefined' && window.location ? window.location.pathname : '/';
      for (const name of cookieNames) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        if (pathname && pathname !== '/') {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${pathname}`;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to clear cookies:', e);
  }

  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      window.caches.delete('studyflow-offline-v1').catch(() => null);
    }
  } catch {
    // ignore cache cleanup failures
  }
}

export function exportAppState(state: AppState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `StudyFlow_Backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function importAppState(jsonStr: string): AppState | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') return null;
    const def = getDefaultState();
    const validated: AppState = {
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      pinned: Array.isArray(parsed.pinned) ? parsed.pinned : [],
      profile: { ...def.profile, ...(parsed.profile || {}) },
      settings: {
        ...def.settings,
        ...(parsed.settings || {}),
        dashboard: Array.isArray(parsed.settings?.dashboard)
          ? parsed.settings.dashboard
          : def.settings.dashboard,
      },
      breakHistory: Array.isArray(parsed.breakHistory) ? parsed.breakHistory : [],
      calendarEvents: Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : [],
      studiedDates: Array.isArray(parsed.studiedDates) ? parsed.studiedDates : [],
      lastCalendarSync:
        typeof parsed.lastCalendarSync === 'number' ? parsed.lastCalendarSync : undefined,
      lifetimeFocusSeconds:
        typeof parsed.lifetimeFocusSeconds === 'number' ? parsed.lifetimeFocusSeconds : 0,
    };
    saveAppState(validated);
    return validated;
  } catch (e) {
    console.error('Failed to import JSON state:', e);
    return null;
  }
}
