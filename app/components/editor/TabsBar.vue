<script setup lang="ts">
import type { Tab } from '~/composables/useTabs';
import IconCopy from '~icons/tabler/copy';
import IconPlus from '~icons/tabler/plus';
import IconX from '~icons/tabler/x';

defineProps<{
  tabs: Tab[];
  activeTabId: string;
}>();

const emit = defineEmits<{
  switch: [id: string];
  close: [id: string];
  add: [];
  duplicate: [id: string];
  rename: [id: string, name: string];
}>();
</script>

<template>
  <div class="flex items-center bg-base-200 border-b border-base-300 px-2 pt-1 gap-1 overflow-x-auto">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      role="tab"
      class="group flex items-center gap-1 px-3 py-1.5 text-sm cursor-pointer rounded-t-md transition-colors select-none whitespace-nowrap"
      :class="tab.id === activeTabId
        ? 'bg-base-100 text-base-content font-medium border border-b-0 border-base-300'
        : 'text-base-content/60 hover:text-base-content hover:bg-base-100/50'"
      @click="emit('switch', tab.id)"
    >
      <span @dblclick.stop="emit('rename', tab.id, tab.name)">{{ tab.name }}</span>
      <button
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
