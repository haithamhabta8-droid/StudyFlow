import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTimer,
  calculateWeightedGPA,
  calculateStreak,
  calculateCardStats,
  getNextCardStatus,
  daysUntil,
} from './calculations.ts';
import { Category, Grade } from '../types/index.ts';

test('formatTimer formats seconds accurately', () => {
  assert.equal(formatTimer(1500), '25:00');
  assert.equal(formatTimer(0), '00:00');
  assert.equal(formatTimer(65), '01:05');
  assert.equal(formatTimer(300), '05:00');
});

test('calculateWeightedGPA computes correct weighted average and letter', () => {
  const grades: Grade[] = [
    { id: '1', title: 'Midterm', score: 90, maxScore: 100, weight: 30, created: 0 },
    { id: '2', title: 'Final', score: 80, maxScore: 100, weight: 70, created: 0 },
  ];
  const result = calculateWeightedGPA(grades);
  // (90 * 30 + 80 * 70) / 100 = 83.0 -> B+
  assert.equal(result.gpa, 83);
  assert.equal(result.letter, 'B+');
  assert.equal(result.totalWeight, 100);
});

test('calculateWeightedGPA returns 0 and - for empty grades', () => {
  const result = calculateWeightedGPA([]);
  assert.equal(result.gpa, 0);
  assert.equal(result.letter, '-');
});

test('calculateStreak counts consecutive days', () => {
  const now = Date.now();
  const dayMs = 86400000;
  // Studied today, yesterday, 2 days ago
  const timestamps = [now, now - dayMs, now - 2 * dayMs];
  const streak = calculateStreak(timestamps);
  assert.equal(streak.currentStreak, 3);
  assert.equal(streak.activeToday, true);
});

test('calculateCardStats aggregates total, mastered, and masteryPct', () => {
  const mockCategories: Category[] = [
    {
      id: 'c1',
      name: 'Math',
      color: '#7c5cfc',
      decks: [
        {
          id: 'd1',
          name: 'Calculus',
          cards: [
            { id: '1', q: 'Q1', a: 'A1', status: 'mastered' },
            { id: '2', q: 'Q2', a: 'A2', status: 'learning' },
            { id: '3', q: 'Q3', a: 'A3', status: 'new' },
            { id: '4', q: 'Q4', a: 'A4', status: 'mastered' },
          ],
          created: 0,
        },
      ],
      tasks: [],
      exams: [],
      grades: [],
      quizzes: [],
      notes: [],
      sessions: [],
      log: [],
    },
  ];

  const stats = calculateCardStats(mockCategories);
  assert.equal(stats.total, 4);
  assert.equal(stats.mastered, 2);
  assert.equal(stats.learning, 1);
  assert.equal(stats.fresh, 1);
  assert.equal(stats.masteryPct, 50);
});

test('getNextCardStatus updates status correctly', () => {
  assert.equal(getNextCardStatus('new', true), 'learning');
  assert.equal(getNextCardStatus('learning', true), 'mastered');
  assert.equal(getNextCardStatus('mastered', false), 'learning');
  assert.equal(getNextCardStatus('new', false), 'learning');
});
