<script setup lang="ts">
const petriNet = inject<ReturnType<typeof usePetriNet>>('petriNet')!;
const container = ref<HTMLElement | null>(null);
const mode = petriNet.mode;

onMounted(() => {
  if (!container.value)
    return;
  petriNet.initCy(container.value);
  petriNet.loadFromUrl();

  const ro = new ResizeObserver(() => {
    if (petriNet.cy.value) {
      petriNet.cy.value.resize();
      petriNet.cy.value.fit(undefined, 50);
    }
  });
  ro.observe(container.value);
});
</script>

<template>
  <div
    ref="container"
    class="w-full h-full"
    :class="{
      'cursor-crosshair': mode === 'place' || mode === 'transition' || mode === 'arc',
      'cursor-pointer': mode === 'token',
      'cursor-not-allowed': mode === 'delete',
    }"
  />
</template>
