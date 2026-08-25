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

const { tabs, activeTabId, activeTab, addTab, closeTab, duplicateTab, switchTab } = useTabs();

for (const tab of tabs.value) {
  tab.extensions.register(mathNotationExtension);
  tab.extensions.register(reachabilityGraphExtension);
  tab.extensions.register(reachabilityExtension);
  tab.extensions.register(boundednessExtension);
  tab.extensions.register(livenessExtension);
  tab.extensions.register(deadlockExtension);
  tab.extensions.register(safenessExtension);
}

const githubUrl = 'https://github.com/nimec01/petri-net-editor';
const releaseUrl = `${githubUrl}/releases`;

const exportModal = shallowRef<{ open: () => void; close: () => void } | null>(null);
const importModal = shallowRef<{ open: () => void; close: () => void } | null>(null);
const linkCopied = ref(false);

const placeLabels = computed(() => {
  const labels: Record<string, string> = {};
  const pn = activeTab.value.petriNet.petriNet.value;
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
  activeTab.value.petriNet.importFromJson(state);
}

function setMode(m: EditorMode) {
  activeTab.value.petriNet.mode.value = m;
}

function handleClearNet() {
  // eslint-disable-next-line no-alert
  if (!confirm('Are you sure you want to clear the entire Petri net?'))
    return;
  activeTab.value.petriNet.clearNet();
}

function handleExtensionSelect(id: string) {
  const net = activeTab.value.petriNet.petriNet.value;
  const cy = activeTab.value.petriNet.cy.value;
  if (!net || !cy)
    return;
  const ctx: ExtensionContext = { net, cy };
  activeTab.value.extensions.openExtension(id, ctx);
}

async function handleShareLink() {
  const url = activeTab.value.petriNet.shareLink();
  await navigator.clipboard.writeText(url);
  linkCopied.value = true;
  setTimeout(() => {
    linkCopied.value = false;
  }, 2000);
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  const hasContent = tabs.value.some(t => !t.petriNet.isNetEmpty.value);
  if (hasContent) {
    e.preventDefault();
  }
}

onMounted(() => {
  if (import.meta.dev) {
    window.__PETRI_NET_DEBUG__ = activeTab.value.petriNet;
  }

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      activeTab.value.petriNet.undo();
    }
    if (e.ctrlKey && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      activeTab.value.petriNet.redo();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      activeTab.value.petriNet.redo();
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
              :disabled="activeTab.petriNet.undoStack.value.length === 0"
              data-testid="undo"
              @click="activeTab.petriNet.undo()"
            >
              <IconUndo />
            </button>
          </div>
          <div class="tooltip tooltip-bottom" data-tip="Redo (Ctrl+Shift+Z)">
            <button
              class="btn btn-sm join-item"
              :disabled="activeTab.petriNet.redoStack.value.length === 0"
              data-testid="redo"
              @click="activeTab.petriNet.redo()"
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
              :disabled="activeTab.petriNet.isNetEmpty.value"
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
              :disabled="activeTab.petriNet.isNetEmpty.value"
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

    <EditorTabsBar
      :tabs="tabs"
      :active-tab-id="activeTabId"
      @switch="switchTab"
      @close="closeTab"
      @add="addTab"
      @duplicate="duplicateTab"
    />

    <ClientOnly>
      <EditorExtensionDrawer
        :open="activeTab.extensions.drawerOpen.value"
        :extensions="activeTab.extensions.extensions.value"
        @select="handleExtensionSelect"
        @close="activeTab.extensions.drawerOpen.value = false"
      >
        <div class="h-full relative overflow-hidden">
          <template v-for="(tab, index) in tabs" :key="tab.id">
            <div v-show="tab.id === activeTabId" class="absolute inset-0">
              <EditorCanvas :petri-net="tab.petriNet" :load-from-url="index === 0" />
            </div>
          </template>

          <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <EditorToolbar
              :active-mode="activeTab.petriNet.mode.value"
              :current-layout="activeTab.petriNet.layoutType.value"
              :extensions-open="activeTab.extensions.drawerOpen.value"
              @update:active-mode="setMode"
              @zoom-in="activeTab.petriNet.zoomIn()"
              @zoom-out="activeTab.petriNet.zoomOut()"
              @zoom-to-fit="activeTab.petriNet.zoomToFit()"
              @apply-layout="(type) => activeTab.petriNet.applyLayout(type)"
              @toggle-extensions="activeTab.extensions.toggleDrawer()"
            />
          </div>

          <div class="absolute top-4 right-4 z-10">
            <EditorPropertiesPanel
              :element="activeTab.petriNet.selectedElement.value"
              @update-label="(id, label) => activeTab.petriNet.setLabel(id, label)"
              @update-tokens="(id, tokens) => activeTab.petriNet.setTokens(id, tokens)"
              @update-weight="(id, weight) => activeTab.petriNet.setWeight(id, weight)"
              @delete="(id) => activeTab.petriNet.deleteElement(id)"
              @close="activeTab.petriNet.closeProperties()"
            />
          </div>

          <div v-if="activeTab.petriNet.mode.value === 'fire'" class="absolute top-4 left-4 z-10">
            <EditorFireHistory
              :history="activeTab.petriNet.firingHistory.value"
              :place-labels="placeLabels"
              :auto-firing="activeTab.petriNet.autoFiring.value"
              :auto-fire-speed="activeTab.petriNet.autoFireSpeed.value"
              @clear="activeTab.petriNet.clearHistory()"
              @revert="activeTab.petriNet.revertLastFiring()"
              @jump="(id) => activeTab.petriNet.jumpToState(id)"
              @toggle-auto-fire="activeTab.petriNet.toggleAutoFire()"
              @auto-fire-n="(n) => activeTab.petriNet.autoFireN(n)"
              @update:auto-fire-speed="(s) => activeTab.petriNet.setAutoFireSpeed(s)"
            />
          </div>
        </div>
      </EditorExtensionDrawer>
    </ClientOnly>

    <EditorExportModal ref="exportModal" :json="() => JSON.stringify(activeTab.petriNet.exportToJson(), null, 2)" />
    <EditorImportModal ref="importModal" @import="handleImportData" />
    <EditorExtensionModal
      :extension="activeTab.extensions.activeExtension.value"
      :result="activeTab.extensions.resultComponent.value"
      @close="activeTab.extensions.closeExtension()"
    />
  </div>
</template>
