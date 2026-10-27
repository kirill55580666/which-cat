import { describe, expect, it } from 'vitest';
import { cats } from './data/cats';
import { catById, dailyCard, freshState, localDate, nextRandom, quizCard, restoreState, scoreQuiz } from './game';
import { MOODS } from './types';

const fixedRandom = () => 0.37;

describe('game state and selection', () => {
  it('returns the same daily card for the same local date and advances on the next date', () => {
    const state = freshState();
    const first = dailyCard(state, '2026-10-27', fixedRandom);
    expect(dailyCard(state, '2026-10-27', () => 0.99)).toEqual(first);

    const nextDay = dailyCard(state, '2026-10-28', fixedRandom);
    expect(nextDay.catId).not.toBe(first.catId);
    expect(state.dailyDate).toBe('2026-10-28');
    expect(dailyCard(state, '2026-10-28')).toEqual(nextDay);
  });

  it('selects the first daily cat randomly instead of forcing a specific character', () => {
    const first = dailyCard(freshState(), '2026-10-27', () => 0);
    const other = dailyCard(freshState(), '2026-10-27', () => 0.999);
    expect(first.catId).not.toBe(other.catId);
    expect(catById.has(first.catId)).toBe(true);
    expect(catById.has(other.catId)).toBe(true);
  });

  it('keeps the daily card while random cards are requested', () => {
    const state = freshState();
    const daily = dailyCard(state, '2026-10-27', fixedRandom);

    const randomCard = nextRandom(state, fixedRandom);
    expect(randomCard.catId).not.toBe(daily.catId);
    expect(state.daily).toEqual(daily);
    expect(dailyCard(state, '2026-10-27')).toEqual(daily);
  });

  it('uses each daily cat once before reshuffling and excludes yesterday at a cycle boundary', () => {
    const state = freshState();
    const cards = Array.from({ length: cats.length }, (_, day) => dailyCard(state, localDate(new Date(2026, 9, 27 + day)), fixedRandom));
    expect(new Set(cards.map(card => card.catId)).size).toBe(cats.length);
    const nextCycle = dailyCard(state, '2026-11-01', fixedRandom);
    expect(nextCycle.catId).not.toBe(cards[cards.length - 1].catId);
  });

  it('avoids a recently shown cat in the daily queue when another queued cat is available', () => {
    const state = freshState();
    const first = dailyCard(state, '2026-10-27', fixedRandom);
    const recentCandidate = state.dailyQueue[0];
    const alternative = state.dailyQueue[1];
    state.recent = [recentCandidate];
    const nextDay = dailyCard(state, '2026-10-28', fixedRandom);
    expect(nextDay.catId).not.toBe(first.catId);
    expect(nextDay.catId).not.toBe(recentCandidate);
    expect(nextDay.catId).toBe(alternative);
  });

  it('returns every cat once per random cycle and avoids repeating across the cycle boundary', () => {
    const state = freshState();
    const cards = Array.from({ length: cats.length + 1 }, () => nextRandom(state, fixedRandom));
    expect(new Set(cards.slice(0, cats.length).map(card => card.catId)).size).toBe(cats.length);
    expect(cards[cats.length].catId).not.toBe(cards[cats.length - 1].catId);
  });

  it('continues the random queue after a JSON restore', () => {
    const state = freshState();
    const first = nextRandom(state, fixedRandom);
    const restored = restoreState(JSON.stringify(state));
    const before = new Set([first.catId]);
    const remaining = Array.from({ length: cats.length - 1 }, () => nextRandom(restored, fixedRandom));
    expect(remaining.every(card => !before.has(card.catId))).toBe(true);
    expect(new Set(remaining.map(card => card.catId)).size).toBe(cats.length - 1);
  });

  it('uses four variants per cat without repeating before the variant cycle resets', () => {
    const cat = cats[0];
    const state = freshState();
    const cards = Array.from({ length: 4 }, () => {
      state.recent = cats.filter(item => item.mood === cat.mood && item.id !== cat.id).map(item => item.id);
      return quizCard(state, cat.mood, fixedRandom);
    });
    expect(cards.map(card => card.catId)).toEqual(Array(4).fill(cat.id));
    expect(new Set(cards.map(card => card.variant)).size).toBe(4);
  });

  it('scores selected answers and resolves ties in MOODS order', () => {
    const questions = [
      { id: 'one', text: '', answers: [{ text: '', scores: { cozy: 2, royal: 1 } }] },
      { id: 'two', text: '', answers: [{ text: '', scores: { royal: 1 } }] },
    ];
    expect(scoreQuiz(questions, [0, 0])).toBe('cozy');
    expect(scoreQuiz(questions, [null, 0])).toBe('royal');
    expect(scoreQuiz([{ id: 'tie', text: '', answers: [{ text: '', scores: { cozy: 1, royal: 1 } }] }], [0])).toBe(MOODS[0]);
  });

  it('chooses quiz results from the requested mood', () => {
    const state = freshState();
    for (const mood of MOODS) {
      const card = quizCard(state, mood, fixedRandom);
      expect(catById.get(card.catId)?.mood).toBe(mood);
    }
  });

  it('restores malformed or partially invalid persisted data safely', () => {
    expect(restoreState('{not-json')).toEqual(freshState());
    expect(restoreState(JSON.stringify({ version: 2 }))).toEqual(freshState());
    const invalid = restoreState(JSON.stringify({
      version: 1,
      dailyDate: 'not-a-date',
      daily: { catId: 'missing', variant: 8, values: [20, 30] },
      dailyQueue: ['missing', cats[0].id, cats[0].id, 7],
      randomQueue: [],
      recent: ['missing', cats[1].id],
      lastRandom: 'missing',
      variantQueues: { [cats[0].id]: [0, 0, 4, -1, '2'], missing: [1] },
    }));
    expect(invalid.daily).toBeNull();
    expect(invalid.dailyDate).toBe('');
    expect(invalid.dailyQueue).toEqual([cats[0].id]);
    expect(invalid.recent).toEqual([cats[1].id]);
    expect(invalid.lastRandom).toBeNull();
    expect(invalid.variantQueues[cats[0].id]).toEqual([0]);
    expect(invalid.randomQueue).toEqual([]);

    const invalidValues = restoreState(JSON.stringify({ version: 1, daily: { catId: cats[0].id, variant: 0, values: [101, 30] } }));
    expect(invalidValues.daily).toBeNull();
    expect(restoreState(null)).toEqual(freshState());
  });

  it('computes local calendar dates without converting through UTC', () => {
    expect(localDate(new Date(2026, 9, 27, 23, 59))).toBe('2026-10-27');
  });
});

