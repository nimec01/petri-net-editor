<script setup lang="ts">
import type { PetriNetState } from '~/types/petri-net';
import IconFileUpload from '~icons/tabler/file-upload';

const emit = defineEmits<{
  import: [state: PetriNetState];
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const jsonText = ref('');
const error = ref('');

function open() {
  jsonText.value = '';
  error.value = '';
  dialogEl.value?.showModal();
}

function close() {
  dialogEl.value?.close();
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file)
    return;
  const reader = new FileReader();
  reader.onload = () => {
    jsonText.value = reader.result as string;
  };
  reader.readAsText(file);
}

function handleImport() {
  error.value = '';
  try {
    const state = JSON.parse(jsonText.value) as PetriNetState;
    if (!state.elements || !Array.isArray(state.elements)) {
      error.value = 'Invalid format: missing "elements" array.';
      return;
    }
    emit('import', state);
    close();
  } catch {
    error.value = 'Invalid JSON. Please check the input.';
  }
}

defineExpose({ open, close });
</script>

<template>
  <dialog ref="dialogEl" class="modal">
    <div class="modal-box max-w-2xl">
      <h3 class="text-lg font-bold mb-4">
        Import Petri Net
      </h3>
      <div class="flex flex-col gap-4">
        <div>
          <label class="label mb-1">
            <span class="label-text">Paste JSON</span>
          </label>
          <textarea
            v-model="jsonText"
            class="textarea textarea-bordered w-full font-mono text-sm h-56 resize-none bg-base-300"
            data-testid="import-json"
            placeholder="{&quot;elements&quot;: [...], &quot;version&quot;: &quot;0.1.0&quot;, &quot;formatVersion&quot;: 1}"
          />
        </div>
        <div class="divider">
          or
        </div>
        <div>
          <label class="label mb-1">
            <span class="label-text">Upload file</span>
          </label>
          <input
            type="file"
            class="file-input file-input-bordered w-full"
            accept=".json"
            data-testid="import-file"
            @change="handleFileChange"
          >
        </div>
        <p v-if="error" class="text-error text-sm">
          {{ error }}
        </p>
      </div>
      <div class="modal-action">
        <button class="btn btn-primary" :disabled="!jsonText.trim()" data-testid="import-confirm" @click="handleImport">
          <IconFileUpload />
          Import
        </button>
        <form method="dialog">
          <button class="btn">
            Cancel
          </button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
