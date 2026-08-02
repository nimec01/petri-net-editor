<script setup lang="ts">
import type { IPetriNet } from '~/types/petri-net-core';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const { petriNet } = defineProps<{
  petriNet: IPetriNet;
}>();

const preconditionMatrix = computed(() => {
  const transitions = petriNet.getTransitions();
  const places = petriNet.getPlaces();

  return `\\begin{array}{c|ccc}
{}^{\\bullet}() & ${places.map(p => p.label).join(' & ')} \\\\
\\hline
${transitions.map((t) => {
  const marking = petriNet.getPreMarking(t.id);
  return `${t.label} & ${places.map(p => marking[p.id] || 0).join(' & ')}`;
}).join('\\\\')}
\\end{array}`;
});

const postconditionMatrix = computed(() => {
  const transitions = petriNet.getTransitions();
  const places = petriNet.getPlaces();

  return `\\begin{array}{c|ccc}
(){}^{\\bullet} & ${places.map(p => p.label).join(' & ')} \\\\
\\hline
${transitions.map((t) => {
  const marking = petriNet.getPostMarking(t.id);
  return `${t.label} & ${places.map(p => marking[p.id] || 0).join(' & ')}`;
}).join('\\\\')}
\\end{array}`;
});

const initialMarkingMatrix = computed(() => {
  const places = petriNet.getPlaces();
  const marking = petriNet.getMarking();

  return `\\begin{array}{c|ccc}
m_0 & ${places.map(p => p.label).join(' & ')} \\\\
\\hline
 & ${places.map(p => marking[p.id] || 0).join(' & ')}
\\end{array}`;
});

const katexString = computed(() => katex.renderToString(`N = (P,T,{}^{\\bullet}(),(){}^{\\bullet},m_0) \\\\
P = \\{${petriNet.getPlaces().map(p => p.label).join(',')}\\} \\\\
T = \\{${petriNet.getTransitions().map(t => t.label).join(',')} \\} \\\\
\\\\[1em]
${preconditionMatrix.value} \\\\
\\\\[1em]
${postconditionMatrix.value} \\\\
\\\\[1em]
${initialMarkingMatrix.value} \\\\
`, { throwOnError: true, displayMode: false }));
</script>

<template>
  <div class="w-fit" v-html="katexString" />
</template>
