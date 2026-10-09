<script setup lang="ts">
import type { PetriNetState } from '~/types/petri-net';
import IconFileUpload from '~icons/tabler/file-upload';
import { importFromPnml } from '~/utils/pnml';

const emit = defineEmits<{
  import: [state: PetriNetState];
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const jsonText = ref('');
const format = ref<'json' | 'pnml'>('json');
const error = ref('');

function open() {
  jsonText.value = '';
  format.value = 'json';
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
    const state = format.value === 'pnml'
      ? importFromPnml(jsonText.value)
      : JSON.parse(jsonText.value) as PetriNetState;
    if (!state.elements || !Array.isArray(state.elements)) {
      error.value = 'Invalid format: missing "elements" array.';
      return;
    }
    emit('import', state);
    close();
  } catch (cause) {
    error.value = format.value === 'json'
      ? 'Invalid JSON. Please check the input.'
      : cause instanceof Error ? cause.message : 'Invalid PNML. Please check the input.';
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
        <label class="form-control">
          <span class="label-text mb-1">Format</span>
          <select v-model="format" class="select select-bordered w-full" data-testid="import-format">
            <option value="json">JSON</option>
            <option value="pnml">PNML</option>
          </select>
        </label>
        <div>
          <label class="label mb-1">
            <span class="label-text">Paste {{ format === 'json' ? 'JSON' : 'PNML' }}</span>
          </label>
          <textarea
            v-model="jsonText"
            class="textarea textarea-bordered w-full font-mono text-sm h-56 resize-none bg-base-300"
            :data-testid="format === 'json' ? 'import-json' : 'import-pnml'"
            :placeholder="format === 'json' ? '{&quot;elements&quot;: [...], &quot;formatVersion&quot;: 1}' : '&lt;pnml&gt;...&lt;/pnml&gt;'"
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
            accept=".json,.pnml,.xml"
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
