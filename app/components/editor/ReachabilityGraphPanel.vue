<script setup lang="ts">
import type { Core } from 'cytoscape';
import type { PetriNetState } from '~/types/petri-net';
import type { Marking } from '~/types/petri-net-core';
import type { ReachabilityGraphBuilder } from '~/utils/reachability-graph';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import IconPlus from '~icons/tabler/plus';
import IconRefresh from '~icons/tabler/refresh';
import IconX from '~icons/tabler/x';
import { StatePetriNet } from '~/types/state-petri-net';
import { createReachabilityGraphBuilder, DEFAULT_REACHABILITY_LIMIT } from '~/utils/reachability-graph';

const { petriNetState } = defineProps<{
  petriNetState: PetriNetState;
}>();

const emit = defineEmits<{
  close: [];
}>();

cytoscape.use(dagre);

const containerRef = ref<HTMLElement | null>(null);
const cyRef = shallowRef<Core | null>(null);
const builder = shallowRef<ReachabilityGraphBuilder | null>(null);
const limitInput = ref(DEFAULT_REACHABILITY_LIMIT);
const moreInput = ref(100);

const graph = computed(() => builder.value?.graph ?? { nodes: [], edges: [] });
const nodeCount = computed(() => builder.value?.nodeCount ?? 0);
const edgeCount = computed(() => builder.value?.edgeCount ?? 0);
const depth = computed(() => builder.value?.maxDepth ?? 0);
const limit = computed(() => builder.value?.limit ?? 0);
const isComplete = computed(() => builder.value?.isComplete ?? false);
const canExpandMore = computed(() => !!builder.value && !builder.value.isComplete);

const petriNet = computed(() => new StatePetriNet(petriNetState));

const placeOrder = computed(() => petriNet.value.getPlaces().map(place => place.id));

function placeLabels(): Map<string, string> {
  const labels = new Map<string, string>();
  for (const place of petriNet.value.getPlaces()) {
    labels.set(place.id, place.label);
  }
  return labels;
}

const placeOrderLabels = computed(() => {
  const labels = placeLabels();
  return placeOrder.value.map(id => labels.get(id) ?? id);
});

function formatMarking(marking: Marking, orderedPlaceIds: string[]): string {
  return `(${orderedPlaceIds.map(id => marking[id] ?? 0).join(', ')})`;
}

const graphStylesheet: cytoscape.StylesheetJson = [
  {
    selector: 'node',
    style: {
      'shape': 'round-rectangle',
      'background-color': '#f3f4f6',
      'border-color': '#6b7280',
      'border-width': 1,
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': '170px',
      'font-size': '10px',
      'color': '#1f2937',
      'width': 'data(width)',
      'height': 'data(height)',
    },
  },
  {
    selector: 'node.initial',
    style: {
      'background-color': '#ffffff',
      'border-color': '#2563eb',
      'border-width': 3,
    },
  },
  {
    selector: 'node.deadlock',
    style: {
      'background-color': '#fee2e2',
      'border-color': '#dc2626',
      'border-width': 3,
    },
  },
  {
    selector: 'edge',
    style: {
      'width': 1.5,
      'line-color': '#9ca3af',
      'target-arrow-color': '#9ca3af',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.9,
      'curve-style': 'bezier',
      'label': 'data(label)',
      'text-rotation': 'autorotate',
      'font-size': '9px',
      'color': '#4b5563',
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.8,
      'text-background-padding': '1px',
    },
  },
];

function renderGraph() {
  const cy = cyRef.value;
  if (!cy) {
    return;
  }
  cy.resize();
  cy.elements().remove();

  const orderedPlaceIds = placeOrder.value;
  const data = graph.value;

  const nodes: cytoscape.ElementDefinition[] = data.nodes.map((node) => {
    const label = formatMarking(node.marking, orderedPlaceIds);
    const width = Math.min(190, Math.max(56, label.length * 6 + 16));
    const classes = [
      node.id === 0 ? 'initial' : '',
      node.deadlock ? 'deadlock' : '',
    ].filter(Boolean).join(' ');
    return {
      group: 'nodes',
      data: {
        id: `m${node.id}`,
        label,
        width,
        height: 34,
        depth: node.depth,
        deadlock: node.deadlock,
      },
      classes,
    };
  });
  const edges: cytoscape.ElementDefinition[] = data.edges.map(edge => ({
    group: 'edges',
    data: {
      id: `e${edge.id}`,
      source: `m${edge.source}`,
      target: `m${edge.target}`,
      label: edge.transitionLabel,
    },
  }));

  cy.add(nodes);
  cy.add(edges);
  cy.layout({
    name: 'dagre',
    rankDir: 'TB',
    nodeSep: 40,
    rankSep: 70,
    animate: false,
  } as cytoscape.LayoutOptions).run();
  cy.fit(undefined, 40);
}

