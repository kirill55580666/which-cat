export const MOODS = ['cozy', 'royal', 'tender', 'chaos', 'explorer'] as const;
export type Mood = (typeof MOODS)[number];
export type MoodScores = Record<Mood, number>;
export interface CatVariant { title: string; description: string }
export interface Cat {
  id: string;
  name: string;
  mood: Mood;
  naming: 'short' | 'surname' | 'habitat' | 'epithet' | 'ordinal' | 'invented';
  art: number;
  variants: [CatVariant, CatVariant, CatVariant, CatVariant];
  task: string;
  stats: [string, string];
  values: [number, number];
}
export interface QuizAnswer { text: string; scores: Partial<MoodScores> }
export interface QuizQuestion { id: string; text: string; answers: QuizAnswer[] }
export interface Card { catId: string; variant: number; values: [number, number] }
export interface GameState {
  version: 1;
  dailyDate: string;
  daily: Card | null;
  dailyQueue: string[];
  randomQueue: string[];
  recent: string[];
  variantQueues: Record<string, number[]>;
  lastRandom: string | null;
}
