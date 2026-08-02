import { FakePetriNet } from './fake-petri-net';

export interface PlaceSpec {
  name: string;
  tokens?: number;
}

export interface ArcSpec {
  from: string;
  to: string;
  weight?: number;
}

export function buildNet(places: PlaceSpec[], transitions: string[], arcs: ArcSpec[]): FakePetriNet {
  const net = new FakePetriNet();
  const placeIds = new Map<string, string>();
  const transitionIds = new Map<string, string>();

  for (const place of places) {
    const added = net.addPlace(0, 0, place.name);
    placeIds.set(place.name, added.id);
    if (place.tokens) {
      net.setTokens(added.id, place.tokens);
    }
  }
  for (const name of transitions) {
    const added = net.addTransition(0, 0, name);
    transitionIds.set(name, added.id);
  }
  for (const arc of arcs) {
    net.addArc(
      placeIds.get(arc.from) ?? transitionIds.get(arc.from)!,
      placeIds.get(arc.to) ?? transitionIds.get(arc.to)!,
      arc.weight,
    );
  }
  return net;
}

export function placeId(net: FakePetriNet, label: string): string {
  return net.getPlaces().find(place => place.label === label)!.id;
}

export function transitionId(net: FakePetriNet, label: string): string {
  return net.getTransitions().find(transition => transition.label === label)!.id;
}
