<script setup lang="ts">
import type { ExtensionContext } from '~/types/extension';
import type { EditorMode, PetriNetState } from '~/types/petri-net';
import IconUndo from '~icons/tabler/arrow-back-up';
import IconRedo from '~icons/tabler/arrow-forward-up';
import IconGithub from '~icons/tabler/brand-github';
import IconCheck from '~icons/tabler/check';
import IconSave from '~icons/tabler/device-floppy-filled';
import IconLoad from '~icons/tabler/file-upload';
import IconLink from '~icons/tabler/link';
import IconTrash from '~icons/tabler/trash';
import boundednessExtension from '~/extensions/boundedness';
import deadlockExtension from '~/extensions/deadlock';
import livenessExtension from '~/extensions/liveness';
import mathNotationExtension from '~/extensions/math-notation';
import reachabilityExtension from '~/extensions/reachability';
import reachabilityGraphExtension from '~/extensions/reachability-graph';
import safenessExtension from '~/extensions/safeness';
import { version } from '../../package.json';

const petriNet = usePetriNet();
provide('petriNet', petriNet);

const githubUrl = 'https://github.com/nimec01/petri-net-editor';
const releaseUrl = `${githubUrl}/releases`;

const mode = petriNet.mode;
const selectedElement = petriNet.selectedElement;
const undoStack = petriNet.undoStack;
const redoStack = petriNet.redoStack;
const firingHistory = petriNet.firingHistory;
const autoFiring = petriNet.autoFiring;
const autoFireSpeed = petriNet.autoFireSpeed;
const isNetEmpty = petriNet.isNetEmpty;
const layoutType = petriNet.layoutType;

const exportModal = shallowRef<{ open: () => void; close: () => void } | null>(null);
const importModal = shallowRef<{ open: () => void; close: () => void } | null>(null);
const linkCopied = ref(false);

const {
  extensions: extensionList,
  drawerOpen: extensionDrawerOpen,
  activeExtension,
  resultComponent,
  openExtension,
  closeExtension,
  toggleDrawer: toggleExtensionDrawer,
  register,
} = useExtensions();

register(mathNotationExtension);
register(reachabilityGraphExtension);
register(reachabilityExtension);
register(boundednessExtension);
register(livenessExtension);
register(deadlockExtension);
register(safenessExtension);

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
  exportModal.value?.open();
}

function handleImport() {
  importModal.value?.open();
}

function handleImportData(state: PetriNetState) {
  petriNet.importFromJson(state);
}

function setMode(m: EditorMode) {
  mode.value = m;
}

function handleClearNet() {
  // eslint-disable-next-line no-alert
  if (!confirm('Are you sure you want to clear the entire Petri net?'))
    return;
  petriNet.clearNet();
}

function handleExtensionSelect(id: string) {
  const net = petriNet.petriNet.value;
  const cy = petriNet.cy.value;
  if (!net || !cy)
    return;
  const ctx: ExtensionContext = { net, cy };
  openExtension(id, ctx);
}

async function handleShareLink() {
  const url = petriNet.shareLink();
  await navigator.clipboard.writeText(url);
  linkCopied.value = true;
  setTimeout(() => {
    linkCopied.value = false;
  }, 2000);
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (!isNetEmpty.value) {
    e.preventDefault();
  }
}

onMounted(() => {
  if (import.meta.dev) {
    window.__PETRI_NET_DEBUG__ = petriNet;
  }
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
        <a
          class="badge badge-sm badge-primary ml-2"
          :href="releaseUrl"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="version-badge"
          :title="`View v${version} release`"
        >
          v{{ version }}
        </a>
      </div>
      <div class="navbar-center">
        <div class="join">
          <div class="tooltip tooltip-bottom" data-tip="Undo (Ctrl+Z)">
            <button
              class="btn btn-sm join-item"
              :disabled="undoStack.length === 0"
              data-testid="undo"
              @click="petriNet.undo()"
            >
              <IconUndo />
            </button>
          </div>
          <div class="tooltip tooltip-bottom" data-tip="Redo (Ctrl+Shift+Z)">
            <button
              class="btn btn-sm join-item"
              :disabled="redoStack.length === 0"
              data-testid="redo"
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
              data-testid="clear-net"
              @click="handleClearNet"
            >
              <IconTrash />
            </button>
          </div>
          <button class="btn btn-sm join-item" data-testid="load" @click="handleImport">
            Load <IconLoad />
          </button>
          <div class="tooltip tooltip-bottom" data-tip="Copy shareable link">
            <button
              class="btn btn-sm join-item"
              :disabled="isNetEmpty"
              data-testid="share"
              @click="handleShareLink"
            >
              <component :is="linkCopied ? IconCheck : IconLink" />
            </button>
          </div>
          <button class="btn btn-sm btn-primary join-item" data-testid="save" @click="handleExport">
            Save <IconSave />
          </button>
        </div>
        <a
          class="btn btn-sm btn-ghost ml-2"
          :href="githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
          title="GitHub repository"
          data-testid="github-link"
        >
          <IconGithub />
        </a>
      </div>
    </div>

    <ClientOnly>
      <EditorExtensionDrawer
        :open="extensionDrawerOpen"
        :extensions="extensionList"
        @select="handleExtensionSelect"
        @close="extensionDrawerOpen = false"
      >
        <div class="h-full relative overflow-hidden">
          <EditorCanvas />

          <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <EditorToolbar
              :active-mode="mode"
              :current-layout="layoutType"
              :extensions-open="extensionDrawerOpen"
              @update:active-mode="setMode"
              @zoom-in="petriNet.zoomIn()"
              @zoom-out="petriNet.zoomOut()"
              @zoom-to-fit="petriNet.zoomToFit()"
              @apply-layout="(type) => petriNet.applyLayout(type)"
              @toggle-extensions="toggleExtensionDrawer"
            />
          </div>

          <div class="absolute top-4 right-4 z-10">
            <EditorPropertiesPanel
              :element="selectedElement"
              @update-label="(id, label) => petriNet.setLabel(id, label)"
              @update-tokens="(id, tokens) => petriNet.setTokens(id, tokens)"
              @update-weight="(id, weight) => petriNet.setWeight(id, weight)"
              @delete="(id) => petriNet.deleteElement(id)"
              @close="petriNet.closeProperties()"
            />
          </div>

          <div v-if="mode === 'fire'" class="absolute top-4 left-4 z-10">
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
          </div>
        </div>
      </EditorExtensionDrawer>
    </ClientOnly>

    <EditorExportModal ref="exportModal" :json="() => JSON.stringify(petriNet.exportToJson(), null, 2)" />
    <EditorImportModal ref="importModal" @import="handleImportData" />
    <EditorExtensionModal
      :extension="activeExtension"
      :result="resultComponent"
      @close="closeExtension"
    />
  </div>
</template>
