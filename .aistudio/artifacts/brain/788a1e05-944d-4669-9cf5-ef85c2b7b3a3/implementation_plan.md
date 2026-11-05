# StudyFlow Enhanced Experience & Google Calendar Integration Plan

A comprehensive enhancement plan to introduce interactive widget customization, editable Pomodoro timer, Google Calendar timeline integration with time-gated completions, bulletproof AI card generation, robust Google Drive auto-sync, and a soothing, eye-friendly aesthetic.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Choices from Clarification Step:**
> - **Pomodoro Timer Interaction**: Clicking the timer will toggle an inline time editor featuring direct numeric input and quick preset buttons (**15, 25, 45, and 60 minutes**).
> - **Visual Style & Home Interface**: A soft, modern aesthetic featuring warm, soothing background tones, gentle borders, and soft layered shadows that reduce eye fatigue during long study sessions.
> - **Google Calendar Integration**: Request `https://www.googleapis.com/auth/calendar.readonly` alongside Drive scopes. Pre-fetch and cache a full month of events locally so that schedules remain fully visible even when offline.
> - **Widget Reordering**: Full drag-and-drop support on desktop (mouse) and mobile/tablet (touch gestures), with positions saved immediately to app state and synced to Google Drive.

---

## 1. Overview & Core Features

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             STUDYFLOW ECOSYSTEM                             │
│                                                                             │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │   DASHBOARD HOME      │  │  GOOGLE CALENDAR     │  │ GEMINI AI BYOK   │  │
│  │  - Draggable Widgets  │  │  - Timeline View     │  │ - 3.8-Flash Auto │  │
│  │  - Inline Pomo Edit   │  │  - Offline Month Sync│  │ - Category Alert │  │
│  │  - Live Online Badge  │  │  - Time-Gated Tasks  │  │ - Reliable Gen   │  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └─────────┬────────┘  │
│              │                         │                        │           │
│              ▼                         ▼                        ▼           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │               CONTINUOUS GOOGLE DRIVE AUTO-SYNC                       │  │
│  │  (Theme + Widgets + Pomodoro + Flashcards + Streak + Calendar Cache)  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Draggable & Touch-Friendly Dashboard Widgets**:
   - Each widget has an intuitive drag handle / corner grip.
   - Smooth reordering with mouse drag and touch gestures (via Pointer Events and touch-action css).
   - Saved directly to `state.settings.dashboard` order.

2. **Editable Pomodoro Timer**:
   - Clicking the timer digits ("25:00") or mode badge enters inline edit mode.
   - Quick preset buttons: **15 min**, **25 min**, **45 min**, **60 min**, plus a direct number input.
   - Updates active countdown, resets cleanly, and persists user default work minutes.

3. **Gemini AI 'Generate Cards' Fix & Category Guard**:
   - **Fix Generation**: Update model routing to enforce valid models (`gemini-3.8-flash` with candidate fallback), eliminating the deprecated `gemini-2.5-flash` blocker.
   - **Empty Category Guard**: When clicking "Generate with AI", if no categories exist yet, display an informative, friendly empty-state card with a direct "Create New Category" button.
   - **Auto-Select Active Category**: Pre-select the current category or first category cleanly so cards are never lost.

4. **Live Online / Offline Status Badge**:
   - Positioned in the header next to the statistics and customize controls.
   - Real-time network detection (`navigator.onLine`, `window.addEventListener('online'/'offline')`).
   - Displays a pulsing emerald `Online` pill or a warm amber `Offline` pill.

5. **Google Calendar Integration & Timeline View**:
   - Request `https://www.googleapis.com/auth/calendar.readonly` during Google Sign-In.
   - Fetch the active month's events using the Google Calendar API (`v3/calendars/primary/events`).
   - Cache events locally in `state.calendarEvents` so the entire monthly schedule remains visible offline.
   - Dedicated **Timeline View** with day/week navigation, hourly timeline, event cards, locations, and descriptions.

6. **Time-Gated Task Completion & Streak Progression**:
   - Calendar events feature a "Confirm Completion" button.
   - **Time-Gated**: Disabled/grayed out before the event's start time (`now < startTime`).
   - Becomes active once the event starts or concludes for the day.
   - Clicking completion records study progress, updates `state.streakInfo`, and marks the day as studied in the Study Calendar modal.

