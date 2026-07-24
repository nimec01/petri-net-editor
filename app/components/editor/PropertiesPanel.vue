<script setup lang="ts">
import type { PetriNetElementData } from '~/types/petri-net';

const props = defineProps<{
  element: PetriNetElementData | null;
}>();

const emit = defineEmits<{
  updateLabel: [id: string, label: string];
  updateTokens: [id: string, tokens: number];
  delete: [id: string];
  close: [];
}>();

const localLabel = ref('');
const localTokens = ref(0);

watch(
  () => props.element,
  (el) => {
    if (el) {
      localLabel.value = el.label;
      localTokens.value = el.tokens ?? 0;
    }
  },
  { immediate: true },
);

function onLabelInput() {
  if (props.element) {
    emit('updateLabel', props.element.id, localLabel.value);
  }
}

function onTokensInput() {
  if (props.element) {
    emit('updateTokens', props.element.id, localTokens.value);
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
            @change="onTokensInput"
          >
          <button class="btn btn-sm join-item" @click="incrementTokens">
            +
          </button>
        </div>
      </div>

      <button
        class="btn btn-error btn-sm w-full mt-4"
        @click="emit('delete', element.id)"
      >
        Delete
      </button>
    </div>
  </div>
</template>
