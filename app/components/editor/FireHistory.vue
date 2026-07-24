<script setup lang="ts">
import type { FiringHistoryEntry } from '~/types/petri-net';
import IconArrowBackUp from '~icons/tabler/arrow-back-up';
import IconTrash from '~icons/tabler/trash';

const props = defineProps<{
  history: FiringHistoryEntry[];
  placeLabels: Record<string, string>;
}>();

const emit = defineEmits<{
  clear: [];
  revert: [];
  jump: [entryId: number];
}>();

const scrollContainer = ref<HTMLElement | null>(null);

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
          @click="emit('revert')"
        >
          <IconArrowBackUp style="font-size: 1em;" />
        </button>
        <button
          class="btn btn-ghost btn-xs"
          :disabled="history.length === 0"
          @click="emit('clear')"
        >
          <IconTrash style="font-size: 1em;" />
        </button>
      </div>
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
