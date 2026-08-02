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

function run() {
  limit.value = normalizeLimit(limit.value);
  result.value = analyzePetriNet(petriNet, limit.value);
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-lg font-semibold">Liveness</span>
        <span v-if="result?.liveness.allLive" class="badge badge-success">
          All transitions live
        </span>
        <span v-else-if="result" class="badge badge-error">
          Not all transitions live
        </span>
      </div>
      <p class="text-sm opacity-70">
        A transition is live if from every reachable marking it can eventually become enabled again.
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
              <th>Transition</th>
              <th>Potentially fireable</th>
              <th>Live</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transition in result.liveness.transitions" :key="transition.id">
              <td class="font-mono">
                {{ transition.label }}
              </td>
              <td>
                <span :class="transition.enabled ? 'badge badge-success badge-sm' : 'badge badge-error badge-sm'">
                  {{ transition.enabled ? 'Yes' : 'No' }}
                </span>
              </td>
              <td>
                <span :class="transition.live ? 'badge badge-success badge-sm' : 'badge badge-error badge-sm'">
                  {{ transition.live ? 'Yes' : 'No' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="result.liveness.transitions.length === 0" class="text-sm opacity-60">
          No transitions in the net.
        </p>
      </div>
    </template>
  </div>
</template>
