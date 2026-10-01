<script setup lang="ts">
import IconCopy from '~icons/tabler/copy';
import IconDownload from '~icons/tabler/download';

const props = defineProps<{
  json: () => string;
  pnml: () => string;
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const copied = ref(false);
const currentJson = ref('');
const format = ref<'json' | 'pnml'>('json');

function open() {
  copied.value = false;
  currentJson.value = props.json();
  format.value = 'json';
  dialogEl.value?.showModal();
}

function close() {
  dialogEl.value?.close();
}

async function copyToClipboard() {
  await navigator.clipboard.writeText(currentJson.value);
  copied.value = true;
}

function download() {
  const extension = format.value === 'json' ? 'json' : 'pnml';
  const mimeType = format.value === 'json' ? 'application/json' : 'application/xml';
  const blob = new Blob([currentJson.value], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `petri-net.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}

defineExpose({ open, close });
</script>

<template>
  <dialog ref="dialogEl" class="modal">
    <div class="modal-box max-w-2xl">
      <h3 class="text-lg font-bold mb-4">
        Export Petri Net
      </h3>
      <label class="form-control mb-4">
        <span class="label-text mb-1">Format</span>
        <select v-model="format" class="select select-bordered w-full" data-testid="export-format" @change="currentJson = format === 'json' ? props.json() : props.pnml()">
          <option value="json">JSON</option>
          <option value="pnml">PNML</option>
        </select>
      </label>
      <textarea
        class="textarea textarea-bordered w-full font-mono text-sm h-72 resize-none bg-base-300"
        readonly
        :data-testid="format === 'json' ? 'export-json' : 'export-pnml'"
        :value="currentJson"
      />
      <div class="modal-action">
        <button class="btn btn-primary" data-testid="export-download" @click="download">
          <IconDownload />
          Download
        </button>
        <button class="btn" data-testid="export-copy" @click="copyToClipboard">
          <IconCopy />
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
        <form method="dialog">
          <button class="btn">
            Close
          </button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
