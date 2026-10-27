import { describe, expect, it } from 'vitest';
import { cats } from './cats';
import { questions } from './questions';
import { MOODS } from '../types';

const requiredNames = [
  'Кокша', 'Маня Понич', 'Лесной Кадаврик', 'Костяная Римма', 'Грыг',
  'Лёня Мелкозуб', 'Шпендель', 'Валентин Четвёртый', 'Чунявый Бенедикт',
];
const namingFamilies = ['short', 'surname', 'habitat', 'epithet', 'ordinal', 'invented'];

describe('cat content', () => {
  it('contains 60 distinct cats with unique IDs, names, and art assignments', () => {
    expect(cats).toHaveLength(60);
    for (const key of ['id', 'name', 'art'] as const) {
      expect(new Set(cats.map(cat => cat[key])).size, `${key} should be unique`).toBe(60);
    }
  });

  it('includes the nine required names exactly and covers all naming families', () => {
    expect(requiredNames.every(name => cats.some(cat => cat.name === name))).toBe(true);
    expect(new Set(cats.map(cat => cat.naming))).toEqual(new Set(namingFamilies));
  });

  it('provides four distinct, nonempty descriptions for every cat', () => {
    const descriptions = cats.flatMap(cat => cat.variants.map(variant => variant.description.trim()));
    expect(cats.every(cat => cat.variants.length === 4)).toBe(true);
    expect(descriptions).toHaveLength(240);
    expect(descriptions.every(Boolean)).toBe(true);
    expect(new Set(descriptions).size).toBe(240);
  });

  it('balances the five moods across twelve cats each', () => {
    expect(MOODS).toHaveLength(5);
    for (const mood of MOODS) expect(cats.filter(cat => cat.mood === mood)).toHaveLength(12);
  });

  it('has 60 distinct tasks and two valid named stats per cat', () => {
    const tasks = cats.map(cat => cat.task.trim());
    expect(tasks.every(Boolean)).toBe(true);
    expect(new Set(tasks).size).toBe(60);
    for (const cat of cats) {
      expect(cat.stats).toHaveLength(2);
      expect(cat.stats.every(stat => stat.trim().length > 0)).toBe(true);
      expect(cat.values).toHaveLength(2);
      expect(cat.values.every(value => Number.isInteger(value) && value >= 0 && value <= 100)).toBe(true);
    }
  });
});

describe('quiz content', () => {
  it('has 20 questions with unique IDs, three or four answers, and finite nonnegative mood scores', () => {
    expect(questions).toHaveLength(20);
    expect(new Set(questions.map(question => question.id)).size).toBe(20);
    for (const question of questions) {
      expect(question.id.trim()).not.toBe('');
      expect(question.text.trim()).not.toBe('');
      expect(question.answers.length).toBeGreaterThanOrEqual(3);
      expect(question.answers.length).toBeLessThanOrEqual(4);
      for (const answer of question.answers) {
        expect(answer.text.trim()).not.toBe('');
        for (const [mood, score] of Object.entries(answer.scores)) {
          expect(MOODS).toContain(mood);
          expect(Number.isFinite(score) && score >= 0).toBe(true);
        }
        expect(Object.keys(answer.scores).length).toBeGreaterThan(0);
      }
    }
  });
});
