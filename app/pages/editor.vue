<script setup lang="ts">
import type { EditorMode, PetriNetState } from '~/types/petri-net';

const petriNet = usePetriNet();
provide('petriNet', petriNet);

const mode = petriNet.mode;
const selectedElement = petriNet.selectedElement;
const undoStack = petriNet.undoStack;
const redoStack = petriNet.redoStack;

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
              ⟲
            </button>
          </div>
          <div class="tooltip tooltip-bottom" data-tip="Redo (Ctrl+Shift+Z)">
            <button
              class="btn btn-sm join-item"
              :disabled="redoStack.length === 0"
              @click="petriNet.redo()"
            >
              ⟳
            </button>
          </div>
        </div>
      </div>
      <div class="navbar-end">
        <div class="join">
          <button class="btn btn-sm join-item" @click="handleImport">
            Load
          </button>
          <button class="btn btn-sm btn-primary join-item" @click="handleExport">
            Save
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
    </div>
  </div>
</template>
