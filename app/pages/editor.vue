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
import IconShare2 from '~icons/tabler/share-2';
import IconTrash from '~icons/tabler/trash';
import boundednessExtension from '~/extensions/boundedness';
import deadlockExtension from '~/extensions/deadlock';
import livenessExtension from '~/extensions/liveness';
import mathNotationExtension from '~/extensions/math-notation';
import reachabilityExtension from '~/extensions/reachability';
import reachabilityGraphExtension from '~/extensions/reachability-graph';
import safenessExtension from '~/extensions/safeness';
import { version } from '../../package.json';

const { tabs, activeTabId, activeTab, addTab, openReachabilityGraph, closeTab, duplicateTab, renameTab, switchTab } = useTabs();

for (const tab of tabs.value) {
  if (tab.type === 'petri-net') {
    tab.extensions.register(mathNotationExtension);
    tab.extensions.register(reachabilityGraphExtension);
    tab.extensions.register(reachabilityExtension);
    tab.extensions.register(boundednessExtension);
    tab.extensions.register(livenessExtension);
    tab.extensions.register(deadlockExtension);
    tab.extensions.register(safenessExtension);
  }
}

const githubUrl = 'https://github.com/nimec01/petri-net-editor';
const releaseUrl = `${githubUrl}/releases`;

const exportModal = shallowRef<{ open: () => void; close: () => void } | null>(null);
const importModal = shallowRef<{ open: () => void; close: () => void } | null>(null);
const renameModal = shallowRef<{ open: (id: string, name: string) => void; close: () => void } | null>(null);
const linkCopied = ref(false);

if (import.meta.client) {
  watch(() => activeTab.value.name, (name) => {
    document.title = `${name} — Petri Net Editor`;
  }, { immediate: true });
}

const placeLabels = computed(() => {
  const labels: Record<string, string> = {};
  if (activeTab.value.type !== 'petri-net')
    return labels;
  const pn = activeTab.value.petriNet.petriNet.value;
  if (!pn)
    return labels;
  for (const p of pn.getPlaces()) {
    labels[p.id] = p.label;
  }
  return labels;
});

const activePetriNet = computed(() => activeTab.value.type === 'petri-net' ? activeTab.value.petriNet : null);
const activeExtensions = computed(() => activeTab.value.type === 'petri-net' ? activeTab.value.extensions : null);

function handleExport() {
  exportModal.value?.open();
}

function handleImport() {
  importModal.value?.open();
}

function handleImportData(state: PetriNetState) {
  if (activeTab.value.type !== 'petri-net')
    return;
  activeTab.value.petriNet.importFromJson(state);
  if (state.title) {
    renameTab(activeTab.value.id, state.title);
  }
}

function setMode(m: EditorMode) {
  if (activeTab.value.type !== 'petri-net')
    return;
  activeTab.value.petriNet.mode.value = m;
}

function handleClearNet() {
  if (activeTab.value.type !== 'petri-net')
    return;
  // eslint-disable-next-line no-alert
  if (!confirm('Are you sure you want to clear the entire Petri net?'))
    return;
  activeTab.value.petriNet.clearNet();
}

function handleExtensionSelect(id: string) {
  if (activeTab.value.type !== 'petri-net')
    return;
  const net = activeTab.value.petriNet.petriNet.value;
  const cy = activeTab.value.petriNet.cy.value;
  if (!net || !cy)
    return;
  const ctx: ExtensionContext = { net, cy };
  activeTab.value.extensions.openExtension(id, ctx);
}

async function handleShareLink() {
  if (activeTab.value.type !== 'petri-net')
    return;
  const url = activeTab.value.petriNet.shareLink();
  await navigator.clipboard.writeText(url);
  linkCopied.value = true;
  setTimeout(() => {
    linkCopied.value = false;
  }, 2000);
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  const hasContent = tabs.value.some(t => t.type === 'petri-net' && !t.petriNet.isNetEmpty.value);
  if (hasContent) {
    e.preventDefault();
  }
}

