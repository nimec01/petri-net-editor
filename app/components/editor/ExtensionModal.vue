<script setup lang="ts">
import type { Component } from 'vue';
import type { PetriNetExtension } from '~/types/extension';
import IconX from '~icons/tabler/x';

const props = defineProps<{
  extension: PetriNetExtension | null;
  result: Component | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);

watch(
  () => props.extension,
  (extension) => {
    if (extension) {
      if (!dialogEl.value?.open) {
        dialogEl.value?.showModal();
      }
    } else {
      dialogEl.value?.close();
    }
  },
);

function handleNativeClose() {
  emit('close');
}
</script>

<template>
  <dialog ref="dialogEl" class="modal" @close="handleNativeClose">
    <div class="modal-box min-w-lg max-w-full" :class="extension?.fullWidth ? '' : 'w-fit'">
      <div v-if="extension" class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold">
          {{ extension.name }}
        </h3>
        <button class="btn btn-sm btn-ghost btn-square" aria-label="Close" @click="emit('close')">
          <IconX />
        </button>
      </div>
      <component :is="result" />
      <div class="modal-action">
        <button class="btn" @click="emit('close')">
          Close
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
