import { computed, nextTick, onMounted, onScopeDispose, ref, shallowRef } from 'vue';
import { questions } from './data/questions';
import { catById, dailyCard, freshState, localDate, moodReasons, nextRandom, quizCard, restoreState, scoreQuiz, shuffle, STORAGE_KEY } from './game';
import { downloadCard } from './exportCard';
import type { Card, QuizQuestion } from './types';

export function useCatGame() {
  const storageAvailable = ref(true);
  let state = freshState();
  try { state = restoreState(localStorage.getItem(STORAGE_KEY)); } catch { storageAvailable.value = false; }
  const screen = ref<'card' | 'quiz'>('card');
  const mode = ref<'daily' | 'random' | 'quiz'>('daily');
  const current = shallowRef<Card>(dailyCard(state));
  const notice = ref('');
  const downloading = ref(false);
  const quizQuestions = shallowRef<QuizQuestion[]>([]);
  const questionIndex = ref(0);
  const answers = ref<(number | null)[]>([]);
  const quizResultReason = ref('');
  const cat = computed(() => catById.get(current.value.catId) ?? null);
  const variant = computed(() => cat.value?.variants[current.value.variant] ?? null);
  const activeQuestion = computed(() => quizQuestions.value[questionIndex.value] ?? null);
  function save() {
    if (!storageAvailable.value) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { storageAvailable.value = false; }
  }
  save();
  function showDaily() {
    current.value = dailyCard(state); mode.value = 'daily'; screen.value = 'card'; notice.value = ''; save();
  }
  function anotherCat() {
    current.value = nextRandom(state); mode.value = 'random'; screen.value = 'card'; notice.value = ''; save();
  }
  function startQuiz() {
    quizQuestions.value = shuffle(questions).slice(0, 5); answers.value = Array(5).fill(null);
    questionIndex.value = 0; screen.value = 'quiz'; notice.value = '';
  }
  let answering = false;
  async function answerQuiz(index: number) {
    if (answering || screen.value !== 'quiz' || !activeQuestion.value?.answers[index]) return;
    answering = true;
    answers.value[questionIndex.value] = index;
    if (questionIndex.value < quizQuestions.value.length - 1) questionIndex.value++;
    else {
      const mood = scoreQuiz(quizQuestions.value, answers.value);
      current.value = quizCard(state, mood); quizResultReason.value = moodReasons[mood];
      mode.value = 'quiz'; screen.value = 'card'; save();
    }
    await nextTick(); answering = false;
  }
  function previousQuestion() { if (!answering && questionIndex.value > 0) questionIndex.value--; }
  function cancelQuiz() { screen.value = 'card'; if (mode.value === 'daily') showDaily(); }
  async function download() {
    if (downloading.value || !cat.value || !variant.value) return;
    downloading.value = true; notice.value = '';
    try { await downloadCard(cat.value, variant.value, current.value); notice.value = 'Открытка готова. Если она открылась в новой вкладке, сохрани изображение из неё.'; }
    catch { notice.value = 'Открытка пока не скачалась. Проверь загрузку картинки и попробуй ещё раз.'; }
    finally { downloading.value = false; }
  }
  function refreshDay() {
    if (mode.value === 'daily' && screen.value === 'card' && state.dailyDate !== localDate()) showDaily();
  }
  let timer: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    timer = setInterval(refreshDay, 30_000);
    window.addEventListener('focus', refreshDay);
    document.addEventListener('visibilitychange', refreshDay);
  });
  onScopeDispose(() => {
    if (timer) clearInterval(timer);
    window.removeEventListener('focus', refreshDay);
    document.removeEventListener('visibilitychange', refreshDay);
  });
  return { current, cat, variant, screen, mode, storageAvailable, downloading, notice, quizQuestions, questionIndex, answers, quizResultReason, activeQuestion, showDaily, anotherCat, startQuiz, answerQuiz, previousQuestion, cancelQuiz, download };
}
