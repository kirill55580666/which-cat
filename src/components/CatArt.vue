<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import firstAtlas from '../assets/cats-1.png';
import secondAtlas from '../assets/cats-2.png';
import thirdAtlas from '../assets/cats-3.png';

const props = defineProps<{ art: number; label?: string }>();
const atlases = [firstAtlas, secondAtlas, thirdAtlas];
const failed = ref(false);
const atlas = computed(() => atlases[Math.floor(props.art / 20)] ?? firstAtlas);
const artStyle = computed(() => ({
  backgroundImage: `url("${atlas.value}")`,
  backgroundPosition: `${((props.art % 20) % 5) * 25}% ${Math.floor((props.art % 20) / 5) * (100 / 3)}%`,
}));
watch(atlas, () => { failed.value = false; });
</script>

<template>
  <div v-if="!failed" class="cat-art" :style="artStyle" role="img" :aria-label="label || 'Твой сегодняшний кот'">
    <img class="atlas-check" :src="atlas" alt="" aria-hidden="true" @error="failed = true" />
  </div>
  <div v-else class="cat-art art-fallback" role="img" aria-label="Иллюстрация кота временно недоступна">
    <span class="fallback-face" aria-hidden="true">ฅ^•ﻌ•^ฅ</span>
    <span>Кот спрятался за рисунком.<br />Но его настроение всё ещё с тобой.</span>
  </div>
</template>
