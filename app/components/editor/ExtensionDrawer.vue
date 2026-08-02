<script setup lang="ts">
import type { PetriNetExtension } from '~/types/extension';
import IconX from '~icons/tabler/x';

defineProps<{
  open: boolean;
  extensions: PetriNetExtension[];
}>();

const emit = defineEmits<{
  select: [id: string];
  close: [];
}>();
</script>

<template>
  <Transition name="extension-slide">
    <div
      v-if="open"
      class="absolute left-0 top-0 bottom-0 w-72 z-20 bg-base-300 border-r border-base-300 shadow-lg flex flex-col"
    >
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
  </Transition>
</template>

<style scoped>
.extension-slide-enter-active,
.extension-slide-leave-active {
  transition: transform 0.2s ease;
}
.extension-slide-enter-from,
.extension-slide-leave-to {
  transform: translateX(-100%);
}
</style>
