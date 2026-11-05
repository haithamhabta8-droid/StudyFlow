import { CalendarEventItem } from '../types/index.ts';

/**
 * Fetches Google Calendar events for a given month and year
 * Caches full month so user can see their schedule offline
 */
export async function fetchGoogleCalendarEventsForMonth(
  accessToken: string,
  year: number,
  month: number // 0-indexed (0 = Jan, 11 = Dec)
): Promise<CalendarEventItem[]> {
  try {
    const startOfMonth = new Date(year, month, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const timeMin = startOfMonth.toISOString();
    const timeMax = endOfMonth.toISOString();

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '250');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Google authorization expired. Please sign in again.');
      }
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `Google Calendar error: ${res.status}`);
    }

    const data = await res.json();
    const items = data.items || [];

    const formattedEvents: CalendarEventItem[] = items.map((item: any) => {
      // Parse start and end time
      let startMs: number;
      let endMs: number;

      if (item.start?.dateTime) {
        startMs = new Date(item.start.dateTime).getTime();
      } else if (item.start?.date) {
        // All day event - starts at midnight local time
        const [y, m, d] = item.start.date.split('-').map(Number);
        startMs = new Date(y, m - 1, d, 9, 0, 0).getTime();
      } else {
        startMs = Date.now();
      }

      if (item.end?.dateTime) {
        endMs = new Date(item.end.dateTime).getTime();
      } else if (item.end?.date) {
        const [y, m, d] = item.end.date.split('-').map(Number);
        endMs = new Date(y, m - 1, d, 18, 0, 0).getTime();
      } else {
        endMs = startMs + 60 * 60 * 1000; // default 1 hour
      }

      return {
        id: `gcal-${item.id}`,
        title: item.summary || 'Scheduled Study / Task',
        description: item.description || '',
        startTime: startMs,
        endTime: endMs,
        location: item.location || '',
        completed: false,
        source: 'google',
        color: item.colorId ? '#7c5cfc' : '#3b82f6',
      };
    });

    return formattedEvents;
  } catch (err) {
    console.warn('Failed to fetch Google Calendar events:', err);
    throw err;
  }
}

/**
 * Checks if an event is time-gated (current time is before the start time)
 * Returns true if locked (cannot confirm yet), false if unlockable (now >= startTime)
 */
export function isEventTimeGated(eventStartTime: number): boolean {
  return Date.now() < eventStartTime;
}

/**
 * Formats a timestamp into human-readable 12h or 24h time string
 */
export function formatEventTime(timestamp: number, lang: 'ar' | 'en' = 'en'): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Formats a date timestamp into "Wed, Nov 5" format
 */
export function formatEventDate(timestamp: number, lang: 'ar' | 'en' = 'en'): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
