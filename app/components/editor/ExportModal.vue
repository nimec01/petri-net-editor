<script setup lang="ts">
import IconCopy from '~icons/tabler/copy';
import IconDownload from '~icons/tabler/download';

const props = defineProps<{
  json: () => string;
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const copied = ref(false);
const currentJson = ref('');

function open() {
  copied.value = false;
  currentJson.value = props.json();
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
  const blob = new Blob([currentJson.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'petri-net.json';
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
      <textarea
        class="textarea textarea-bordered w-full font-mono text-sm h-72 resize-none bg-base-300"
        readonly
        :value="currentJson"
      />
      <div class="modal-action">
        <button class="btn btn-primary" @click="download">
          <IconDownload />
          Download
        </button>
        <button class="btn" @click="copyToClipboard">
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
