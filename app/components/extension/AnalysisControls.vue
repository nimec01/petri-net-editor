<script setup lang="ts">
import IconAlertTriangle from '~icons/tabler/alert-triangle';
import IconRefresh from '~icons/tabler/refresh';

const props = defineProps<{
  limit: number;
  nodeCount: number;
  complete: boolean;
  hasResult: boolean;
}>();

const emit = defineEmits<{
  'update:limit': [value: number];
  'run': [];
}>();

const limitValue = computed({
  get: () => props.limit,
  set: (value: number) => emit('update:limit', value),
});
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="flex items-center gap-2 flex-wrap">
      <span class="badge badge-ghost">
        Explored {{ nodeCount }} markings
      </span>
      <span v-if="hasResult && complete" class="badge badge-success">
        Complete
      </span>
      <span v-else-if="hasResult" class="badge badge-warning">
        Truncated
      </span>
    </div>

    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-sm opacity-60">Max markings</span>
      <input
        v-model.number="limitValue"
        type="number"
        min="1"
        class="input input-sm w-28"
        @keydown.enter="emit('run')"
      >
      <button class="btn btn-sm btn-primary" @click="emit('run')">
        <IconRefresh />
        Run
      </button>
    </div>

    <div v-if="hasResult && !complete" class="alert alert-warning">
      <IconAlertTriangle />
      <span>
        The reachability graph may be infinite and only {{ nodeCount }} of its markings were explored. Results are preliminary &mdash; increase the limit for more certainty.
      </span>
    </div>
  </div>
</template>
