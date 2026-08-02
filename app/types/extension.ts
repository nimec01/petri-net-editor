import type { Core } from 'cytoscape';
import type { Component } from 'vue';
import type { IPetriNet } from './petri-net-core';

export interface ExtensionContext {
  net: IPetriNet;
  cy: Core;
}

export interface PetriNetExtension {
  id: string;
  name: string;
  icon: Component;
  fullWidth?: boolean;
  run: (ctx: ExtensionContext) => Component | null;
}
