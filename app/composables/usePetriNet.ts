import type { Core, EventObject, NodeSingular } from 'cytoscape';
import type { Command, EditorMode, FiringHistoryEntry, LayoutType, PetriNetElementData, PetriNetState } from '~/types/petri-net';
import type { IPetriNet, Marking } from '~/types/petri-net-core';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { computed, ref, shallowRef } from 'vue';
import { CytoscapePetriNet } from '~/types/cytoscape-petri-net';

cytoscape.use(dagre);

let nextId = 1;

function generateId(): string {
  return `el-${nextId++}`;
}

const petriNetStylesheet: cytoscape.StylesheetJson = [
  {
    selector: 'node.place-wrapper',
    style: {
      'label': 'data(label)',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': -5,
      'font-size': '12px',
      'shape': 'rectangle',
      'background-opacity': 0,
      'border-width': 0,
      'width': 60,
      'height': 60,
    },
  },
  {
    selector: 'node.place-wrapper > node',
    style: {
      'shape': 'ellipse',
      'background-color': '#ffffff',
      'border-color': '#374151',
      'border-width': 2,
      'label': '',
      'width': 60,
      'height': 60,
    },
  },
  {
    selector: 'node[type="transition"]',
    style: {
      'shape': 'rectangle',
      'background-color': '#374151',
      'border-color': '#1f2937',
      'border-width': 2,
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'color': '#ffffff',
      'width': 20,
      'height': 60,
      'font-size': '12px',
    },
  },
  {
    selector: 'node.place-wrapper > node[tokens > 0]',
    style: {
      'label': (ele: NodeSingular) => {
        const tokens = ele.data('tokens') as number;
        return tokens <= 5 ? '●'.repeat(tokens) : String(tokens);
      },
      'text-valign': 'center',
      'text-halign': 'center',
      'text-margin-y': 0,
      'font-size': '14px',
    },
  },
  {
    selector: 'edge[type="arc"]',
    style: {
      'width': 2,
      'line-color': '#6b7280',
      'target-arrow-color': '#6b7280',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.2,
    },
  },
  {
    selector: ':selected',
    style: {
      'border-color': '#3b82f6',
      'border-width': 3,
      'line-color': '#3b82f6',
      'target-arrow-color': '#3b82f6',
    },
  },
  {
    selector: '.arc-source',
    style: {
      'border-color': '#f59e0b',
      'border-width': 3,
    },
  },
  {
    selector: '.enabled-transition',
    style: {
      'background-color': '#22c55e',
      'border-color': '#16a34a',
      'border-width': 3,
    },
  },
];

