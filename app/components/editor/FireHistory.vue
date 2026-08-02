<script setup lang="ts">
import type { FiringHistoryEntry } from '~/types/petri-net';
import IconArrowBackUp from '~icons/tabler/arrow-back-up';
import IconPlayerPause from '~icons/tabler/player-pause';
import IconPlayerPlay from '~icons/tabler/player-play';
import IconPlayerSkipForward from '~icons/tabler/player-skip-forward';
import IconTrash from '~icons/tabler/trash';

const props = defineProps<{
  history: FiringHistoryEntry[];
  placeLabels: Record<string, string>;
  autoFiring: boolean;
  autoFireSpeed: number;
}>();

const emit = defineEmits<{
  'clear': [];
  'revert': [];
  'jump': [entryId: number];
  'toggleAutoFire': [];
  'autoFireN': [count: number];
  'update:autoFireSpeed': [speed: number];
}>();

const scrollContainer = ref<HTMLElement | null>(null);
const nSteps = ref(1);

function resolveMarking(marking: Record<string, number>): string {
  return Object.entries(marking)
    .map(([id, v]) => `${props.placeLabels[id] || id}:${v}`)
    .join(' ');
}

watch(() => props.history.length, () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
    }
  });
});
</script>

<template>
  <div class="bg-base-200 rounded-box shadow-lg w-72 max-h-96 flex flex-col">
    <div class="flex items-center justify-between px-4 py-2 border-b border-base-300">
      <h3 class="font-bold text-sm">
        Firing History
      </h3>
      <div class="flex gap-1">
        <button
          class="btn btn-ghost btn-xs"
          :disabled="history.length === 0"
          data-testid="history-revert"
          @click="emit('revert')"
        >
          <IconArrowBackUp style="font-size: 1em;" />
        </button>
        <button
          class="btn btn-ghost btn-xs"
          :disabled="history.length === 0"
          data-testid="history-clear"
          @click="emit('clear')"
        >
          <IconTrash style="font-size: 1em;" />
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2 px-4 py-2 border-b border-base-300">
      <div class="tooltip tooltip-bottom" :data-tip="autoFiring ? 'Stop Auto-Fire' : 'Auto-Fire'">
        <button
          class="btn btn-xs"
          :class="autoFiring ? 'btn-error' : 'btn-success'"
          data-testid="auto-fire"
          @click="emit('toggleAutoFire')"
        >
          <IconPlayerPause v-if="autoFiring" style="font-size: 1em;" />
          <IconPlayerPlay v-else style="font-size: 1em;" />
        </button>
      </div>
      <div class="tooltip tooltip-bottom" data-tip="Fire One Step">
        <button
          class="btn btn-xs btn-ghost"
          :disabled="autoFiring"
          data-testid="fire-one-step"
          @click="emit('autoFireN', 1)"
        >
          <IconPlayerSkipForward style="font-size: 1em;" />
        </button>
      </div>
      <div class="join flex-1">
        <input
          v-model.number="nSteps"
          type="number"
          min="1"
          max="100"
          class="input input-xs join-item w-full"
          data-testid="fire-n"
          :disabled="autoFiring"
          @keydown.enter="emit('autoFireN', nSteps)"
        >
        <button
          class="btn btn-xs btn-primary join-item"
          :disabled="autoFiring || nSteps < 1"
          data-testid="fire-go"
          @click="emit('autoFireN', nSteps)"
        >
          Go
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2 px-4 py-1 border-b border-base-300">
      <span class="text-xs opacity-60 shrink-0">Speed</span>
      <input
        type="range"
        min="100"
        max="2000"
        step="100"
        :value="autoFireSpeed"
        class="range range-xs range-primary flex-1"
        data-testid="fire-speed"
        @input="emit('update:autoFireSpeed', Number(($event.target as HTMLInputElement).value))"
      >
      <span class="text-xs font-mono w-10 text-right">{{ autoFireSpeed }}ms</span>
    </div>

    <div ref="scrollContainer" class="overflow-y-auto flex-1">
      <div v-if="history.length === 0" class="px-4 py-6 text-center text-sm opacity-50">
        No transitions fired yet.
      </div>
      <ul v-else class="list">
        <li
          v-for="entry in history"
          :key="entry.id"
          class="list-row items-center text-sm py-1 px-4 cursor-pointer hover:bg-base-300"
          :data-testid="`history-entry-${entry.id}`"
          @click="emit('jump', entry.id)"
        >
          <div class="flex flex-col flex-1 min-w-0">
            <span class="font-mono font-semibold truncate">{{ entry.transitionLabel }}</span>
            <span class="text-xs opacity-60 font-mono">
              {{ resolveMarking(entry.markingAfter) }}
            </span>
          </div>
          <span class="badge badge-sm badge-ghost shrink-0">#{{ entry.id }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
