<script setup lang="ts">
import type { EditorMode, PetriNetState } from '~/types/petri-net';
import IconUndo from '~icons/tabler/arrow-back-up';
import IconRedo from '~icons/tabler/arrow-forward-up';
import IconSave from '~icons/tabler/device-floppy-filled';
import IconLoad from '~icons/tabler/file-upload';
import IconTrash from '~icons/tabler/trash';

const petriNet = usePetriNet();
provide('petriNet', petriNet);

const mode = petriNet.mode;
const selectedElement = petriNet.selectedElement;
const undoStack = petriNet.undoStack;
const redoStack = petriNet.redoStack;
const firingHistory = petriNet.firingHistory;
const autoFiring = petriNet.autoFiring;
const autoFireSpeed = petriNet.autoFireSpeed;
const isNetEmpty = petriNet.isNetEmpty;

const placeLabels = computed(() => {
  const labels: Record<string, string> = {};
  const pn = petriNet.petriNet.value;
  if (!pn)
    return labels;
  for (const p of pn.getPlaces()) {
    labels[p.id] = p.label;
  }
  return labels;
});

function handleExport() {
  const state = petriNet.exportToJson();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'petri-net.json';
  a.click();
  URL.revokeObjectURL(url);
}

function setMode(m: EditorMode) {
  mode.value = m;
}

function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file)
      return;
    const text = await file.text();
    const state = JSON.parse(text) as PetriNetState;
    petriNet.importFromJson(state);
  };
  input.click();
}

function handleClearNet() {
  // eslint-disable-next-line no-alert
  if (!confirm('Are you sure you want to clear the entire Petri net?'))
    return;
  petriNet.clearNet();
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (!isNetEmpty.value) {
    e.preventDefault();
  }
}

onMounted(() => {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      petriNet.undo();
    }
    if (e.ctrlKey && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      petriNet.redo();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      petriNet.redo();
    }
  });
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<template>
  <div class="flex flex-col h-screen">
    <div class="navbar bg-base-200 shadow-md px-4">
      <div class="navbar-start">
        <span class="text-lg font-bold">Petri Net Editor</span>
      </div>
      <div class="navbar-center">
        <div class="join">
          <div class="tooltip tooltip-bottom" data-tip="Undo (Ctrl+Z)">
            <button
              class="btn btn-sm join-item"
              :disabled="undoStack.length === 0"
              @click="petriNet.undo()"
            >
              <IconUndo />
            </button>
          </div>
          <div class="tooltip tooltip-bottom" data-tip="Redo (Ctrl+Shift+Z)">
            <button
              class="btn btn-sm join-item"
              :disabled="redoStack.length === 0"
              @click="petriNet.redo()"
            >
              <IconRedo />
            </button>
          </div>
        </div>
      </div>
      <div class="navbar-end">
        <div class="join">
          <div class="tooltip tooltip-bottom" data-tip="Clear net">
            <button
              class="btn btn-sm btn-error join-item"
              :disabled="isNetEmpty"
              @click="handleClearNet"
            >
              <IconTrash />
            </button>
          </div>
          <button class="btn btn-sm join-item" @click="handleImport">
            Load <IconLoad />
          </button>
          <button class="btn btn-sm btn-primary join-item" @click="handleExport">
            Save <IconSave />
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 relative overflow-hidden">
      <ClientOnly>
        <EditorCanvas />
      </ClientOnly>

      <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <ClientOnly>
          <EditorToolbar
            :active-mode="mode"
            @update:active-mode="setMode"
            @zoom-in="petriNet.zoomIn()"
            @zoom-out="petriNet.zoomOut()"
            @zoom-to-fit="petriNet.zoomToFit()"
          />
        </ClientOnly>
      </div>

      <div class="absolute top-4 right-4 z-10">
        <ClientOnly>
          <EditorPropertiesPanel
            :element="selectedElement"
            @update-label="(id, label) => petriNet.setLabel(id, label)"
            @update-tokens="(id, tokens) => petriNet.setTokens(id, tokens)"
            @delete="(id) => petriNet.deleteElement(id)"
            @close="petriNet.closeProperties()"
          />
        </ClientOnly>
      </div>

      <div v-if="mode === 'fire'" class="absolute top-4 left-4 z-10">
        <ClientOnly>
          <EditorFireHistory
            :history="firingHistory"
            :place-labels="placeLabels"
            :auto-firing="autoFiring"
            :auto-fire-speed="autoFireSpeed"
            @clear="petriNet.clearHistory()"
            @revert="petriNet.revertLastFiring()"
            @jump="(id) => petriNet.jumpToState(id)"
            @toggle-auto-fire="petriNet.toggleAutoFire()"
            @auto-fire-n="(n) => petriNet.autoFireN(n)"
            @update:auto-fire-speed="(s) => petriNet.setAutoFireSpeed(s)"
          />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>