export function usePetriNet() {
  const cy = shallowRef<Core | null>(null);
  const petriNet = shallowRef<IPetriNet | null>(null);
  const mode = ref<EditorMode>('select');
  const selectedElement = ref<PetriNetElementData | null>(null);
  const arcSourceId = ref<string | null>(null);
  const firingHistory = ref<FiringHistoryEntry[]>([]);
  let firingSequence = 0;
  let initialMarking: Marking | null = null;
  const autoFiring = ref(false);
  const autoFireSpeed = ref(500);
  let autoFireTimer: ReturnType<typeof setInterval> | null = null;
  const elementCount = ref(0);
  const layoutType = ref<LayoutType>('dagre');

  watch(mode, (newMode, oldMode) => {
    if (newMode !== 'select') {
      cy.value?.elements().unselect();
      selectedElement.value = null;
    }
    if (oldMode === 'fire') {
      exitFireMode();
    }
    if (newMode === 'fire') {
      enterFireMode();
    }
  });
  const undoStack = ref<Command[]>([]);
  const redoStack = ref<Command[]>([]);
  let placeCount = 0;
  let transitionCount = 0;

  function initCy(container: HTMLElement): Core {
    const instance = cytoscape({
      container,
      style: petriNetStylesheet,
      layout: { name: 'preset' },
      selectionType: 'single',
      boxSelectionEnabled: false,
      minZoom: 0.1,
      maxZoom: 5,
    });

    instance.on('select', (e: EventObject) => {
      if (e.target === instance) {
        instance.elements().unselect();
        selectedElement.value = null;
        return;
      }
      if (mode.value !== 'select') {
        return;
      }
      const ele = e.target;
      const isWrapper = ele.data('type') === 'place';
      const parent = ele.parent().first();
      const wrapperId = isWrapper ? ele.id() : (parent.length > 0 && parent.data('type') === 'place' ? parent.id() : ele.id());
      const innerNode = isWrapper ? ele.children().first() : ele;
      selectedElement.value = {
        id: wrapperId,
        type: 'place',
        label: ele.data('label') || (isWrapper ? '' : ''),
        tokens: innerNode.data('tokens'),
        source: ele.data('source'),
        target: ele.data('target'),
      };
    });

    instance.on('unselect', (e: EventObject) => {
      if (e.target !== instance) {
        selectedElement.value = null;
      }
    });

    instance.on('tap', (e: EventObject) => {
      if (e.target !== instance)
        return;
      handleCanvasTap(e);
    });

    instance.on('tap', 'node, edge', (e: EventObject) => {
      handleElementTap(e);
    });

    cy.value = instance;
    petriNet.value = new CytoscapePetriNet(instance);
    return instance;
  }

  function handleCanvasTap(e: EventObject) {
    const pos = e.position;
    switch (mode.value) {
      case 'place':
        addPlace(pos.x, pos.y);
        break;
      case 'transition':
        addTransition(pos.x, pos.y);
        break;
      case 'arc':
        clearArcSource();
        break;
    }
  }

  function handleElementTap(e: EventObject) {
    const ele = e.target;
    const type = ele.data('type') as string;

    let targetId = ele.id();
    let targetType = type;

    if (type === 'place') {
      targetId = `${ele.id()}-inner`;
    } else if (!type && ele.parent().length > 0 && ele.parent().data('type') === 'place') {
      targetId = ele.id();
      targetType = 'place';
    }

    switch (mode.value) {
      case 'delete':
        deleteElement(targetId);
        break;
      case 'arc':
        handleArcTap(targetId, targetType);
        break;
      case 'token':
        if (targetType === 'place') {
          incrementTokens(targetId);
        }
        break;
      case 'fire':
        if (targetType === 'transition') {
          fireTransition(targetId);
        }
        break;
    }
  }

  function handleArcTap(id: string, type: string) {
    if (type === 'arc')
      return;

    if (!arcSourceId.value) {
      arcSourceId.value = id;
      cy.value?.getElementById(id).addClass('arc-source');
    } else {
      const sourceEle = cy.value?.getElementById(arcSourceId.value);
      const sourceType = sourceEle?.data('type') as string;

      if (arcSourceId.value === id) {
        clearArcSource();
        return;
      }

      if (type === sourceType) {
        clearArcSource();
        return;
      }

      addArc(arcSourceId.value, id);
      clearArcSource();
    }
  }

  function clearArcSource() {
    if (arcSourceId.value && cy.value) {
      cy.value.getElementById(arcSourceId.value).removeClass('arc-source');
    }
    arcSourceId.value = null;
  }

  function closeProperties() {
    cy.value?.elements().unselect();
    selectedElement.value = null;
  }

  function addPlace(x: number, y: number): string {
    const id = generateId();
    placeCount++;
    const label = `P${placeCount}`;
    const innerId = `${id}-inner`;
    cy.value?.add({
      group: 'nodes',
      data: { id, type: 'place', label },
      position: { x, y },
      classes: 'place-wrapper',
    });
    cy.value?.add({
      group: 'nodes',
      data: { id: innerId, parent: id, tokens: 0 },
      position: { x, y },
    });
    pushUndo({ type: 'add', elementData: { id, type: 'place', label, tokens: 0, x, y } });
    elementCount.value++;
    return innerId;
  }

  function addTransition(x: number, y: number): string {
    const id = generateId();
    transitionCount++;
    const label = `T${transitionCount}`;
    cy.value?.add({
      group: 'nodes',
      data: { id, type: 'transition', label },
      position: { x, y },
    });
    pushUndo({ type: 'add', elementData: { id, type: 'transition', label, x, y } });
    elementCount.value++;
    return id;
  }

  function addArc(sourceId: string, targetId: string): string {
    const id = generateId();
    cy.value?.add({
      group: 'edges',
      data: { id, type: 'arc', source: sourceId, target: targetId },
    });
    pushUndo({
      type: 'add',
      elementData: { id, type: 'arc', label: '', source: sourceId, target: targetId },
    });
    elementCount.value++;
    return id;
  }

  function deleteElement(id: string) {
    const ele = cy.value?.getElementById(id);
    if (!ele || ele.length === 0)
      return;

    const parent = ele.parent().first();
    const deleteTarget = parent.length > 0 ? parent : ele;

    const pos = deleteTarget.position();
    const elementData: PetriNetElementData = {
      id: deleteTarget.id(),
      type: deleteTarget.data('type') || 'place',
      label: deleteTarget.data('label') || '',
      tokens: deleteTarget.data('tokens'),
      source: deleteTarget.data('source'),
      target: deleteTarget.data('target'),
      x: pos.x,
      y: pos.y,
    };

    if (selectedElement.value?.id === id || selectedElement.value?.id === deleteTarget.id()) {
      selectedElement.value = null;
    }

    deleteTarget.remove();
    elementCount.value = cy.value?.elements().length ?? 0;
    pushUndo({ type: 'delete', elementData });
  }

  function setTokens(id: string, count: number) {
    let tokenEle = cy.value?.getElementById(id);
    if (!tokenEle || tokenEle.length === 0)
      return;

    let wrapperId = id;
    if (tokenEle.data('type') === 'place') {
      const innerId = `${id}-inner`;
      const innerEle = cy.value?.getElementById(innerId);
      if (innerEle && innerEle.length > 0) {
        tokenEle = innerEle;
        wrapperId = id;
      }
    } else if (tokenEle.parent().length > 0 && tokenEle.parent().data('type') === 'place') {
      wrapperId = tokenEle.parent().first().id();
    }

    const previousTokens = tokenEle.data('tokens') as number;
    tokenEle.data('tokens', Math.max(0, count));

    const wrapperEle = cy.value?.getElementById(wrapperId);
    const label = wrapperEle?.data('label') ?? '';

    if (selectedElement.value?.id === wrapperId || selectedElement.value?.id === id) {
      selectedElement.value = { ...selectedElement.value, tokens: Math.max(0, count) };
    }

    pushUndo({
      type: 'modify',
      elementData: { id: wrapperId, type: 'place', label, tokens: Math.max(0, count) },
      previousData: { id: wrapperId, type: 'place', label, tokens: previousTokens },
    });
  }

  function incrementTokens(id: string) {
    const ele = cy.value?.getElementById(id);
    if (!ele || ele.length === 0)
      return;
    const current = (ele.data('tokens') as number) || 0;
    setTokens(id, current + 1);
  }

  function setLabel(id: string, label: string) {
    const ele = cy.value?.getElementById(id);
    if (!ele || ele.length === 0)
      return;

    const previousLabel = ele.data('label') as string;
    ele.data('label', label);

    if (selectedElement.value?.id === id) {
      selectedElement.value = { ...selectedElement.value, label };
    }

    pushUndo({
      type: 'modify',
      elementData: { id, type: ele.data('type'), label, tokens: ele.data('tokens') },
      previousData: { id, type: ele.data('type'), label: previousLabel, tokens: ele.data('tokens') },
    });
  }

  function pushUndo(command: Command) {
    undoStack.value.push(command);
    redoStack.value = [];
  }

  function undo() {
    const cmd = undoStack.value.pop();
    if (!cmd || !cy.value)
      return;

    if (cmd.type === 'add') {
      cy.value.getElementById(cmd.elementData.id).remove();
      if (selectedElement.value?.id === cmd.elementData.id) {
        selectedElement.value = null;
      }
    } else if (cmd.type === 'delete') {
      const data = cmd.elementData;
      if (data.type === 'arc') {
        cy.value.add({
          group: 'edges',
          data: { id: data.id, type: 'arc', source: data.source, target: data.target },
        });
      } else if (data.type === 'place') {
        cy.value.add({
          group: 'nodes',
          data: { id: data.id, type: 'place', label: data.label },
          position: { x: data.x ?? 0, y: data.y ?? 0 },
          classes: 'place-wrapper',
        });
        cy.value.add({
          group: 'nodes',
          data: { id: `${data.id}-inner`, parent: data.id, tokens: data.tokens ?? 0 },
          position: { x: data.x ?? 0, y: data.y ?? 0 },
        });
      } else {
        cy.value.add({
          group: 'nodes',
          data: { id: data.id, type: data.type, label: data.label, tokens: data.tokens },
          position: { x: data.x ?? 0, y: data.y ?? 0 },
        });
      }
    } else if (cmd.type === 'modify' && cmd.previousData) {
      const prev = cmd.previousData;
      const ele = cy.value.getElementById(prev.id);
      if (ele.length > 0) {
        if (prev.type === 'place') {
          if (prev.label !== undefined) {
            ele.data('label', prev.label);
          }
          if (prev.tokens !== undefined) {
            const inner = cy.value.getElementById(`${prev.id}-inner`);
            if (inner.length > 0) {
              inner.data('tokens', prev.tokens);
            }
          }
        } else {
          ele.data('label', prev.label);
          if (prev.tokens !== undefined) {
            ele.data('tokens', prev.tokens);
          }
        }
        if (selectedElement.value?.id === prev.id) {
          selectedElement.value = {
            ...selectedElement.value,
            label: prev.label ?? selectedElement.value.label,
            tokens: prev.tokens ?? selectedElement.value.tokens,
          };
        }
      }
    }

    redoStack.value.push(cmd);
  }

  function redo() {
    const cmd = redoStack.value.pop();
    if (!cmd || !cy.value)
      return;

    if (cmd.type === 'add') {
      const data = cmd.elementData;
      if (data.type === 'arc') {
        cy.value.add({
          group: 'edges',
          data: { id: data.id, type: 'arc', source: data.source, target: data.target },
        });
      } else if (data.type === 'place') {
        cy.value.add({
          group: 'nodes',
          data: { id: data.id, type: 'place', label: data.label },
          position: { x: data.x ?? 0, y: data.y ?? 0 },
          classes: 'place-wrapper',
        });
        cy.value.add({
          group: 'nodes',
          data: { id: `${data.id}-inner`, parent: data.id, tokens: data.tokens ?? 0 },
          position: { x: data.x ?? 0, y: data.y ?? 0 },
        });
      } else {
        cy.value.add({
          group: 'nodes',
          data: { id: data.id, type: data.type, label: data.label, tokens: data.tokens },
          position: { x: data.x ?? 0, y: data.y ?? 0 },
        });
      }
    } else if (cmd.type === 'delete') {
      cy.value.getElementById(cmd.elementData.id).remove();
      if (selectedElement.value?.id === cmd.elementData.id) {
        selectedElement.value = null;
      }
    } else if (cmd.type === 'modify') {
      const data = cmd.elementData;
      const ele = cy.value.getElementById(data.id);
      if (ele.length > 0) {
        if (data.type === 'place') {
          if (data.label !== undefined) {
            ele.data('label', data.label);
          }
          if (data.tokens !== undefined) {
            const inner = cy.value.getElementById(`${data.id}-inner`);
            if (inner.length > 0) {
              inner.data('tokens', data.tokens);
            }
          }
        } else {
          ele.data('label', data.label);
          if (data.tokens !== undefined) {
            ele.data('tokens', data.tokens);
          }
        }
        if (selectedElement.value?.id === data.id) {
          selectedElement.value = {
            ...selectedElement.value,
            label: data.label ?? selectedElement.value.label,
            tokens: data.tokens ?? selectedElement.value.tokens,
          };
        }
      }
    }

    undoStack.value.push(cmd);
  }

  function zoomIn() {
    cy.value?.zoom({ level: (cy.value.zoom() as number) * 1.3, renderedPosition: { x: (cy.value.width() as number) / 2, y: (cy.value.height() as number) / 2 } });
  }

  function zoomOut() {
    cy.value?.zoom({ level: (cy.value.zoom() as number) / 1.3, renderedPosition: { x: (cy.value.width() as number) / 2, y: (cy.value.height() as number) / 2 } });
  }

  function zoomToFit() {
    cy.value?.fit(undefined, 50);
  }

  function applyLayout(type: LayoutType) {
    layoutType.value = type;
    const instance = cy.value;
    if (!instance || instance.nodes().length === 0)
      return;

    const roots = instance.nodes().filter(node => node.isParent() || node.parent().length === 0);

    let layoutOptions: cytoscape.LayoutOptions;
    switch (type) {
      case 'circle':
        layoutOptions = { name: 'circle', roots, animate: true, animationDuration: 300 } as cytoscape.LayoutOptions;
        break;
      case 'dagre':
        layoutOptions = {
          name: 'dagre',
          rankDir: 'LR',
          nodeSep: 30,
          rankSep: 50,
          edgeSep: 10,
          animate: true,
          animationDuration: 300,
        } as cytoscape.LayoutOptions;
        break;
      case 'grid':
        layoutOptions = { name: 'grid', roots, animate: true, animationDuration: 300 } as cytoscape.LayoutOptions;
        break;
    }

    instance.layout(layoutOptions).run();
    instance.fit(undefined, 50);
  }

  function exportToJson(): PetriNetState {
    if (!cy.value)
      return { elements: [] };

    const innerToWrapper = new Map<string, string>();
    cy.value.nodes('[type="place"] > node').forEach((inner) => {
      const parent = inner.parent().first();
      if (parent.length > 0) {
        innerToWrapper.set(inner.id(), parent.id());
      }
    });

    const elements: PetriNetElementData[] = [];
    cy.value.elements().forEach((ele) => {
      if (ele.isNode() && ele.parent().length > 0) {
        return;
      }
      const source = ele.data('source');
      const target = ele.data('target');
      elements.push({
        id: ele.id(),
        type: ele.data('type'),
        label: ele.data('label') || '',
        tokens: ele.data('tokens'),
        source: source ? (innerToWrapper.get(source) ?? source) : undefined,
        target: target ? (innerToWrapper.get(target) ?? target) : undefined,
        x: ele.isNode() ? ele.position('x') : undefined,
        y: ele.isNode() ? ele.position('y') : undefined,
      });
    });
    return { elements };
  }

  function importFromJson(state: PetriNetState) {
    if (!cy.value)
      return;
    cy.value.elements().remove();
    placeCount = 0;
    transitionCount = 0;

    const wrapperToInner = new Map<string, string>();

    for (const el of state.elements) {
      if (el.type === 'arc') {
        continue;
      }
      if (el.type === 'place') {
        placeCount++;
        const innerId = `${el.id}-inner`;
        wrapperToInner.set(el.id, innerId);
        cy.value.add({
          group: 'nodes',
          data: { id: el.id, type: 'place', label: el.label },
          position: { x: el.x ?? 0, y: el.y ?? 0 },
          classes: 'place-wrapper',
        });
        cy.value.add({
          group: 'nodes',
          data: { id: innerId, parent: el.id, tokens: el.tokens ?? 0 },
          position: { x: el.x ?? 0, y: el.y ?? 0 },
        });
      }
      if (el.type === 'transition') {
        transitionCount++;
        cy.value.add({
          group: 'nodes',
          data: { id: el.id, type: 'transition', label: el.label },
          position: { x: el.x ?? 0, y: el.y ?? 0 },
        });
      }
    }

    for (const el of state.elements) {
      if (el.type === 'arc') {
        const source = wrapperToInner.get(el.source!) ?? el.source!;
        const target = wrapperToInner.get(el.target!) ?? el.target!;
        cy.value.add({
          group: 'edges',
          data: { id: el.id, type: 'arc', source, target },
        });
      }
    }

    cy.value.fit(undefined, 50);
    undoStack.value = [];
    redoStack.value = [];
    selectedElement.value = null;
    nextId = state.elements.length + 1;
    elementCount.value = cy.value.elements().length;
  }

  function enterFireMode() {
    if (!petriNet.value)
      return;
    initialMarking = petriNet.value.getMarking();
    updateEnabledHighlights();
  }

  function exitFireMode() {
    stopAutoFire();
    if (petriNet.value && initialMarking) {
      petriNet.value.setMarking(initialMarking);
    }
    initialMarking = null;
    firingHistory.value = [];
    firingSequence = 0;
    clearEnabledHighlights();
  }

  function updateEnabledHighlights() {
    if (!cy.value || !petriNet.value)
      return;
    cy.value.nodes('[type="transition"]').removeClass('enabled-transition');
    for (const t of petriNet.value.getEnabledTransitions()) {
      cy.value.getElementById(t.id).addClass('enabled-transition');
    }
  }

  function clearEnabledHighlights() {
    cy.value?.nodes('[type="transition"]').removeClass('enabled-transition');
  }

  function fireTransition(transitionId: string) {
    if (!petriNet.value)
      return;
    const markingBefore = petriNet.value.getMarking();
    const newMarking = petriNet.value.fireTransition(transitionId);
    if (!newMarking)
      return;

    const ele = cy.value?.getElementById(transitionId);
    const label = ele?.data('label') || transitionId;

    firingHistory.value.push({
      id: ++firingSequence,
      transitionId,
      transitionLabel: label,
      markingBefore,
      markingAfter: { ...newMarking },
    });

    updateEnabledHighlights();
  }

  function revertLastFiring() {
    if (!petriNet.value || firingHistory.value.length === 0)
      return;
    const last = firingHistory.value.at(-1)!;
    petriNet.value.setMarking(last.markingBefore);
    firingHistory.value.pop();
    updateEnabledHighlights();
  }

  function jumpToState(entryId: number) {
    if (!petriNet.value)
      return;
    const idx = firingHistory.value.findIndex(e => e.id === entryId);
    if (idx === -1)
      return;
    const entry = firingHistory.value.at(idx)!;
    petriNet.value.setMarking(entry.markingBefore);
    firingHistory.value = firingHistory.value.slice(0, idx);
    updateEnabledHighlights();
  }

  function clearHistory() {
    stopAutoFire();
    if (petriNet.value && initialMarking) {
      petriNet.value.setMarking(initialMarking);
    }
    firingHistory.value = [];
    firingSequence = 0;
    updateEnabledHighlights();
  }

  function fireRandomTransition(): boolean {
    if (!petriNet.value)
      return false;
    const enabled = petriNet.value.getEnabledTransitions();
    if (enabled.length === 0)
      return false;
    const random = enabled[Math.floor(Math.random() * enabled.length)]!;
    fireTransition(random.id);
    return true;
  }

  function startAutoFire() {
    if (autoFiring.value)
      return;
    autoFiring.value = true;
    autoFireTimer = setInterval(() => {
      if (!fireRandomTransition()) {
        stopAutoFire();
      }
    }, autoFireSpeed.value);
  }

  function stopAutoFire() {
    if (autoFireTimer !== null) {
      clearInterval(autoFireTimer);
      autoFireTimer = null;
    }
    autoFiring.value = false;
  }

  function toggleAutoFire() {
    if (autoFiring.value) {
      stopAutoFire();
    } else {
      startAutoFire();
    }
  }

  async function autoFireN(count: number) {
    for (let i = 0; i < count; i++) {
      if (!fireRandomTransition())
        break;
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, autoFireSpeed.value));
      }
    }
  }

  function setAutoFireSpeed(speed: number) {
    autoFireSpeed.value = speed;
    if (autoFireTimer !== null) {
      stopAutoFire();
      startAutoFire();
    }
  }

  const isNetEmpty = computed(() => elementCount.value === 0);

  function clearNet() {
    if (!cy.value)
      return;
    cy.value.elements().remove();
    placeCount = 0;
    transitionCount = 0;
    undoStack.value = [];
    redoStack.value = [];
    selectedElement.value = null;
    elementCount.value = 0;
  }

  function destroy() {
    cy.value?.destroy();
    cy.value = null;
  }

  return {
    cy,
    petriNet,
    mode,
    selectedElement,
    arcSourceId,
    undoStack,
    redoStack,
    firingHistory,
    autoFiring,
    autoFireSpeed,
    initCy,
    addPlace,
    addTransition,
    addArc,
    deleteElement,
    setTokens,
    incrementTokens,
    setLabel,
    undo,
    redo,
    zoomIn,
    zoomOut,
    zoomToFit,
    applyLayout,
    layoutType,
    exportToJson,
    importFromJson,
    closeProperties,
    revertLastFiring,
    jumpToState,
    clearHistory,
    toggleAutoFire,
    autoFireN,
    setAutoFireSpeed,
    isNetEmpty,
    clearNet,
    destroy,
  };
}
