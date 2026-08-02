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

function run() {
  limit.value = normalizeLimit(limit.value);
  result.value = analyzePetriNet(petriNet, limit.value);
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-lg font-semibold">Deadlock</span>
        <span v-if="result?.deadlock.exists" class="badge badge-error">
          Deadlock reachable
        </span>
        <span v-else-if="result" class="badge badge-success">
          No deadlock found
        </span>
      </div>
      <p class="text-sm opacity-70">
        A deadlock is a reachable marking where no transition is enabled. The firing sequence shows how to reach it.
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
        <div v-if="result.deadlock.exists" class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Marking</th>
                <th>Firing sequence</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="deadlock in result.deadlock.deadlocks" :key="deadlock.nodeId">
                <td>{{ deadlock.nodeId }}</td>
                <td class="font-mono">
                  {{ formatMarking(deadlock.marking) }}
                </td>
                <td>
                  <span v-if="deadlock.path.length > 0" class="font-mono">{{ deadlock.path.map(step => step.label).join(' → ') }}</span>
                  <span v-else class="opacity-60">(initial marking)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm opacity-60">
          No deadlock markings among the explored reachable markings.
        </p>
      </div>
    </template>
  </div>
</template>
