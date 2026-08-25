<script setup lang="ts">
import type { Tab } from '~/composables/useTabs';
import IconColumns2 from '~icons/tabler/columns-2';
import IconCopy from '~icons/tabler/copy';
import IconPlus from '~icons/tabler/plus';
import IconShare2 from '~icons/tabler/share-2';
import IconX from '~icons/tabler/x';

defineProps<{
  tabs: Tab[];
  activeTabId: string;
  splitViewId: string | null;
}>();

const emit = defineEmits<{
  switch: [id: string];
  close: [id: string];
  add: [];
  duplicate: [id: string];
  rename: [id: string, name: string];
  split: [id: string];
}>();
</script>

<template>
  <div class="flex items-center bg-base-200 border-b border-base-300 px-2 pt-1 gap-1 overflow-x-auto">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      role="tab"
      class="group flex items-center gap-1 px-3 py-1.5 text-sm cursor-pointer rounded-t-md transition-colors select-none whitespace-nowrap"
      :class="{
        'bg-base-100 text-base-content font-medium border border-b-0 border-base-300': tab.id === activeTabId,
        'text-base-content/60 hover:text-base-content hover:bg-base-100/50': tab.id !== activeTabId,
        'ring-1 ring-primary/40': tab.id === splitViewId,
      }"
      @click="emit('switch', tab.id)"
    >
      <IconShare2 v-if="tab.type === 'reachability-graph'" class="w-3 h-3 shrink-0" />
      <span @dblclick.stop="emit('rename', tab.id, tab.name)">{{ tab.name }}</span>
      <button
        class="btn btn-ghost btn-xs p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        :class="{ '!opacity-100 text-primary': tab.id === splitViewId }"
        :title="tab.id === splitViewId ? 'Close split view' : 'Open in split view'"
        @click.stop="emit('split', tab.id)"
      >
        <IconColumns2 class="w-3 h-3" />
      </button>
      <button
        v-if="tab.type === 'petri-net'"
        class="btn btn-ghost btn-xs p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Duplicate tab"
        @click.stop="emit('duplicate', tab.id)"
      >
        <IconCopy class="w-3 h-3" />
      </button>
      <button
        class="btn btn-ghost btn-xs p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Close tab"
        @click.stop="emit('close', tab.id)"
      >
        <IconX class="w-3 h-3" />
      </button>
    </div>
    <button
      class="btn btn-ghost btn-xs p-1.5 text-base-content/60 hover:text-base-content"
      title="New tab"
      @click="emit('add')"
    >
      <IconPlus class="w-4 h-4" />
    </button>
  </div>
</template>
