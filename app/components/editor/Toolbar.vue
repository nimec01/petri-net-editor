<script setup lang="ts">
import type { Component } from 'vue';
import type { EditorMode } from '~/types/petri-net';
import IconFitScreen from '~icons/tabler/arrows-diagonal';
import IconZoomIn from '~icons/tabler/zoom-in';
import IconZoomOut from '~icons/tabler/zoom-out';

defineProps<{
  activeMode: EditorMode;
}>();

const emit = defineEmits<{
  'update:activeMode': [mode: EditorMode];
  'zoomIn': [];
  'zoomOut': [];
  'zoomToFit': [];
}>();

const modes: { id: EditorMode; icon: Component; iconSize?: number; label: string }[] = [
  { id: 'select', icon: defineAsyncComponent(() => import('~icons/tabler/pointer')), label: 'Select' },
  { id: 'place', icon: defineAsyncComponent(() => import('~icons/tabler/point')), iconSize: 2.5, label: 'Place' },
  { id: 'transition', icon: defineAsyncComponent(() => import('~icons/tabler/crop-portrait-filled')), label: 'Transition' },
  { id: 'arc', icon: defineAsyncComponent(() => import('~icons/tabler/vector-spline')), label: 'Arc' },
  { id: 'token', icon: defineAsyncComponent(() => import('~icons/tabler/point-filled')), label: 'Token' },
  { id: 'delete', icon: defineAsyncComponent(() => import('~icons/tabler/eraser')), label: 'Delete' },
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
        <component :is="m.icon" :style="{ 'font-size': `${m.iconSize ?? 1.2}em` }" />
      </button>
    </div>
    <div class="divider divider-horizontal" />
    <div class="tooltip tooltip-bottom" data-tip="Zoom In">
      <button class="btn join-item btn-sm" @click="emit('zoomIn')">
        <IconZoomIn style="font-size: 1.2em;" />
      </button>
    </div>
    <div class="tooltip tooltip-bottom" data-tip="Zoom Out">
      <button class="btn join-item btn-sm" @click="emit('zoomOut')">
        <IconZoomOut style="font-size: 1.2em;" />
      </button>
    </div>
    <div class="tooltip tooltip-bottom" data-tip="Fit to Screen">
      <button class="btn join-item btn-sm" @click="emit('zoomToFit')">
        <IconFitScreen style="font-size: 1.2em;" />
      </button>
    </div>
  </div>
</template>
