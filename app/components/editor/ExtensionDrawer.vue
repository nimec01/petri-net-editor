<script setup lang="ts">
import type { PetriNetExtension } from '~/types/extension';
import IconX from '~icons/tabler/x';

const props = withDefaults(defineProps<{
  open: boolean;
  extensions: PetriNetExtension[];
  drawerId?: string;
}>(), {
  drawerId: 'extensions-drawer',
});

const emit = defineEmits<{
  select: [id: string];
  close: [];
}>();

const drawerChecked = computed({
  get: () => props.open,
  set: (checked: boolean) => {
    if (!checked)
      emit('close');
  },
});
</script>

<template>
  <div class="drawer flex-1 min-h-0">
    <input
      :id="drawerId"
      v-model="drawerChecked"
      type="checkbox"
      class="drawer-toggle"
      aria-label="Extensions drawer"
    >
    <div class="drawer-content relative overflow-hidden">
      <slot />
    </div>
    <div class="drawer-side z-30">
      <label :for="drawerId" aria-label="Close extensions" class="drawer-overlay" />
      <div class="flex flex-col w-72 h-full bg-base-300 border-r border-base-300 shadow-lg">
        <div class="flex items-center justify-between px-4 py-3 border-b border-base-300">
          <h3 class="text-lg font-bold">
            Extensions
          </h3>
          <button class="btn btn-sm btn-ghost btn-square" aria-label="Close extensions" @click="emit('close')">
            <IconX />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <p v-if="extensions.length === 0" class="text-sm text-base-content/60 px-2 py-4">
            No extensions available.
          </p>
          <ul v-else class="menu w-full p-0">
            <li v-for="ext in extensions" :key="ext.id">
              <button @click="emit('select', ext.id)">
                <component :is="ext.icon" class="shrink-0" />
                {{ ext.name }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
