<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import firstAtlas from '../assets/cats-1.png';
import secondAtlas from '../assets/cats-2.png';
import thirdAtlas from '../assets/cats-3.png';
import { artRects } from '../artRects';

const props = defineProps<{ art: number; label?: string }>();
const atlases = [firstAtlas, secondAtlas, thirdAtlas];
const failed = ref(false);
const atlas = computed(() => atlases[Math.floor(props.art / 20)] ?? firstAtlas);
const rect = computed(() => artRects[props.art] ?? artRects[0]);
const viewBox = computed(() => `${rect.value.x} ${rect.value.y} ${rect.value.width} ${rect.value.height}`);
watch(atlas, () => { failed.value = false; });
</script>

<template>
  <div v-if="!failed" class="cat-art" role="img" :aria-label="label || 'Твой сегодняшний кот'">
    <svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" aria-hidden="true" style="display:block;overflow:hidden">
      <image :href="atlas" :width="rect.sheetWidth" :height="rect.sheetHeight" />
    </svg>
    <img class="atlas-check" :src="atlas" alt="" aria-hidden="true" @error="failed = true" />
  </div>
  <div v-else class="cat-art art-fallback" role="img" aria-label="Иллюстрация кота временно недоступна">
    <span class="fallback-face" aria-hidden="true">ฅ^•ﻌ•^ฅ</span>
    <span>Кот спрятался за рисунком.<br />Но его настроение всё ещё с тобой.</span>
  </div>
</template>
