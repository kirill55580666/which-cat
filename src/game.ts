import { cats } from './data/cats';
import { MOODS, type Card, type GameState, type Mood, type QuizQuestion } from './types';

export const STORAGE_KEY = 'which-cat:v1';
export const catById = new Map(cats.map(cat => [cat.id, cat]));
const ids = cats.map(cat => cat.id);
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function freshState(): GameState {
  return { version: 1, dailyDate: '', daily: null, dailyQueue: [], randomQueue: [], recent: [], variantQueues: {}, lastRandom: null };
}
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function stringIds(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && catById.has(id)))] : [];
}
function validCard(value: unknown): value is Card {
  return record(value) && typeof value.catId === 'string' && catById.has(value.catId)
    && typeof value.variant === 'number' && Number.isInteger(value.variant) && value.variant >= 0 && value.variant < 4
    && Array.isArray(value.values) && value.values.length === 2 && value.values.every(n => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 100);
}
export function restoreState(raw: string | null): GameState {
  if (!raw) return freshState();
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.version !== 1) return freshState();
    const state = freshState();
    state.daily = validCard(value.daily) ? value.daily : null;
    state.dailyDate = typeof value.dailyDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.dailyDate) ? value.dailyDate : '';
    state.dailyQueue = stringIds(value.dailyQueue);
    state.randomQueue = stringIds(value.randomQueue);
    state.recent = stringIds(value.recent).slice(-10);
    state.lastRandom = typeof value.lastRandom === 'string' && catById.has(value.lastRandom) ? value.lastRandom : null;
    if (record(value.variantQueues)) {
      for (const [id, queue] of Object.entries(value.variantQueues)) {
        if (catById.has(id) && Array.isArray(queue)) state.variantQueues[id] = [...new Set(queue.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 4))];
      }
    }
    return state;
  } catch { return freshState(); }
}
function remember(state: GameState, id: string): void {
  state.recent = [...state.recent.filter(item => item !== id), id].slice(-10);
}
function makeCard(state: GameState, id: string, random: () => number): Card {
  const cat = catById.get(id);
  if (!cat) throw new Error('Кот не найден');
  if (!state.variantQueues[id]?.length) state.variantQueues[id] = shuffle([0, 1, 2, 3], random);
  const variant = state.variantQueues[id].shift() ?? 0;
  remember(state, id);
  return { catId: id, variant, values: [...cat.values] };
}
export function dailyCard(state: GameState, date = localDate(), random = Math.random): Card {
  if (state.dailyDate === date && state.daily) return state.daily;
  const previous = state.daily?.catId;
  const isFirst = !state.daily && !state.dailyDate;
  if (!state.dailyQueue.length) state.dailyQueue = shuffle(ids, random);
  let index = state.dailyQueue.findIndex(id => id !== previous && !state.recent.includes(id));
  if (index < 0) index = state.dailyQueue.findIndex(id => id !== previous);
  if (isFirst) index = state.dailyQueue.findIndex(id => catById.get(id)?.art === 8);
  const [id] = state.dailyQueue.splice(index < 0 ? 0 : index, 1);
  state.daily = makeCard(state, id, random);
  state.dailyDate = date;
  return state.daily;
}
export function nextRandom(state: GameState, random = Math.random): Card {
  if (!state.randomQueue.length) state.randomQueue = shuffle(ids, random);
  let index = state.randomQueue.findIndex(id => id !== state.lastRandom && !state.recent.includes(id));
  if (index < 0) index = state.randomQueue.findIndex(id => id !== state.lastRandom);
  const [id] = state.randomQueue.splice(index < 0 ? 0 : index, 1);
  state.lastRandom = id;
  return makeCard(state, id, random);
}
export function scoreQuiz(questions: QuizQuestion[], answers: (number | null)[]): Mood {
  const scores: Record<Mood, number> = { cozy: 0, royal: 0, tender: 0, chaos: 0, explorer: 0 };
  questions.forEach((question, i) => {
    const index = answers[i];
    const answer = index === null || index === undefined ? undefined : question.answers[index];
    if (answer) for (const mood of MOODS) scores[mood] += answer.scores[mood] ?? 0;
  });
  // При ничьей выбираем первое семейство в явно заданном порядке MOODS.
  return MOODS.reduce((best, mood) => scores[mood] > scores[best] ? mood : best, MOODS[0]);
}
export function quizCard(state: GameState, mood: Mood, random = Math.random): Card {
  const pool = cats.filter(cat => cat.mood === mood);
  const unseen = pool.filter(cat => !state.recent.includes(cat.id));
  const selected = shuffle(unseen.length ? unseen : pool, random)[0];
  return makeCard(state, selected.id, random);
}
export const moodReasons: Record<Mood, string> = {
  cozy: 'В твоих ответах больше спокойствия и уюта. Этот кот тоже бережёт силы для важного лежания.',
  royal: 'Ты выбираешь уверенность и собственные правила. Твой кот занимает трон без предварительной записи.',
  tender: 'В ответах много тепла и заботы. Этот кот считает близость очень серьёзным кошачьим делом.',
  chaos: 'Тебе хочется игры и маленького беспорядка. Этот кот уже придумал, чем пошуршать.',
  explorer: 'Тебя тянет к новому и любопытному. Этот кот готов исследовать даже соседнюю комнату.',
};
