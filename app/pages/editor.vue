<script setup lang="ts">
import type { EditorMode, PetriNetState } from '~/types/petri-net';
import IconUndo from '~icons/tabler/arrow-back-up';
import IconRedo from '~icons/tabler/arrow-forward-up';
import IconGithub from '~icons/tabler/brand-github';
import IconCheck from '~icons/tabler/check';
import IconPaste from '~icons/tabler/clipboard';
import IconCopy from '~icons/tabler/copy';
import IconSave from '~icons/tabler/device-floppy-filled';
import IconExternalLink from '~icons/tabler/external-link';
import IconLoad from '~icons/tabler/file-upload';
import IconKeyboard from '~icons/tabler/keyboard';
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

const { tabs, activeTabId, activeTab, splitViewId, splitViewTab, addTab, openReachabilityGraph, closeTab, duplicateTab, renameTab, switchTab, toggleSplitView } = useTabs();

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
const shortcutsModal = shallowRef<{ open: () => void; close: () => void } | null>(null);
const linkCopied = ref(false);

if (import.meta.client) {
  watch(() => activeTab.value.name, (name) => {
    document.title = `${name} — Petri Net Editor`;
  }, { immediate: true });
}

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

function handleClearNet() {
  if (activeTab.value.type !== 'petri-net')
    return;
  // eslint-disable-next-line no-alert
  if (!confirm('Are you sure you want to clear the entire Petri net?'))
    return;
  activeTab.value.petriNet.clearNet();
}

function handleCopy() {
  if (activeTab.value.type !== 'petri-net')
    return;
  activeTab.value.petriNet.copySelection();
}

function handlePaste() {
  if (activeTab.value.type !== 'petri-net')
    return;
  activeTab.value.petriNet.pasteClipboard();
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName)
    return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

const TOOL_SHORTCUTS: Record<string, EditorMode> = {
  1: 'select',
  2: 'place',
  3: 'transition',
  4: 'arc',
  5: 'token',
  6: 'delete',
};

function onEditorKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) {
    if (activeTab.value.type !== 'petri-net')
      return;
    const petriNet = activeTab.value.petriNet;
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
    if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      petriNet.zoomIn();
    }
    if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      petriNet.zoomOut();
    }
    if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      petriNet.zoomToFit();
    }
    if (isEditableTarget(e.target))
      return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      petriNet.copySelection();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      petriNet.pasteClipboard();
    }
    return;
  }
  if (isEditableTarget(e.target))
    return;

  if (e.key === '?') {
    e.preventDefault();
    shortcutsModal.value?.open();
    return;
  }

  if (e.key === 'Escape' && activeTab.value.type === 'petri-net') {
    const petriNet = activeTab.value.petriNet;
    if (petriNet.mode.value === 'fire') {
      petriNet.mode.value = 'select';
    } else {
      petriNet.closeProperties();
      petriNet.mode.value = 'select';
    }
    return;
  }

  if (e.key.toLowerCase() === 'f' && activeTab.value.type === 'petri-net') {
    e.preventDefault();
    const petriNet = activeTab.value.petriNet;
    petriNet.mode.value = petriNet.mode.value === 'fire' ? 'select' : 'fire';
    return;
  }

  const mode = TOOL_SHORTCUTS[e.key];
  if (mode) {
    e.preventDefault();
    if (activeTab.value.type === 'petri-net') {
      activeTab.value.petriNet.mode.value = mode;
    }
    return;
  }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (activeTab.value.type !== 'petri-net')
      return;
    const petriNet = activeTab.value.petriNet;
    const selected = petriNet.selectedElement.value;
    if (selected) {
      e.preventDefault();
      petriNet.deleteElement(selected.id);
    }
  }
}

function handleShareLink() {
  if (activeTab.value.type !== 'petri-net')
    return;
  const url = activeTab.value.petriNet.shareLink();
  void navigator.clipboard.writeText(url);
  linkCopied.value = true;
  setTimeout(() => {
    linkCopied.value = false;
  }, 2000);
}

const activeTabJson = computed(() => {
  if (activeTab.value.type !== 'petri-net')
    return '';
  return JSON.stringify({ ...activeTab.value.petriNet.exportToJson(), title: activeTab.value.name }, null, 2);
});

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
  window.addEventListener('keydown', onEditorKeydown);
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEditorKeydown);
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
          <div class="tooltip tooltip-bottom" data-tip="Copy selection (Ctrl+C)">
            <button
              class="btn btn-sm join-item"
              :disabled="activeTab.type !== 'petri-net' || activeTab.petriNet.selectedElement.value == null"
              data-testid="copy"
              @click="handleCopy"
            >
              <IconCopy />
            </button>
          </div>
          <div class="tooltip tooltip-bottom" data-tip="Paste (Ctrl+V)">
            <button
              class="btn btn-sm join-item"
              :disabled="activeTab.type !== 'petri-net' || activeTab.petriNet.clipboard.value == null"
              data-testid="paste"
              @click="handlePaste"
            >
              <IconPaste />
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
            <IconExternalLink />
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
        <button
          class="btn btn-sm btn-ghost ml-2"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
          data-testid="shortcuts-toggle"
          @click="shortcutsModal?.open()"
        >
          <IconKeyboard />
        </button>
      </div>
    </div>

    <EditorTabsBar
      :tabs="tabs"
      :active-tab-id="activeTabId"
      :split-view-id="splitViewId"
      @switch="switchTab"
      @close="closeTab"
      @add="addTab"
      @duplicate="duplicateTab"
      @rename="(id, name) => renameModal?.open(id, name)"
      @split="toggleSplitView"
    />

    <ClientOnly>
      <div class="flex-1 min-h-0 flex">
        <div
          class="h-full overflow-hidden"
          :class="splitViewTab ? 'flex-1 min-w-0 border-r border-base-300' : 'w-full'"
        >
          <template v-for="(tab, index) in tabs" :key="tab.id">
            <div v-if="tab.id !== splitViewId" v-show="tab.id === activeTabId" class="h-full">
              <EditorTabContent
                :tab="tab"
                :load-from-url="index === 0 && tab.id !== splitViewId"
              />
            </div>
          </template>
        </div>

        <div v-if="splitViewTab" class="flex-1 min-w-0 h-full overflow-hidden">
          <EditorTabContent
            :tab="splitViewTab"
          />
        </div>
      </div>
    </ClientOnly>

    <EditorExportModal
      v-if="activeTab.type === 'petri-net'"
      ref="exportModal"
      :json="() => activeTabJson"
    />
    <EditorImportModal ref="importModal" @import="handleImportData" />
    <EditorRenameModal ref="renameModal" @rename="(name) => renameTab(activeTab.id, name)" />
    <EditorShortcutsModal ref="shortcutsModal" />
  </div>
</template>
