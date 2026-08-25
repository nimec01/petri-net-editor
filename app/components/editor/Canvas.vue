<script setup lang="ts">
const props = withDefaults(defineProps<{
  petriNet: ReturnType<typeof usePetriNet>;
  loadFromUrl?: boolean;
}>(), {
  loadFromUrl: false,
});

const container = ref<HTMLElement | null>(null);
const mode = props.petriNet.mode;

onMounted(() => {
  if (!container.value)
    return;
  props.petriNet.initCy(container.value);
  if (props.loadFromUrl) {
    props.petriNet.loadFromUrl();
  }

  let initialFit = true;
  const ro = new ResizeObserver(() => {
    if (props.petriNet.cy.value) {
      props.petriNet.cy.value.resize();
      if (initialFit) {
        props.petriNet.cy.value.fit(undefined, 50);
        initialFit = false;
      }
    }
  });
  ro.observe(container.value);
});
</script>

<template>
  <div
    ref="container"
    data-testid="editor-canvas"
    class="w-full h-full"
    :class="{
      'cursor-crosshair': mode === 'place' || mode === 'transition' || mode === 'arc',
      'cursor-pointer': mode === 'token',
      'cursor-not-allowed': mode === 'delete',
    }"
  />
</template>
