<script setup lang="ts">
import type { Core } from 'cytoscape';
import type { IPetriNet, Marking } from '~/types/petri-net-core';
import type { ReachabilityGraphBuilder } from '~/utils/reachability-graph';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import IconPlus from '~icons/tabler/plus';
import IconRefresh from '~icons/tabler/refresh';
import { createReachabilityGraphBuilder, DEFAULT_REACHABILITY_LIMIT } from '~/utils/reachability-graph';

const { petriNet } = defineProps<{
  petriNet: IPetriNet;
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

const placeOrder = computed(() => petriNet.getPlaces().map(place => place.id));

function placeLabels(): Map<string, string> {
  const labels = new Map<string, string>();
  for (const place of petriNet.getPlaces()) {
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
  builder.value = createReachabilityGraphBuilder(petriNet, Math.max(1, Math.floor(limitInput.value)));
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
  <div class="flex flex-col gap-4 w-full">
    <div class="stats stats-vertical sm:stats-horizontal w-full">
      <div class="stat">
        <div class="stat-title">
          Markings
        </div>
        <div class="stat-value">
          {{ nodeCount }}
        </div>
      </div>
      <div class="stat">
        <div class="stat-title">
          Firings
        </div>
        <div class="stat-value">
          {{ edgeCount }}
        </div>
      </div>
      <div class="stat">
        <div class="stat-title">
          Max depth
        </div>
        <div class="stat-value">
          {{ depth }}
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 flex-wrap">
      <span class="badge badge-ghost">Limit {{ limit }}</span>
      <span v-if="isComplete" class="badge badge-success">Complete</span>
      <span v-else class="badge badge-warning">Truncated</span>
    </div>

    <div class="flex items-center gap-3 flex-wrap text-xs opacity-70">
      <span class="font-mono" :title="placeOrderLabels.join(', ')">Order: ({{ placeOrderLabels.join(', ') }})</span>
      <span class="flex items-center gap-1">
        <span class="inline-block w-3 h-3 rounded-sm bg-[#fee2e2] border-2 border-[#dc2626]" />
        Deadlock
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block w-3 h-3 rounded-sm bg-[#ffffff] border-2 border-[#2563eb]" />
        Initial
      </span>
    </div>

    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-sm opacity-60">Max markings</span>
      <input
        v-model.number="limitInput"
        type="number"
        min="1"
        class="input input-sm w-28"
        @keydown.enter="generate"
      >
      <button class="btn btn-sm btn-primary" @click="generate">
        <IconRefresh />
        Generate
      </button>
      <span class="text-sm opacity-60">Add</span>
      <input
        v-model.number="moreInput"
        type="number"
        min="1"
        class="input input-sm w-20"
        :disabled="!canExpandMore"
        @keydown.enter="generateMore"
      >
      <button class="btn btn-sm" :disabled="!canExpandMore" @click="generateMore">
        <IconPlus />
        More markings
      </button>
    </div>

    <div ref="containerRef" class="w-full h-120 rounded-box bg-base-100 border border-base-300" />
  </div>
</template>
