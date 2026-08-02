<script setup lang="ts">
import type { Component } from 'vue';
import type { EditorMode, LayoutType } from '~/types/petri-net';
import IconFitScreen from '~icons/tabler/arrows-diagonal';
import IconFire from '~icons/tabler/bolt';
import IconLayout from '~icons/tabler/layout-grid';
import IconZoomIn from '~icons/tabler/zoom-in';
import IconZoomOut from '~icons/tabler/zoom-out';

defineProps<{
  activeMode: EditorMode;
  currentLayout: LayoutType;
  extensionsOpen: boolean;
}>();

const emit = defineEmits<{
  'update:activeMode': [mode: EditorMode];
  'zoomIn': [];
  'zoomOut': [];
  'zoomToFit': [];
  'applyLayout': [type: LayoutType];
  'toggleExtensions': [];
}>();

const editModes: { id: EditorMode; icon: Component; iconSize?: number; label: string }[] = [
  { id: 'select', icon: defineAsyncComponent(() => import('~icons/tabler/pointer')), label: 'Select' },
  { id: 'place', icon: defineAsyncComponent(() => import('~icons/tabler/point')), iconSize: 2.5, label: 'Place' },
  { id: 'transition', icon: defineAsyncComponent(() => import('~icons/tabler/crop-portrait-filled')), label: 'Transition' },
  { id: 'arc', icon: defineAsyncComponent(() => import('~icons/tabler/vector-spline')), label: 'Arc' },
  { id: 'token', icon: defineAsyncComponent(() => import('~icons/tabler/point-filled')), label: 'Token' },
  { id: 'delete', icon: defineAsyncComponent(() => import('~icons/tabler/eraser')), label: 'Delete' },
];

const layoutOptions: { id: LayoutType; label: string }[] = [
  { id: 'dagre', label: 'Dagre (Directed)' },
  { id: 'circle', label: 'Circle' },
  { id: 'grid', label: 'Grid' },
];

function toggleFireMode(currentMode: EditorMode) {
  emit('update:activeMode', currentMode === 'fire' ? 'select' : 'fire');
}
</script>

<template>
  <div class="flex gap-2">
    <div class="join shadow-lg">
      <template v-if="activeMode !== 'fire'">
        <div
          v-for="m in editModes"
          :key="m.id"
          class="tooltip tooltip-bottom"
          :data-tip="m.label"
        >
          <button
            class="btn join-item btn-sm"
            :class="{ 'btn-active btn-primary': activeMode === m.id }"
            :data-testid="`mode-${m.id}`"
            @click="emit('update:activeMode', m.id)"
          >
            <component :is="m.icon" :style="{ 'font-size': `${m.iconSize ?? 1.2}em` }" />
          </button>
        </div>
      </template>
      <div class="tooltip tooltip-bottom" :data-tip="activeMode === 'fire' ? 'Exit Fire Mode' : 'Fire Mode'">
        <button
          class="btn join-item btn-sm"
          :class="{ 'btn-active btn-primary': activeMode === 'fire' }"
          data-testid="mode-fire"
          @click="toggleFireMode(activeMode)"
        >
          <IconFire style="font-size: 1.2em;" />
        </button>
      </div>
    </div>
    <div class="join shadow-lg">
      <div class="tooltip tooltip-bottom" data-tip="Zoom In">
        <button class="btn join-item btn-sm" data-testid="zoom-in" @click="emit('zoomIn')">
          <IconZoomIn style="font-size: 1.2em;" />
        </button>
      </div>
      <div class="tooltip tooltip-bottom" data-tip="Zoom Out">
        <button class="btn join-item btn-sm" data-testid="zoom-out" @click="emit('zoomOut')">
          <IconZoomOut style="font-size: 1.2em;" />
        </button>
      </div>
      <div class="tooltip tooltip-bottom" data-tip="Fit to Screen">
        <button class="btn join-item btn-sm" data-testid="zoom-fit" @click="emit('zoomToFit')">
          <IconFitScreen style="font-size: 1.2em;" />
        </button>
      </div>
    </div>
    <div class="dropdown dropdown-bottom">
      <div class="tooltip tooltip-bottom" data-tip="Auto Layout">
        <button class="btn btn-sm shadow-lg" style="font-size: 1.2em;" data-testid="layout-dropdown">
          <IconLayout />
        </button>
      </div>
      <ul class="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-52 z-50">
        <li v-for="opt in layoutOptions" :key="opt.id">
          <button
            :class="{ active: currentLayout === opt.id }"
            @click="emit('applyLayout', opt.id)"
          >
            {{ opt.label }}
          </button>
        </li>
      </ul>
    </div>
    <EditorExtensionButton :open="extensionsOpen" @toggle="emit('toggleExtensions')" />
  </div>
</template>
