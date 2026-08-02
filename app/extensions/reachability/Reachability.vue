<script setup lang="ts">
import type { IPetriNet, Marking } from '~/types/petri-net-core';
import type { NetAnalysis } from '~/utils/petri-net-analysis';
import ExtensionAnalysisControls from '~/components/extension/AnalysisControls.vue';
import { analyzePetriNet, normalizeLimit } from '~/utils/petri-net-analysis';
import { DEFAULT_REACHABILITY_LIMIT } from '~/utils/reachability-graph';

const { petriNet } = defineProps<{
  petriNet: IPetriNet;
}>();

const limit = ref(DEFAULT_REACHABILITY_LIMIT);
const result = ref<NetAnalysis | null>(null);
const targetTokens = ref<Marking>({});

const places = computed(() => petriNet.getPlaces());
const placeOrder = computed(() => places.value.map(place => place.id));

const placeOrderLabels = computed(() => {
  const labels = new Map<string, string>();
  for (const place of places.value) {
    labels.set(place.id, place.label);
  }
  return placeOrder.value.map(id => labels.get(id) ?? id);
});

function formatMarking(marking: Marking): string {
  return `(${placeOrder.value.map(id => marking[id] ?? 0).join(', ')})`;
}

function resetTargetFromMarking() {
  const marking = petriNet.getMarking();
  const tokens: Marking = {};
  for (const place of places.value) {
    tokens[place.id] = marking[place.id] ?? 0;
  }
  targetTokens.value = tokens;
}

function run() {
  limit.value = normalizeLimit(limit.value);
  const target: Marking = {};
  for (const place of places.value) {
    target[place.id] = Math.max(0, Math.floor(targetTokens.value[place.id] ?? 0));
  }
  result.value = analyzePetriNet(petriNet, limit.value, target);
}

onMounted(resetTargetFromMarking);
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-lg font-semibold">Reachability</span>
        <span v-if="result?.reachability.found" class="badge badge-success">
          Reachable
        </span>
        <span v-else-if="result && result.complete" class="badge badge-error">
          Not reachable
        </span>
        <span v-else-if="result" class="badge badge-warning">
          Not found yet
        </span>
      </div>
      <p class="text-sm opacity-70">
        Check whether a target marking can be reached from the initial marking. If it can, a firing sequence is shown.
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <span class="text-sm font-semibold">Target marking</span>
        <button class="btn btn-sm btn-ghost" @click="resetTargetFromMarking">
          Use current marking
        </button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <label v-for="place in places" :key="place.id" class="flex items-center gap-2">
          <span class="font-mono text-sm w-8">{{ place.label }}</span>
          <input
            v-model.number="targetTokens[place.id]"
            type="number"
            min="0"
            class="input input-sm w-full"
            @keydown.enter="run"
          >
        </label>
      </div>
      <p v-if="places.length === 0" class="text-sm opacity-60">
        No places in the net.
      </p>
    </div>

    <ExtensionAnalysisControls
      v-model:limit="limit"
      :node-count="result?.nodeCount ?? 0"
      :complete="result?.complete ?? false"
      :has-result="result !== null"
      @run="run"
    />

    <template v-if="result">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-1 text-xs opacity-70">
          <span class="font-mono" :title="placeOrderLabels.join(', ')">Order: ({{ placeOrderLabels.join(', ') }})</span>
        </div>

        <div v-if="result.reachability.found" class="alert alert-success">
          <span>
            Marking <span class="font-mono">{{ formatMarking(result.reachability.target) }}</span> is reachable.
          </span>
        </div>
        <div v-else-if="result.complete" class="alert alert-error">
          <span>
            Marking <span class="font-mono">{{ formatMarking(result.reachability.target) }}</span> is not reachable.
          </span>
        </div>
        <div v-else class="alert alert-warning">
          <span>
            Marking <span class="font-mono">{{ formatMarking(result.reachability.target) }}</span> was not found among the explored markings. Increase the limit for more certainty.
          </span>
        </div>

        <div v-if="result.reachability.found" class="flex flex-col gap-1">
          <span class="text-sm font-semibold">Firing sequence</span>
          <span v-if="result.reachability.path.length > 0" class="font-mono text-sm">
            {{ result.reachability.path.map(step => step.label).join(' → ') }}
          </span>
          <span v-else class="text-sm opacity-60">(already the initial marking)</span>
        </div>
      </div>
    </template>
  </div>
</template>