onMounted(() => {
  if (import.meta.dev) {
    window.__PETRI_NET_DEBUG__ = activeTab.value.type === 'petri-net' ? activeTab.value.petriNet : undefined;
  }

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (activeTab.value.type !== 'petri-net')
      return;
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
              :disabled="activeTab.type !== 'petri-net' || activeTab.petriNet.undoStack.value.length === 0"
              data-testid="undo"
              @click="activeTab.type === 'petri-net' && activeTab.petriNet.undo()"
            >
              <IconUndo />
            </button>
          </div>
          <div class="tooltip tooltip-bottom" data-tip="Redo (Ctrl+Shift+Z)">
            <button
              class="btn btn-sm join-item"
              :disabled="activeTab.type !== 'petri-net' || activeTab.petriNet.redoStack.value.length === 0"
              data-testid="redo"
              @click="activeTab.type === 'petri-net' && activeTab.petriNet.redo()"
            >
              <IconRedo />
            </button>
          </div>
        </div>
        <div
          v-if="activeTab.type === 'petri-net' && !activeTab.petriNet.isNetEmpty.value"
          class="tooltip tooltip-bottom ml-2"
          data-tip="Open Reachability Graph in new tab"
        >
          <button
            class="btn btn-sm btn-ghost"
            data-testid="open-reachability-graph"
            @click="openReachabilityGraph(activeTab.id)"
          >
            <IconShare2 />
            Reachability Graph
          </button>
        </div>
      </div>
      <div class="navbar-end">
        <template v-if="activeTab.type === 'petri-net'">
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
        </template>
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
      @rename="(id, name) => renameModal?.open(id, name)"
    />

    <ClientOnly>
      <div class="flex-1 min-h-0 relative">
        <EditorExtensionDrawer
          :open="activeTab.type === 'petri-net' && activeExtensions ? activeExtensions.drawerOpen.value : false"
          :extensions="activeTab.type === 'petri-net' && activeExtensions ? activeExtensions.extensions.value : []"
          class="h-full"
          @select="handleExtensionSelect"
          @close="activeExtensions && activeTab.type === 'petri-net' ? activeExtensions.drawerOpen.value = false : undefined"
        >
          <div class="h-full relative overflow-hidden">
            <template v-for="(tab, index) in tabs" :key="tab.id">
              <div v-if="tab.type === 'petri-net'" v-show="tab.id === activeTabId" class="absolute inset-0">
                <EditorCanvas :petri-net="tab.petriNet" :load-from-url="index === 0" />
              </div>
            </template>
          </div>
        </EditorExtensionDrawer>

        <template v-for="tab in tabs" :key="tab.id">
          <div v-if="tab.type === 'reachability-graph'" v-show="tab.id === activeTabId" class="absolute inset-0 h-full">
            <EditorReachabilityGraphTab :petri-net-state="tab.petriNetState" />
          </div>
        </template>

        <template v-if="activeTab.type === 'petri-net' && activePetriNet && activeExtensions">
          <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <EditorToolbar
              :active-mode="activePetriNet!.mode.value"
              :current-layout="activePetriNet!.layoutType.value"
              :extensions-open="activeExtensions!.drawerOpen.value"
              @update:active-mode="setMode"
              @zoom-in="activePetriNet!.zoomIn()"
              @zoom-out="activePetriNet!.zoomOut()"
              @zoom-to-fit="activePetriNet!.zoomToFit()"
              @apply-layout="(type) => activePetriNet!.applyLayout(type)"
              @toggle-extensions="activeExtensions!.toggleDrawer()"
            />
          </div>

          <div class="absolute top-4 right-4 z-10">
            <EditorPropertiesPanel
              :element="activePetriNet!.selectedElement.value"
              @update-label="(id, label) => activePetriNet!.setLabel(id, label)"
              @update-tokens="(id, tokens) => activePetriNet!.setTokens(id, tokens)"
              @update-weight="(id, weight) => activePetriNet!.setWeight(id, weight)"
              @delete="(id) => activePetriNet!.deleteElement(id)"
              @close="activePetriNet!.closeProperties()"
            />
          </div>

          <div v-if="activePetriNet!.mode.value === 'fire'" class="absolute top-4 left-4 z-10">
            <EditorFireHistory
              :history="activePetriNet!.firingHistory.value"
              :place-labels="placeLabels"
              :auto-firing="activePetriNet!.autoFiring.value"
              :auto-fire-speed="activePetriNet!.autoFireSpeed.value"
              @clear="activePetriNet!.clearHistory()"
              @revert="activePetriNet!.revertLastFiring()"
              @jump="(id) => activePetriNet!.jumpToState(id)"
              @toggle-auto-fire="activePetriNet!.toggleAutoFire()"
              @auto-fire-n="(n) => activePetriNet!.autoFireN(n)"
              @update:auto-fire-speed="(s) => activePetriNet!.setAutoFireSpeed(s)"
            />
          </div>
        </template>
      </div>
    </ClientOnly>

    <EditorExportModal
      v-if="activeTab.type === 'petri-net' && activePetriNet"
      ref="exportModal"
      :json="() => JSON.stringify({ ...activePetriNet!.exportToJson(), title: activeTab.name }, null, 2)"
    />
    <EditorImportModal ref="importModal" @import="handleImportData" />
    <EditorExtensionModal
      v-if="activeTab.type === 'petri-net' && activeExtensions"
      :extension="activeExtensions.activeExtension.value"
      :result="activeExtensions.resultComponent.value"
      @close="activeExtensions.closeExtension()"
    />
    <EditorRenameModal ref="renameModal" @rename="(name) => renameTab(activeTab.id, name)" />
  </div>
</template>
