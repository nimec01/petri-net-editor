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

const witness = computed(() => {
  const analysis = result.value?.boundedness;
  return analysis?.provenUnbounded ? analysis.witness : null;
});

const placeOrder = computed(() => petriNet.getPlaces().map(place => place.id));

const placeOrderLabels = computed(() => {
  const labels = new Map<string, string>();
  for (const place of petriNet.getPlaces()) {
    labels.set(place.id, place.label);
  }
  return placeOrder.value.map(id => labels.get(id) ?? id);
});

function formatMarking(marking: Marking): string {
  return `(${placeOrder.value.map(id => marking[id] ?? 0).join(', ')})`;
}

function formatPath(marking: { path: { label: string }[] }): string {
  return marking.path.map(step => step.label).join(' → ');
}

function run() {
  limit.value = normalizeLimit(limit.value);
  result.value = analyzePetriNet(petriNet, limit.value);
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-lg font-semibold">Boundedness</span>
        <span v-if="result?.boundedness.provenUnbounded" class="badge badge-error">
          Unbounded
        </span>
        <span v-else-if="result && result.complete" class="badge badge-success">
          Bounded
        </span>
        <span v-else-if="result" class="badge badge-warning">
          Preliminary
        </span>
      </div>
      <p class="text-sm opacity-70">
        A net is bounded if every place has a finite token bound across all reachable markings. If a reachable marking dominates another reachable marking, tokens can be pumped forever and the net is unbounded.
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
      <div v-if="witness" class="flex flex-col gap-2">
        <div class="alert alert-error">
          <span>
            Unbounded &mdash; marking <span class="font-mono">{{ formatMarking(witness.larger.marking) }}</span> is reachable and dominates marking <span class="font-mono">{{ formatMarking(witness.smaller.marking) }}</span>. Firing the latter&apos;s sequence from the former adds tokens forever.
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Marking</th>
                <th>Firing sequence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ witness.smaller.nodeId }}</td>
                <td class="font-mono">
                  {{ formatMarking(witness.smaller.marking) }}
                </td>
                <td>
                  <span v-if="witness.smaller.path.length > 0" class="font-mono">{{ formatPath(witness.smaller) }}</span>
                  <span v-else class="opacity-60">(initial marking)</span>
                </td>
              </tr>
              <tr>
                <td>{{ witness.larger.nodeId }}</td>
                <td class="font-mono">
                  {{ formatMarking(witness.larger.marking) }}
                </td>
                <td>
                  <span v-if="witness.larger.path.length > 0" class="font-mono">{{ formatPath(witness.larger) }}</span>
                  <span v-else class="opacity-60">(initial marking)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex items-center gap-1 text-xs opacity-70">
          <span class="font-mono" :title="placeOrderLabels.join(', ')">Order: ({{ placeOrderLabels.join(', ') }})</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Place</th>
              <th>Max tokens</th>
              <th>Bounded</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="place in result.boundedness.places" :key="place.id">
              <td class="font-mono">
                {{ place.label }}
              </td>
              <td>
                {{ place.bounded ? place.maxTokens : '∞' }}
              </td>
              <td>
                <span :class="place.bounded ? 'badge badge-success badge-sm' : 'badge badge-error badge-sm'">
                  {{ place.bounded ? 'Yes' : 'No' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="result.boundedness.places.length === 0" class="text-sm opacity-60">
          No places in the net.
        </p>
      </div>

      <p v-if="!result.boundedness.provenUnbounded && !result.complete" class="text-sm opacity-60">
        The reachability graph was truncated, so these bounds are a lower bound. Increase the limit to explore more markings.
      </p>
    </template>
  </div>
</template>
