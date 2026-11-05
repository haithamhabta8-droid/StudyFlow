import { AppState, WidgetConfig } from '../types/index.ts';

export const STORE_KEY = 'studyFlow_v14';

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'pomodoro', size: 'half', visible: true },
  { id: 'stats', size: 'half', visible: true },
  { id: 'aiUsage', size: 'third', visible: true },
  { id: 'goals', size: 'third', visible: true },
  { id: 'streak', size: 'third', visible: true },
  { id: 'activity', size: 'two-thirds', visible: true },
  { id: 'sessionsToday', size: 'third', visible: true },
  { id: 'exams', size: 'half', visible: true },
  { id: 'tasks', size: 'half', visible: true },
  { id: 'grades', size: 'half', visible: true },
  { id: 'quizAvg', size: 'half', visible: true },
  { id: 'actions', size: 'full', visible: true },
];

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
      provider: 'groq',
      apiKey: '',
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      goalDaily: 60,
      goalWeekly: 420,
      lang: 'en',
      theme: 'black',
      primaryColor: '#22c55e',
      dashboard: JSON.parse(JSON.stringify(DEFAULT_WIDGETS)),
      showCompletedTasks: false,
      sidebarCollapsed: false,
      aiUsageToday: 0,
      aiTokensToday: 0,
      models: [
        {
          id: 'm-1',
          name: 'Llama 4 Scout (صور)',
          provider: 'groq',
          modelId: 'meta-llama/llama-4-scout-17b-16e-instruct',
          callsToday: 0,
          maxCallsDaily: 1000,
          active: true,
        },
        {
          id: 'm-2',
          name: 'Gemini 2.5 Flash',
          provider: 'gemini',
          modelId: 'gemini-2.5-flash',
          callsToday: 0,
          maxCallsDaily: 1500,
          active: false,
        },
      ],
      activeModelId: 'm-1',
    },
    breakHistory: [],
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem('studyFlow_v13');
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = getDefaultState();

      return {
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
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

export function exportAppState(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `StudyFlow_Backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
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
    };
    saveAppState(validated);
    return validated;
  } catch (e) {
    console.error('Failed to import JSON state:', e);
    return null;
  }
}