function generate() {
  builder.value = createReachabilityGraphBuilder(petriNet.value, Math.max(1, Math.floor(limitInput.value)));
  builder.value.expandTo(builder.value.limit);
  triggerRef(builder);
  renderGraph();
}

function generateMore() {
  const current = builder.value;
  if (!current || current.isComplete) {
    return;
  }
  current.expandMore(Math.max(1, Math.floor(moreInput.value)));
  triggerRef(builder);
  renderGraph();
}

watch(() => petriNetState, () => {
  generate();
}, { deep: true });

onMounted(() => {
  if (!containerRef.value) {
    return;
  }
  const instance = cytoscape({
    container: containerRef.value,
    style: graphStylesheet,
    minZoom: 0.05,
    maxZoom: 4,
    selectionType: 'single',
  });
  cyRef.value = instance;
  generate();
});

onBeforeUnmount(() => {
  cyRef.value?.destroy();
  cyRef.value = null;
});
</script>

<template>
  <div class="flex h-full border-l border-base-300">
    <div class="flex flex-col gap-3 p-3 w-64 shrink-0 border-r border-base-300 overflow-y-auto bg-base-200/50">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold">
          Reachability Graph
        </h3>
        <button class="btn btn-ghost btn-xs" title="Close panel" @click="emit('close')">
          <IconX class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="stats stats-vertical stats-sm w-full">
        <div class="stat py-1">
          <div class="stat-title text-xs">
            Markings
          </div>
          <div class="stat-value text-lg">
            {{ nodeCount }}
          </div>
        </div>
        <div class="stat py-1">
          <div class="stat-title text-xs">
            Firings
          </div>
          <div class="stat-value text-lg">
            {{ edgeCount }}
          </div>
        </div>
        <div class="stat py-1">
          <div class="stat-title text-xs">
            Max depth
          </div>
          <div class="stat-value text-lg">
            {{ depth }}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <span class="badge badge-ghost badge-sm">Limit {{ limit }}</span>
        <span v-if="isComplete" class="badge badge-success badge-sm">Complete</span>
        <span v-else class="badge badge-warning badge-sm">Truncated</span>
      </div>

      <div class="flex items-center gap-2 flex-wrap text-xs opacity-70">
        <span class="font-mono" :title="placeOrderLabels.join(', ')">({{ placeOrderLabels.join(', ') }})</span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-2.5 h-2.5 rounded-sm bg-[#fee2e2] border-2 border-[#dc2626]" />
          Deadlock
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-2.5 h-2.5 rounded-sm bg-[#ffffff] border-2 border-[#2563eb]" />
          Initial
        </span>
      </div>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center gap-1.5">
          <span class="text-xs opacity-60">Max</span>
          <input
            v-model.number="limitInput"
            type="number"
            min="1"
            class="input input-xs w-20"
            @keydown.enter="generate"
          >
        </div>
        <button class="btn btn-xs btn-primary" @click="generate">
          <IconRefresh class="w-3 h-3" />
          Generate
        </button>
      </div>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center gap-1.5">
          <span class="text-xs opacity-60">Add</span>
          <input
            v-model.number="moreInput"
            type="number"
            min="1"
            class="input input-xs w-16"
            :disabled="!canExpandMore"
            @keydown.enter="generateMore"
          >
        </div>
        <button class="btn btn-xs" :disabled="!canExpandMore" @click="generateMore">
          <IconPlus class="w-3 h-3" />
          More
        </button>
      </div>
    </div>

    <div ref="containerRef" class="flex-1 h-full" />
  </div>
</template>
