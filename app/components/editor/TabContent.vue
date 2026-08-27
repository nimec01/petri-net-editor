<script setup lang="ts">
import type { Tab } from '~/composables/useTabs';
import type { ExtensionContext } from '~/types/extension';
import type { EditorMode } from '~/types/petri-net';

const props = defineProps<{
  tab: Tab;
  loadFromUrl?: boolean;
}>();

const tabId = computed(() => props.tab.id);

const petriNet = computed(() => props.tab.type === 'petri-net' ? props.tab.petriNet : null);
const extensions = computed(() => props.tab.type === 'petri-net' ? props.tab.extensions : null);

const placeLabels = computed(() => {
  const labels: Record<string, string> = {};
  if (!petriNet.value)
    return labels;
  const pn = petriNet.value.petriNet.value;
  if (!pn)
    return labels;
  for (const p of pn.getPlaces()) {
    labels[p.id] = p.label;
  }
  return labels;
});

function handleExtensionSelect(id: string) {
  if (!petriNet.value || !extensions.value)
    return;
  const net = petriNet.value.petriNet.value;
  const cy = petriNet.value.cy.value;
  if (!net || !cy)
    return;
  const ctx: ExtensionContext = { net, cy };
  extensions.value.openExtension(id, ctx);
}

function setMode(m: EditorMode) {
  if (!petriNet.value)
    return;
  petriNet.value.mode.value = m;
}
</script>

<template>
  <div class="h-full relative overflow-hidden flex flex-col">
    <template v-if="tab.type === 'petri-net'">
      <EditorExtensionDrawer
        :open="extensions!.drawerOpen.value"
        :extensions="extensions!.extensions.value"
        :drawer-id="`extensions-drawer-${tabId}`"
        class="flex-1 min-h-0"
        @select="handleExtensionSelect"
        @close="extensions!.drawerOpen.value = false"
      >
        <div class="h-full relative overflow-hidden">
          <EditorCanvas :petri-net="petriNet!" :load-from-url="loadFromUrl" />
        </div>
      </EditorExtensionDrawer>

      <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <EditorToolbar
          :active-mode="petriNet!.mode.value"
          :current-layout="petriNet!.layoutType.value"
          :extensions-open="extensions!.drawerOpen.value"
          @update:active-mode="setMode"
          @zoom-in="petriNet!.zoomIn()"
          @zoom-out="petriNet!.zoomOut()"
          @zoom-to-fit="petriNet!.zoomToFit()"
          @apply-layout="(type) => petriNet!.applyLayout(type)"
          @toggle-extensions="extensions!.toggleDrawer()"
        />
      </div>

      <div class="absolute top-4 right-4 z-10">
        <EditorPropertiesPanel
          :element="petriNet!.selectedElement.value"
          @update-label="(id, label) => petriNet!.setLabel(id, label)"
          @update-tokens="(id, tokens) => petriNet!.setTokens(id, tokens)"
          @update-weight="(id, weight) => petriNet!.setWeight(id, weight)"
          @delete="(id) => petriNet!.deleteElement(id)"
          @close="petriNet!.closeProperties()"
        />
      </div>

      <div v-if="petriNet!.mode.value === 'fire'" class="absolute top-4 left-4 z-10">
        <EditorFireHistory
          :history="petriNet!.firingHistory.value"
          :place-labels="placeLabels"
          :auto-firing="petriNet!.autoFiring.value"
          :auto-fire-speed="petriNet!.autoFireSpeed.value"
          @clear="petriNet!.clearHistory()"
          @revert="petriNet!.revertLastFiring()"
          @jump="(id) => petriNet!.jumpToState(id)"
          @toggle-auto-fire="petriNet!.toggleAutoFire()"
          @auto-fire-n="(n) => petriNet!.autoFireN(n)"
          @update:auto-fire-speed="(s) => petriNet!.setAutoFireSpeed(s)"
        />
      </div>
    </template>

    <EditorReachabilityGraphTab
      v-if="tab.type === 'reachability-graph'"
      :petri-net-state="tab.petriNetState"
    />

    <EditorExtensionModal
      :extension="extensions?.activeExtension.value ?? null"
      :result="extensions?.resultComponent.value ?? null"
      @close="extensions?.closeExtension()"
    />
  </div>
</template>
