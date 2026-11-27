<script setup lang="ts">
import type { PetriNetElementData } from '~/types/petri-net';
import { isNonNegativeInteger, placeCapacityError } from '~/utils/capacity';

const props = defineProps<{
  element: PetriNetElementData | null;
}>();

const emit = defineEmits<{
  updateLabel: [id: string, label: string];
  updateTokens: [id: string, tokens: number];
  updateCapacity: [id: string, capacity: number | undefined];
  updateWeight: [id: string, weight: number];
  delete: [id: string];
  close: [];
}>();

const localLabel = ref('');
const localTokens = ref(0);
const localWeight = ref(1);
const localCapacity = ref('');
const capacityInputError = ref('');
const capacityError = computed(() => props.element?.type === 'place'
  ? placeCapacityError(props.element.capacity, props.element.tokens ?? 0)
  : null);

watch(
  () => props.element,
  (el) => {
    if (el) {
      localLabel.value = el.label;
      localTokens.value = el.tokens ?? 0;
      localWeight.value = el.weight ?? 1;
      localCapacity.value = el.capacity === undefined
        ? ''
        : String(el.capacity);
      capacityInputError.value = '';
    }
  },
  { immediate: true },
);

function onLabelInput() {
  if (props.element) {
    emit('updateLabel', props.element.id, localLabel.value);
  }
}

function onCapacityInput() {
  if (!props.element)
    return;
  const text = localCapacity.value.trim();
  if (!text) {
    capacityInputError.value = '';
    emit('updateCapacity', props.element.id, undefined);
  } else if (/^\d+$/.test(text) && isNonNegativeInteger(Number(text))) {
    capacityInputError.value = '';
    emit('updateCapacity', props.element.id, Number(text));
  } else {
    capacityInputError.value = 'Capacity must be a non-negative integer.';
  }
}

function onTokensInput() {
  if (props.element) {
    emit('updateTokens', props.element.id, localTokens.value);
  }
}

function onWeightInput() {
  if (props.element) {
    const weight = Math.max(1, Math.round(localWeight.value));
    localWeight.value = weight;
    emit('updateWeight', props.element.id, weight);
  }
}

function incrementTokens() {
  localTokens.value++;
  onTokensInput();
}

function decrementTokens() {
  if (localTokens.value > 0) {
    localTokens.value--;
    onTokensInput();
  }
}
</script>

<template>
  <div
    v-if="element"
    class="bg-base-200 rounded-box p-4 w-64 shadow-lg"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-bold text-sm">
        Properties
      </h3>
      <button
        class="btn btn-ghost btn-xs"
        data-testid="prop-close"
        @click="emit('close')"
      >
        ✕
      </button>
    </div>

    <div class="space-y-3">
      <div>
        <label class="text-xs opacity-70">Type</label>
        <div class="badge badge-sm">
          {{ element.type }}
        </div>
      </div>

      <div v-if="element.type !== 'arc'">
        <label class="text-xs opacity-70">Label</label>
        <input
          v-model="localLabel"
          type="text"
          class="input input-sm w-full"
          placeholder="Label"
          data-testid="prop-label"
          @input="onLabelInput"
        >
      </div>

      <div v-if="element.type === 'arc'">
        <label class="text-xs opacity-70">Source</label>
        <div class="text-sm">
          {{ element.source }}
        </div>
        <label class="text-xs opacity-70">Target</label>
        <div class="text-sm">
          {{ element.target }}
        </div>
        <label class="text-xs opacity-70 mt-2 block">Weight</label>
        <div class="join w-full">
          <button class="btn btn-sm join-item" @click="localWeight = Math.max(1, localWeight - 1); onWeightInput()">
            −
          </button>
          <input
            v-model.number="localWeight"
            type="number"
            min="1"
            class="input input-sm text-center join-item flex-1"
            data-testid="prop-weight"
            @change="onWeightInput"
          >
          <button class="btn btn-sm join-item" @click="localWeight++; onWeightInput()">
            +
          </button>
        </div>
      </div>

      <div v-if="element.type === 'place'">
        <label class="text-xs opacity-70">Tokens</label>
        <div class="join w-full">
          <button class="btn btn-sm join-item" @click="decrementTokens">
            −
          </button>
          <input
            v-model.number="localTokens"
            type="number"
            min="0"
            class="input input-sm text-center join-item flex-1"
            data-testid="prop-tokens"
            @change="onTokensInput"
          >
          <button class="btn btn-sm join-item" @click="incrementTokens">
            +
          </button>
        </div>
        <label class="text-xs opacity-70 mt-2 block">
          Capacity (empty for unbounded)
          <input
            v-model="localCapacity"
            type="text"
            inputmode="numeric"
            class="input input-sm w-full"
            :class="{ 'input-error': capacityError || capacityInputError }"
            :aria-invalid="!!(capacityError || capacityInputError)"
            data-testid="prop-capacity"
            @change="onCapacityInput"
          >
        </label>
        <button v-if="element.capacity !== undefined" class="btn btn-ghost btn-xs" data-testid="clear-capacity" @click="localCapacity = ''; onCapacityInput()">
          Clear capacity
        </button>
        <p v-if="capacityInputError || capacityError" class="text-error text-sm" role="alert">
          {{ capacityInputError || capacityError }}
        </p>
      </div>

      <button
        class="btn btn-error btn-sm w-full mt-4"
        data-testid="prop-delete"
        @click="emit('delete', element.id)"
      >
        Delete
      </button>
    </div>
  </div>
</template>
