<script setup lang="ts">
const dialogEl = ref<HTMLDialogElement | null>(null);

interface ShortcutSection {
  heading: string;
  shortcuts: Array<{ keys: string[]; description: string }>;
}

const sections: ShortcutSection[] = [
  {
    heading: 'Tools',
    shortcuts: [
      { keys: ['1'], description: 'Select' },
      { keys: ['2'], description: 'Place' },
      { keys: ['3'], description: 'Transition' },
      { keys: ['4'], description: 'Arc' },
      { keys: ['5'], description: 'Token' },
      { keys: ['6'], description: 'Delete' },
    ],
  },
  {
    heading: 'Editing',
    shortcuts: [
      { keys: ['Delete'], description: 'Delete selected element' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' },
      { keys: ['Ctrl', 'C'], description: 'Copy selection' },
      { keys: ['Ctrl', 'V'], description: 'Paste' },
    ],
  },
  {
    heading: 'View',
    shortcuts: [
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Fit to screen' },
    ],
  },
  {
    heading: 'Simulation',
    shortcuts: [
      { keys: ['F'], description: 'Toggle fire mode' },
    ],
  },
  {
    heading: 'Other',
    shortcuts: [
      { keys: ['Esc'], description: 'Deselect / exit fire mode' },
      { keys: ['?'], description: 'Show shortcuts' },
    ],
  },
];

function open() {
  dialogEl.value?.showModal();
}

function close() {
  dialogEl.value?.close();
}

defineExpose({ open, close });
</script>

<template>
  <dialog ref="dialogEl" class="modal" data-testid="shortcuts-modal">
    <div class="modal-box max-w-lg">
      <h3 class="text-lg font-bold mb-4">
        Keyboard Shortcuts
      </h3>
      <div class="flex flex-col gap-5">
        <div v-for="section in sections" :key="section.heading">
          <h4 class="text-sm font-semibold uppercase tracking-wide text-base-content/60 mb-2">
            {{ section.heading }}
          </h4>
          <div class="flex flex-col gap-2">
            <div v-for="(shortcut, index) in section.shortcuts" :key="index" class="flex items-center justify-between">
              <span class="text-sm">{{ shortcut.description }}</span>
              <span class="flex items-center gap-1">
                <kbd
                  v-for="key in shortcut.keys"
                  :key="key"
                  class="kbd kbd-sm"
                >{{ key }}</kbd>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-action">
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
