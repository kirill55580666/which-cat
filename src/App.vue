<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import CatArt from './components/CatArt.vue';
import { useCatGame } from './useCatGame';

const {
  current, cat, variant, screen, mode, storageAvailable, downloading, notice,
  quizQuestions, questionIndex, answers, quizResultReason, activeQuestion,
  showDaily, anotherCat, startQuiz, answerQuiz, previousQuestion, cancelQuiz, download,
} = useCatGame();
const heading = ref<HTMLElement | null>(null);
watch([screen, questionIndex], async () => {
  await nextTick();
  heading.value?.focus({ preventScroll: true });
});
</script>

<template>
  <main class="app-shell">
    <header class="site-header">
      <a class="brand" href="#" @click.prevent="showDaily" aria-label="Какой ты кот? Вернуться к коту дня">
        Какой ты кот<span class="brand-question">?</span>
      </a>
      <p class="brand-note">маленький повод помурчать</p>
    </header>

    <section v-if="screen === 'card' && cat && variant && current" class="cat-card" aria-label="Карточка твоего кота">
      <p class="eyebrow"><span>{{ mode === 'daily' ? 'твой кот сегодня' : mode === 'quiz' ? 'по всем кошачьим признакам' : 'ещё один ты' }}</span></p>
      <h1 ref="heading" class="cat-name" tabindex="-1" :key="cat.id"><span>{{ cat.name }}</span></h1>
      <div class="art-stage">
        <span class="doodle doodle-note" aria-hidden="true">♫</span>
        <CatArt :art="cat.art" :label="`Кот ${cat.name}`" />
        <span class="doodle doodle-spark" aria-hidden="true">✧</span>
      </div>
      <div class="card-copy">
        <h2 class="cat-motto">{{ variant.title }}</h2>
        <p class="cat-description">{{ variant.description }}</p>
        <p v-if="mode === 'quiz' && quizResultReason" class="quiz-reason">{{ quizResultReason }}</p>
      </div>
      <div class="stats" aria-label="Кошачьи характеристики">
        <div v-for="(stat, index) in cat.stats" :key="stat" class="stat-chip" :class="{ 'stat-chip-pink': index === 1 }">
          <span>{{ stat }}</span><strong>{{ current.values[index] }}<small>%</small></strong>
        </div>
      </div>
      <div class="card-actions">
        <button class="button button-primary" type="button" @click="anotherCat">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c1.8 0 3.2-1.6 4.5-3.8M14 9.8C15.3 7.6 16.6 6 18 6h3m-4-4 4 4-4 4" /></svg>
          Ещё кота
        </button>
        <button class="button button-secondary" type="button" :disabled="downloading" @click="download">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></svg>
          {{ downloading ? 'Рисуем открытку…' : 'Скачать открытку' }}
        </button>
      </div>
      <aside class="cat-task"><span class="task-label">кошачье поручение</span><p>{{ cat.task }}</p></aside>
    </section>

    <section v-else-if="screen === 'quiz' && activeQuestion" class="quiz-card" aria-label="Мини-тест по настроению">
      <div class="quiz-topline"><span class="small-label">мини-тест · примерно минута</span><button class="text-button" type="button" @click="cancelQuiz" aria-label="Закрыть мини-тест">Закрыть <span aria-hidden="true">×</span></button></div>
      <div class="quiz-progress-label"><span>Вопрос {{ questionIndex + 1 }} из {{ quizQuestions.length }}</span><span aria-hidden="true">мур?</span></div>
      <div class="quiz-progress" role="progressbar" :aria-valuenow="questionIndex + 1" :aria-valuemin="1" :aria-valuemax="quizQuestions.length" aria-label="Прогресс мини-теста"><span :style="{ width: `${((questionIndex + 1) / quizQuestions.length) * 100}%` }" /></div>
      <h1 ref="heading" class="quiz-heading" tabindex="-1">{{ activeQuestion.text }}</h1>
      <p class="quiz-hint">Выбирай, как чувствуешь. Тут все ответы кошачьи.</p>
      <div class="quiz-answers">
        <button v-for="(answer, index) in activeQuestion.answers" :key="`${activeQuestion.id}-${index}`" class="answer-button" :class="{ selected: answers[questionIndex] === index }" type="button" @click="answerQuiz(index)">
          <span class="answer-number" aria-hidden="true">{{ index + 1 }}</span><span>{{ answer.text }}</span><span class="answer-arrow" aria-hidden="true">↗</span>
        </button>
      </div>
      <button v-if="questionIndex > 0" class="text-button quiz-back" type="button" @click="previousQuestion">← Предыдущий вопрос</button>
      <p v-else class="quiz-bottom-note">Не думай слишком долго. Твой внутренний кот уже знает.</p>
    </section>

    <section v-else class="empty-card"><h1 ref="heading" tabindex="-1">Кот немного замурчался</h1><p>Давай позовём его ещё раз.</p><button class="button button-primary" type="button" @click="showDaily">Позвать кота</button></section>

    <p class="notice" role="status" aria-live="polite" aria-atomic="true">{{ notice }}</p>
    <nav class="bottom-nav" aria-label="Основные разделы">
      <button type="button" :class="{ active: screen === 'card' && mode === 'daily' }" :aria-current="screen === 'card' && mode === 'daily' ? 'page' : undefined" @click="showDaily">
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="m7 13-1-8 8 5h4l8-5-1 8c3 3 3 10-1 13-4 3-12 3-16 0-4-3-4-10-1-13Z" /><path d="M11 18h.1M21 18h.1M14 23l2 1 2-1M3 20l5 1m16 0 5-1" /></svg>
        <span>Кот дня</span>
      </button>
      <button type="button" :class="{ active: screen === 'quiz' || mode === 'quiz' }" :aria-current="screen === 'quiz' || mode === 'quiz' ? 'page' : undefined" @click="startQuiz">
        <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="4" width="19" height="25" rx="3" /><path d="M12 11h9m-9 6h9m-9 6h5M4 8v18" /></svg>
        <span>Мини-тест</span>
      </button>
    </nav>
    <footer class="site-footer"><p>60 котов. И каждый немножко ты.</p><p>{{ storageAvailable ? 'Кот дня и история остаются в этом браузере.' : 'Хранилище недоступно: кот дня и история сохранятся только до закрытия страницы.' }}</p></footer>
  </main>
</template>
