import type { PetriNetState } from '~/types/petri-net';

export type TabType = 'petri-net' | 'reachability-graph';

export interface PetriNetTab {
  id: string;
  name: string;
  type: 'petri-net';
  petriNet: ReturnType<typeof usePetriNet>;
  extensions: ReturnType<typeof useExtensions>;
}

export interface ReachabilityGraphTab {
  id: string;
  name: string;
  type: 'reachability-graph';
  sourceTabId: string;
  petriNetState: PetriNetState;
}

export type Tab = PetriNetTab | ReachabilityGraphTab;

let tabIdCounter = 0;

function createPetriNetTab(name?: string): PetriNetTab {
  const id = `tab-${++tabIdCounter}`;
  return {
    id,
    name: name ?? `Tab ${tabIdCounter}`,
    type: 'petri-net',
    petriNet: usePetriNet(),
    extensions: useExtensions(),
  };
}

function createReachabilityGraphTab(sourceTab: PetriNetTab): ReachabilityGraphTab {
  const id = `tab-${++tabIdCounter}`;
  return {
    id,
    name: `${sourceTab.name} — Reachability Graph`,
    type: 'reachability-graph',
    sourceTabId: sourceTab.id,
    petriNetState: sourceTab.petriNet.exportToJson(),
  };
}

export function useTabs() {
  const tabs = shallowRef<Tab[]>([createPetriNetTab('Tab 1')]);
  const activeTabId = ref(tabs.value[0]!.id);
  const splitViewId = ref<string | null>(null);

  const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value) ?? tabs.value[0]!);
  const splitViewTab = computed(() => splitViewId.value ? tabs.value.find(t => t.id === splitViewId.value) ?? null : null);

  function addTab() {
    const tab = createPetriNetTab();
    tabs.value = [...tabs.value, tab];
    activeTabId.value = tab.id;
  }

  function openReachabilityGraph(sourceTabId: string) {
    const source = tabs.value.find(t => t.id === sourceTabId);
    if (!source || source.type !== 'petri-net')
      return;
    const tab = createReachabilityGraphTab(source);
    tabs.value = [...tabs.value, tab];
    activeTabId.value = tab.id;
  }

  function closeTab(id: string) {
    if (tabs.value.length <= 1) {
      resetTab(id);
      return;
    }
    const idx = tabs.value.findIndex(t => t.id === id);
    if (idx === -1)
      return;
    const tab = tabs.value[idx]!;
    if (tab.type === 'petri-net') {
      tab.petriNet.destroy();
    }
    if (splitViewId.value === id) {
      splitViewId.value = null;
    }
    const newTabs = tabs.value.filter(t => t.id !== id);
    tabs.value = newTabs;
    if (activeTabId.value === id) {
      const newIdx = Math.min(idx, newTabs.length - 1);
      activeTabId.value = newTabs[newIdx]!.id;
    }
  }

  function resetTab(id: string) {
    const tab = tabs.value.find(t => t.id === id);
    if (!tab || tab.type !== 'petri-net')
      return;
    tab.petriNet.destroy();
    tab.petriNet = usePetriNet();
    tab.extensions = useExtensions();
    tabs.value = [...tabs.value];
  }

  function duplicateTab(id: string) {
    const source = tabs.value.find(t => t.id === id);
    if (!source || source.type !== 'petri-net')
      return;
    const state: PetriNetState = source.petriNet.exportToJson();
    const newTab = createPetriNetTab(source.name);
    newTab.petriNet.importFromJson(state);
    const idx = tabs.value.findIndex(t => t.id === id);
    const newTabs = [...tabs.value];
    newTabs.splice(idx + 1, 0, newTab);
    tabs.value = newTabs;
    activeTabId.value = newTab.id;
  }

  function renameTab(id: string, name: string) {
    const tab = tabs.value.find(t => t.id === id);
    if (!tab)
      return;
    const renamed = { ...tab, name };
    tabs.value = tabs.value.map(t => t.id === id ? renamed : t);
  }

  function switchTab(id: string) {
    activeTabId.value = id;
  }

  function toggleSplitView(id: string) {
    if (splitViewId.value === id) {
      splitViewId.value = null;
    } else {
      splitViewId.value = id;
    }
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    splitViewId,
    splitViewTab,
    addTab,
    openReachabilityGraph,
    closeTab,
    duplicateTab,
    renameTab,
    switchTab,
    toggleSplitView,
  };
}
