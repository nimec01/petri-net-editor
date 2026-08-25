import type { PetriNetState } from '~/types/petri-net';

export interface Tab {
  id: string;
  name: string;
  petriNet: ReturnType<typeof usePetriNet>;
  extensions: ReturnType<typeof useExtensions>;
}

let tabIdCounter = 0;

function createTab(name?: string): Tab {
  const id = `tab-${++tabIdCounter}`;
  return {
    id,
    name: name ?? `Tab ${tabIdCounter}`,
    petriNet: usePetriNet(),
    extensions: useExtensions(),
  };
}

export function useTabs() {
  const tabs = shallowRef<Tab[]>([createTab('Tab 1')]);
  const activeTabId = ref(tabs.value[0]!.id);

  const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value) ?? tabs.value[0]!);

  function addTab() {
    const tab = createTab();
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
    tabs.value[idx]!.petriNet.destroy();
    const newTabs = tabs.value.filter(t => t.id !== id);
    tabs.value = newTabs;
    if (activeTabId.value === id) {
      const newIdx = Math.min(idx, newTabs.length - 1);
      activeTabId.value = newTabs[newIdx]!.id;
    }
  }

  function resetTab(id: string) {
    const tab = tabs.value.find(t => t.id === id);
    if (!tab)
      return;
    tab.petriNet.destroy();
    tab.petriNet = usePetriNet();
    tab.extensions = useExtensions();
    tabs.value = [...tabs.value];
  }

  function duplicateTab(id: string) {
    const source = tabs.value.find(t => t.id === id);
    if (!source)
      return;
    const state: PetriNetState = source.petriNet.exportToJson();
    const newTab = createTab();
    newTab.petriNet.importFromJson(state);
    const idx = tabs.value.findIndex(t => t.id === id);
    const newTabs = [...tabs.value];
    newTabs.splice(idx + 1, 0, newTab);
    tabs.value = newTabs;
    activeTabId.value = newTab.id;
  }

  function switchTab(id: string) {
    activeTabId.value = id;
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    addTab,
    closeTab,
    duplicateTab,
    switchTab,
  };
}
