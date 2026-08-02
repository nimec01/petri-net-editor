import type { Component } from 'vue';
import type { ExtensionContext, PetriNetExtension } from '~/types/extension';
import { ref, shallowRef } from 'vue';

export function useExtensions() {
  const extensions = ref<PetriNetExtension[]>([]);
  const activeExtension = shallowRef<PetriNetExtension | null>(null);
  const resultComponent = shallowRef<Component | null>(null);
  const drawerOpen = ref(false);

  function register(extension: PetriNetExtension) {
    if (extensions.value.some(e => e.id === extension.id)) {
      console.warn(`Extension "${extension.id}" is already registered.`);
      return;
    }
    extensions.value.push(extension);
  }

  function openExtension(id: string, ctx: ExtensionContext) {
    const extension = extensions.value.find(e => e.id === id);
    if (!extension)
      return;
    activeExtension.value = extension;
    resultComponent.value = extension.run(ctx);
    drawerOpen.value = false;
  }

  function closeExtension() {
    activeExtension.value = null;
    resultComponent.value = null;
  }

  function toggleDrawer() {
    drawerOpen.value = !drawerOpen.value;
  }

  return {
    extensions,
    activeExtension,
    resultComponent,
    drawerOpen,
    register,
    openExtension,
    closeExtension,
    toggleDrawer,
  };
}
