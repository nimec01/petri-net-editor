<script setup lang="ts">
import type { IPetriNet } from '~/types/petri-net-core';
import type { NetAnalysis } from '~/utils/petri-net-analysis';
import ExtensionAnalysisControls from '~/components/extension/AnalysisControls.vue';
import { analyzePetriNet, normalizeLimit } from '~/utils/petri-net-analysis';
import { DEFAULT_REACHABILITY_LIMIT } from '~/utils/reachability-graph';

const { petriNet } = defineProps<{
  petriNet: IPetriNet;
}>();

const limit = ref(DEFAULT_REACHABILITY_LIMIT);
const result = ref<NetAnalysis | null>(null);

const violatingArcs = computed(() => result.value?.safeness.weights.arcs.filter(arc => arc.weight >= 2) ?? []);

function run() {
  limit.value = normalizeLimit(limit.value);
  result.value = analyzePetriNet(petriNet, limit.value);
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-lg font-semibold">Safeness</span>
        <span v-if="result && result.safeness.allPlacesSafe && result.safeness.weights.allSmall" class="badge badge-success">
          Net is safe
        </span>
        <span v-else-if="result" class="badge badge-error">
          Net is not safe
        </span>
      </div>
      <p class="text-sm opacity-70">
        A place is safe if it never holds more than one token in any reachable marking. A net is safe if all places are safe and all arc weights are smaller than 2.
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
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Place</th>
              <th>Max tokens</th>
              <th>Safe</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="place in result.safeness.places" :key="place.id">
              <td class="font-mono">
                {{ place.label }}
              </td>
              <td>
                {{ place.maxTokens }}
              </td>
              <td>
                <span :class="place.safe ? 'badge badge-success badge-sm' : 'badge badge-error badge-sm'">
                  {{ place.safe ? 'Yes' : 'No' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="result.safeness.places.length === 0" class="text-sm opacity-60">
          No places in the net.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-semibold">Arc weights</span>
          <span v-if="result.safeness.weights.allSmall" class="badge badge-success badge-sm">
            All weights &lt; 2
          </span>
          <span v-else class="badge badge-error badge-sm">
            Weight ≥ 2 found
          </span>
        </div>
        <div v-if="violatingArcs.length > 0" class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Arc</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="arc in violatingArcs" :key="arc.id">
                <td class="font-mono">
                  {{ arc.sourceLabel }} → {{ arc.targetLabel }}
                </td>
                <td>
                  {{ arc.weight }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm opacity-60">
          All arc weights are 1 (smaller than 2).
        </p>
      </div>
    </template>
  </div>
</template>
