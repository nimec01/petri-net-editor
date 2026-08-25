<script setup lang="ts">
const emit = defineEmits<{
  rename: [name: string];
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const name = ref('');
const tabId = ref('');

function open(id: string, currentName: string) {
  tabId.value = id;
  name.value = currentName;
  dialogEl.value?.showModal();
}

function handleSubmit() {
  const trimmed = name.value.trim();
  if (trimmed) {
    emit('rename', trimmed);
    close();
  }
}

function close() {
  dialogEl.value?.close();
}

defineExpose({ open, close });
</script>

<template>
  <dialog ref="dialogEl" class="modal">
    <div class="modal-box">
      <h3 class="text-lg font-bold mb-4">
        Rename Tab
      </h3>
      <form @submit.prevent="handleSubmit">
        <input
          v-model="name"
          type="text"
          class="input input-bordered w-full"
          placeholder="Tab name"
          autofocus
        >
        <div class="modal-action">
          <button type="submit" class="btn btn-primary" :disabled="!name.trim()">
            Rename
          </button>
          <button type="button" class="btn" @click="close">
            Cancel
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
