import { CardStatus, Category, Grade } from '../types/index.ts';

/**
 * Format total seconds to MM:SS
 */
export function formatTimer(totalSeconds: number): string {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calculate weighted GPA and letter grade from assessments
 */
export function calculateWeightedGPA(grades: Grade[]): {
  gpa: number;
  totalWeight: number;
  letter: string;
} {
  if (!grades || grades.length === 0) {
    return { gpa: 0, totalWeight: 0, letter: '-' };
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const g of grades) {
    if (g.maxScore > 0 && g.weight > 0) {
      const percentage = (g.score / g.maxScore) * 100;
      totalWeightedScore += (percentage * g.weight);
      totalWeight += g.weight;
    }
  }

  if (totalWeight === 0) {
    return { gpa: 0, totalWeight: 0, letter: '-' };
  }

  const gpa = Math.round((totalWeightedScore / totalWeight) * 10) / 10;

  let letter = 'F';
  if (gpa >= 90) letter = 'A+';
  else if (gpa >= 85) letter = 'A';
  else if (gpa >= 80) letter = 'B+';
  else if (gpa >= 75) letter = 'B';
  else if (gpa >= 70) letter = 'C+';
  else if (gpa >= 65) letter = 'C';
  else if (gpa >= 60) letter = 'D';

  return { gpa, totalWeight, letter };
}

/**
 * Calculate study streak from timestamps
 */
export function calculateStreak(sessionTimestamps: number[]): {
  currentStreak: number;
  bestStreak: number;
  activeToday: boolean;
  uniqueDays: string[];
} {
  if (!sessionTimestamps || sessionTimestamps.length === 0) {
    return { currentStreak: 0, bestStreak: 0, activeToday: false, uniqueDays: [] };
  }

  const dateSet = new Set<string>();
  for (const ts of sessionTimestamps) {
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateSet.add(key);
  }

  const sortedDays = Array.from(dateSet).sort();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const activeToday = dateSet.has(todayKey);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = activeToday ? today : (dateSet.has(yesterdayKey) ? yesterday : null);

  if (checkDate) {
    const cur = new Date(checkDate.getTime());
    while (true) {
      const k = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      if (dateSet.has(k)) {
        currentStreak++;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dayStr of sortedDays) {
    const [y, m, d] = dayStr.split('-').map(Number);
    const curDate = new Date(y, m - 1, d);

    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    prevDate = curDate;
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
  }

  return {
    currentStreak,
    bestStreak,
    activeToday,
    uniqueDays: sortedDays,
  };
}

/**
 * Calculate weekly minutes per day
 */
export function calculateWeeklyActivity(
  sessions: { ts: number; minutes: number }[],
  locale: 'ar' | 'en' = 'ar'
): { dayLabel: string; minutes: number; isToday: boolean; dateKey: string }[] {
  const arabicDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const englishDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const result: { dayLabel: string; minutes: number; isToday: boolean; dateKey: string }[] = [];

  if (locale === 'ar') {
    // Week starts Saturday (day 6)
    // Offset from Saturday: (currentDayOfWeek + 1) % 7
    const offsetFromSat = (currentDayOfWeek + 1) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - offsetFromSat);
    startOfWeek.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const k = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
      
      const dayMinutes = (sessions || [])
        .filter(s => {
          const sd = new Date(s.ts);
          const sk = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')}`;
          return sk === k;
        })
        .reduce((sum, s) => sum + (s.minutes || 0), 0);

      result.push({
        dayLabel: arabicDays[i],
        minutes: dayMinutes,
        isToday: k === todayKey,
        dateKey: k,
      });
    }
  } else {
    // Week starts Sunday (day 0)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const k = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;

      const dayMinutes = (sessions || [])
        .filter(s => {
          const sd = new Date(s.ts);
          const sk = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')}`;
          return sk === k;
        })
        .reduce((sum, s) => sum + (s.minutes || 0), 0);

      result.push({
        dayLabel: englishDays[i],
        minutes: dayMinutes,
        isToday: k === todayKey,
        dateKey: k,
      });
    }
  }

  return result;
}

/**
 * Calculate card statistics across categories or single category
 */
export function calculateCardStats(categories: Category[]): {
  total: number;
  mastered: number;
  learning: number;
  fresh: number;
  masteryPct: number;
} {
  let total = 0;
  let mastered = 0;
  let learning = 0;
  let fresh = 0;

  for (const c of categories || []) {
    for (const d of c.decks || []) {
      for (const card of d.cards || []) {
        total++;
        if (card.status === 'mastered') mastered++;
        else if (card.status === 'learning') learning++;
        else fresh++;
      }
    }
  }

  const masteryPct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  return { total, mastered, learning, fresh, masteryPct };
}

/**
 * Days remaining until exam date (YYYY-MM-DD)
 */
export function daysUntil(dateStr?: string): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Transition card status based on answer knowledge
 */
export function getNextCardStatus(current: CardStatus, knew: boolean): CardStatus {
  if (knew) {
    if (current === 'new') return 'learning';
    return 'mastered';
  } else {
    return 'learning';
  }
}
