<script setup lang="ts">
import IconPuzzle from '~icons/tabler/puzzle';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <div class="tooltip tooltip-bottom" data-tip="Extensions">
    <button
      class="btn btn-sm shadow-lg"
      :class="{ 'btn-active': open }"
      aria-label="Toggle extensions drawer"
      @click="emit('toggle')"
    >
      <IconPuzzle />
    </button>
  </div>
</template>
