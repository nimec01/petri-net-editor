import type { Core, EventObject, NodeSingular } from 'cytoscape';
import type { Command, EditorMode, PetriNetElementData, PetriNetState } from '~/types/petri-net';
import type { IPetriNet } from '~/types/petri-net-core';
import cytoscape from 'cytoscape';
import { ref, shallowRef } from 'vue';
import { CytoscapePetriNet } from '~/types/cytoscape-petri-net';

let nextId = 1;

function generateId(): string {
  return `el-${nextId++}`;
}

const petriNetStylesheet: cytoscape.StylesheetJson = [
  {
    selector: 'node[type="place"]',
    style: {
      'shape': 'ellipse',
      'background-color': '#ffffff',
      'border-color': '#374151',
      'border-width': 2,
      'label': 'data(label)',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 10,
      'width': 60,
      'height': 60,
      'font-size': '12px',
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
    selector: 'node[type="place"][tokens > 0]',
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
];

export function usePetriNet() {
  const cy = shallowRef<Core | null>(null);
  const petriNet = shallowRef<IPetriNet | null>(null);
  const mode = ref<EditorMode>('select');
  const selectedElement = ref<PetriNetElementData | null>(null);
  const arcSourceId = ref<string | null>(null);

  watch(mode, (newMode) => {
    if (newMode !== 'select') {
      cy.value?.elements().unselect();
      selectedElement.value = null;
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
      selectedElement.value = {
        id: ele.id(),
        type: ele.data('type'),
        label: ele.data('label') || '',
        tokens: ele.data('tokens'),
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
    const id = ele.id();
    const type = ele.data('type') as string;

    switch (mode.value) {
      case 'delete':
        deleteElement(id);
        break;
      case 'arc':
        handleArcTap(id, type);
        break;
      case 'token':
        if (type === 'place') {
          incrementTokens(id);
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
    cy.value?.add({
      group: 'nodes',
      data: { id, type: 'place', label, tokens: 0 },
      position: { x, y },
    });
    pushUndo({ type: 'add', elementData: { id, type: 'place', label, tokens: 0 } });
    return id;
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
    pushUndo({ type: 'add', elementData: { id, type: 'transition', label } });
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
    return id;
  }

  function deleteElement(id: string) {
    const ele = cy.value?.getElementById(id);
    if (!ele || ele.length === 0)
      return;

    const elementData: PetriNetElementData = {
      id: ele.id(),
      type: ele.data('type'),
      label: ele.data('label') || '',
      tokens: ele.data('tokens'),
      source: ele.data('source'),
      target: ele.data('target'),
    };

    if (selectedElement.value?.id === id) {
      selectedElement.value = null;
    }

    ele.remove();
    pushUndo({ type: 'delete', elementData });
  }

  function setTokens(id: string, count: number) {
    const ele = cy.value?.getElementById(id);
    if (!ele || ele.length === 0)
      return;

    const previousTokens = ele.data('tokens') as number;
    ele.data('tokens', Math.max(0, count));

    if (selectedElement.value?.id === id) {
      selectedElement.value = { ...selectedElement.value, tokens: Math.max(0, count) };
    }

    pushUndo({
      type: 'modify',
      elementData: { id, type: 'place', label: ele.data('label'), tokens: Math.max(0, count) },
      previousData: { id, type: 'place', label: ele.data('label'), tokens: previousTokens },
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
      } else {
        cy.value.add({
          group: 'nodes',
          data: { id: data.id, type: data.type, label: data.label, tokens: data.tokens },
        });
      }
    } else if (cmd.type === 'modify' && cmd.previousData) {
      const ele = cy.value.getElementById(cmd.previousData.id);
      if (ele.length > 0) {
        ele.data('label', cmd.previousData.label);
        if (cmd.previousData.tokens !== undefined) {
          ele.data('tokens', cmd.previousData.tokens);
        }
        if (selectedElement.value?.id === cmd.previousData.id) {
          selectedElement.value = {
            id: cmd.previousData.id,
            type: cmd.previousData.type,
            label: cmd.previousData.label,
            tokens: cmd.previousData.tokens,
            source: cmd.previousData.source,
            target: cmd.previousData.target,
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
      } else {
        cy.value.add({
          group: 'nodes',
          data: { id: data.id, type: data.type, label: data.label, tokens: data.tokens },
        });
      }
    } else if (cmd.type === 'delete') {
      cy.value.getElementById(cmd.elementData.id).remove();
      if (selectedElement.value?.id === cmd.elementData.id) {
        selectedElement.value = null;
      }
    } else if (cmd.type === 'modify') {
      const ele = cy.value.getElementById(cmd.elementData.id);
      if (ele.length > 0) {
        ele.data('label', cmd.elementData.label);
        if (cmd.elementData.tokens !== undefined) {
          ele.data('tokens', cmd.elementData.tokens);
        }
        if (selectedElement.value?.id === cmd.elementData.id) {
          selectedElement.value = {
            id: cmd.elementData.id,
            type: cmd.elementData.type,
            label: cmd.elementData.label,
            tokens: cmd.elementData.tokens,
            source: cmd.elementData.source,
            target: cmd.elementData.target,
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

  function exportToJson(): PetriNetState {
    if (!cy.value)
      return { elements: [] };
    const elements: PetriNetElementData[] = cy.value.elements().map(ele => ({
      id: ele.id(),
      type: ele.data('type'),
      label: ele.data('label') || '',
      tokens: ele.data('tokens'),
      source: ele.data('source'),
      target: ele.data('target'),
      x: ele.isNode() ? ele.position('x') : undefined,
      y: ele.isNode() ? ele.position('y') : undefined,
    }));
    return { elements };
  }

  function importFromJson(state: PetriNetState) {
    if (!cy.value)
      return;
    cy.value.elements().remove();
    placeCount = 0;
    transitionCount = 0;
    for (const el of state.elements) {
      if (el.type === 'arc') {
        cy.value.add({
          group: 'edges',
          data: { id: el.id, type: 'arc', source: el.source, target: el.target },
        });
      } else {
        if (el.type === 'place')
          placeCount++;
        if (el.type === 'transition')
          transitionCount++;
        cy.value.add({
          group: 'nodes',
          data: { id: el.id, type: el.type, label: el.label, tokens: el.tokens },
          position: { x: el.x ?? 0, y: el.y ?? 0 },
        });
      }
    }
    cy.value.fit(undefined, 50);
    undoStack.value = [];
    redoStack.value = [];
    selectedElement.value = null;
    nextId = state.elements.length + 1;
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
    exportToJson,
    importFromJson,
    closeProperties,
    destroy,
  };
}
