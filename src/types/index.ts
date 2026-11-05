export type CardStatus = 'new' | 'learning' | 'mastered';

export interface Card {
  id: string;
  q: string;
  a: string;
  qEn?: string;
  aEn?: string;
  status: CardStatus;
  reviews?: number;
  lastReviewed?: number;
}

export interface Deck {
  id: string;
  name: string;
  nameEn?: string;
  color?: string;
  cards: Card[];
  created: number;
  source?: string;
}

export interface Task {
  id: string;
  title: string;
  due?: string; // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high';
  done: boolean;
  created: number;
}

export interface Exam {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  created: number;
}

export interface Grade {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  weight: number; // percentage, e.g. 10
  created: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer?: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  score?: number; // percentage
  created: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface MindNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color?: string;
  parentId?: string;
}

export interface PomodoroSession {
  id: string;
  minutes: number;
  ts: number;
  note?: string;
  categoryTitle?: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  subject?: string;
  subjectEn?: string;
  color: string;
  decks: Deck[];
  tasks: Task[];
  exams: Exam[];
  grades: Grade[];
  quizzes: Quiz[];
  notes: Note[];
  mindNodes?: MindNode[];
  sessions: PomodoroSession[];
  log: number[]; // timestamps of card reviews
}

export type WidgetSize = 'quarter' | 'third' | 'half' | 'two-thirds' | 'full';

export interface WidgetConfig {
  id: string;
  size: WidgetSize;
  visible: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  bio: string;
  level: 'school' | 'highschool' | 'university' | 'grad' | 'self';
  googleId?: string;
  signedIn?: boolean;
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'gemini' | 'groq' | 'openai' | 'custom';
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
  callsToday?: number;
  maxCallsDaily?: number;
  active?: boolean;
}

export interface AppSettings {
  provider: 'groq' | 'openai' | 'gemini' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
  goalDaily: number; // in minutes (default 60)
  goalWeekly: number; // in minutes (default 420)
  lang: 'ar' | 'en';
  theme: 'dark' | 'light' | 'black';
  primaryColor: string; // hex
  dashboard: WidgetConfig[];
  showCompletedTasks: boolean;
  sidebarCollapsed: boolean;
  aiUsageToday: number; // count of calls
  aiTokensToday: number;
  models?: AIModelConfig[];
  activeModelId?: string;
  pomoWorkMinutes?: number;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  startTime: number; // timestamp in ms
  endTime: number;   // timestamp in ms
  location?: string;
  completed?: boolean;
  completedAt?: number;
  source: 'google' | 'manual';
  color?: string;
}

export interface AppState {
  categories: Category[];
  pinned: string[];
  profile: UserProfile;
  settings: AppSettings;
  breakHistory: number[];
  calendarEvents?: CalendarEventItem[];
  studiedDates?: string[]; // Array of YYYY-MM-DD
  lastCalendarSync?: number;
}
