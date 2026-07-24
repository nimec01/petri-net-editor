<script setup lang="ts">
import type { EditorMode } from '~/types/petri-net';

defineProps<{
  activeMode: EditorMode;
}>();

const emit = defineEmits<{
  'update:activeMode': [mode: EditorMode];
  'zoomIn': [];
  'zoomOut': [];
  'zoomToFit': [];
}>();

const modes: { id: EditorMode; icon: string; label: string }[] = [
  { id: 'select', icon: '↖', label: 'Select' },
  { id: 'place', icon: '○', label: 'Place' },
  { id: 'transition', icon: '▬', label: 'Transition' },
  { id: 'arc', icon: '→', label: 'Arc' },
  { id: 'token', icon: '●', label: 'Token' },
  { id: 'delete', icon: '✕', label: 'Delete' },
];

function setMode(mode: EditorMode) {
  emit('update:activeMode', mode);
}
</script>

<template>
  <div class="join shadow-lg">
    <div
      v-for="m in modes"
      :key="m.id"
      class="tooltip tooltip-bottom"
      :data-tip="m.label"
    >
      <button
        class="btn join-item btn-sm"
        :class="{ 'btn-active btn-primary': activeMode === m.id }"
        @click="setMode(m.id)"
      >
        {{ m.icon }}
      </button>
    </div>
    <div class="divider divider-horizontal" />
    <div class="tooltip tooltip-bottom" data-tip="Zoom In">
      <button class="btn join-item btn-sm" @click="emit('zoomIn')">
        🔎+
      </button>
    </div>
    <div class="tooltip tooltip-bottom" data-tip="Zoom Out">
      <button class="btn join-item btn-sm" @click="emit('zoomOut')">
        🔎−
      </button>
    </div>
    <div class="tooltip tooltip-bottom" data-tip="Fit to Screen">
      <button class="btn join-item btn-sm" @click="emit('zoomToFit')">
        ⊡
      </button>
    </div>
  </div>
</template>