7. **Comprehensive Google Drive Auto-Sync**:
   - When a user is signed in to Google, any state modification (Pomodoro settings, widget layout, theme, categories, flashcards, grades, notes, streak, completed calendar tasks) triggers a debounced (1.5s) auto-upload to the hidden `appDataFolder`.
   - On signing in on any new device or refreshing, all settings and data are automatically restored.

8. **Soothing, Eye-Friendly Visual Polish**:
   - Soft, warm surface palettes in Light Mode (`#fafbfe` canvas, `#ffffff` cards with soft `#e8edf5` borders and gentle diffused shadows).
   - High text contrast and harmonious pastel badges for effortless readability during late-night and marathon study sessions.

---

## 2. Technical Architecture & File Modifications

### A. Data Schema Updates (`src/types/index.ts`)
```typescript
export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  startTime: number; // timestamp
  endTime: number;   // timestamp
  location?: string;
  completed?: boolean;
  completedAt?: number;
  source: 'google' | 'manual';
}

export interface AppState {
  // ... existing fields ...
  calendarEvents?: CalendarEventItem[];
  lastCalendarSync?: number;
}
```

### B. Google OAuth & Calendar Integration (`src/utils/googleDrive.ts` & `src/utils/googleCalendar.ts`)
- Add `https://www.googleapis.com/auth/calendar.readonly` to `DRIVE_SCOPES`.
- Create `fetchGoogleCalendarMonth(token, year, month)` to retrieve full month events.
- Cache results inside `state.calendarEvents`.

### C. Dashboard & Draggable Widgets (`src/components/Dashboard.tsx`)
- Implement pointer-based drag-and-drop:
  - Drag handle on widget header (`GripVertical`).
  - Pointer/touch move listeners tracking widget indices.
  - State update calling `onReorderWidgets(newOrder)`.
- Inline Pomodoro duration editor:
  - State `isEditingTimer: boolean` and `customMinutes: number`.
  - Presets: 15, 25, 45, 60 minutes.
  - Updates `pomoTotalDuration` and `pomoTimeLeft`.

### D. Generate AI Flashcards Fix (`src/components/modals/GenerateModal.tsx` & `src/utils/gemini.ts`)
- Validate category count: if 0, show guide with "Create Category" trigger.
- Enforce `gemini-3.8-flash` model key and candidate fallbacks.
- Add error boundary banner and loading animation.

### E. Online / Offline Indicator (`src/components/Header.tsx`)
- React hook `useOnlineStatus()` tracking `navigator.onLine`.
- Render subtle pill in header:
  - Online: `● Online` with emerald badge.
  - Offline: `○ Offline` with amber badge.

### F. Timeline View (`src/components/TimelineView.tsx`)
- Navigation tab in Header / Sidebar.
- Daily/weekly timeline grid with hour ticks (08:00 to 22:00).
- Time-gated completion button logic:
  ```typescript
  const isTimeGated = Date.now() < event.startTime;
  ```
- Completion increments streak and days studied.

### G. Streak & Calendar Modal (`src/components/modals/StreakModal.tsx`)
- Display month calendar grid with orange flame dots on completed days.
- Show active streak, longest streak, and total days studied.

---

## 3. Verification Plan

1. **Automated Unit Tests**:
   - Run `npx tsx --test src/utils/*.test.ts` to verify streak calculations, GPA, timer formatting, and Gemini API key tests.
2. **Build & Lint Verification**:
   - Run `lint_applet` (`tsc --noEmit`) and `compile_applet`.
   - Run production bundle build (`npm run build`).
3. **Interactive Validation**:
   - Test Pomodoro click -> inline preset selection (15m, 25m, 45m, 60m).
   - Test widget dragging with mouse and touch simulation.
   - Test Generate Modal with 0 categories (warning card) and with categories (creates flashcards via Gemini).
   - Test offline toggle in browser network tab (pill switches to Offline).
   - Test Google Sign-In with calendar scope and event completion time-gating.
