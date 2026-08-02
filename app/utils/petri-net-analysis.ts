import type { IPetriNet, Marking, Place } from '~/types/petri-net-core';
import type { ReachabilityEdge, ReachabilityGraphData } from '~/utils/reachability-graph';
import { createReachabilityGraphBuilder, DEFAULT_REACHABILITY_LIMIT } from '~/utils/reachability-graph';

export interface TransitionLiveness {
  id: string;
  label: string;
  enabled: boolean;
  live: boolean;
}

export interface LivenessAnalysis {
  transitions: TransitionLiveness[];
  allLive: boolean;
}

export interface PathStep {
  id: string;
  label: string;
}

export interface DeadlockMarking {
  nodeId: number;
  marking: Marking;
  path: PathStep[];
}

export interface DeadlockAnalysis {
  deadlocks: DeadlockMarking[];
  exists: boolean;
}

export interface PlaceSafeness {
  id: string;
  label: string;
  maxTokens: number;
  safe: boolean;
}

export interface ArcWeightEntry {
  id: string;
  sourceLabel: string;
  targetLabel: string;
  weight: number;
}

export interface ArcWeightSafeness {
  arcs: ArcWeightEntry[];
  allSmall: boolean;
}

export interface SafenessAnalysis {
  places: PlaceSafeness[];
  allPlacesSafe: boolean;
  weights: ArcWeightSafeness;
}

export interface ReachabilityAnalysis {
  target: Marking;
  found: boolean;
  nodeId: number | null;
  path: PathStep[];
}

export interface PlaceBound {
  id: string;
  label: string;
  maxTokens: number;
  bounded: boolean;
}

export interface BoundednessWitnessMarking {
  nodeId: number;
  marking: Marking;
  path: PathStep[];
}

export interface BoundednessWitness {
  smaller: BoundednessWitnessMarking;
  larger: BoundednessWitnessMarking;
  increasedPlaceIds: string[];
}

export interface BoundednessAnalysis {
  bound: number;
  places: PlaceBound[];
  provenUnbounded: boolean;
  witness: BoundednessWitness | null;
}

export interface NetAnalysis {
  limit: number;
  nodeCount: number;
  complete: boolean;
  liveness: LivenessAnalysis;
  deadlock: DeadlockAnalysis;
  safeness: SafenessAnalysis;
  boundedness: BoundednessAnalysis;
  reachability: ReachabilityAnalysis;
}

interface TransitionSpec {
  id: string;
  label: string;
  pre: Marking;
}

export function normalizeLimit(value: number, fallback = DEFAULT_REACHABILITY_LIMIT): number {
  const normalized = Math.floor(value);
  return Number.isFinite(normalized) && normalized >= 1 ? normalized : fallback;
}

function isEnabledAt(marking: Marking, pre: Marking): boolean {
  if (Object.keys(pre).length === 0) {
    return false;
  }
  return Object.entries(pre).every(([placeId, weight]) => (marking[placeId] || 0) >= weight);
}

function buildTransitionSpecs(net: IPetriNet): TransitionSpec[] {
  return net.getTransitions().map(transition => ({
    id: transition.id,
    label: transition.label,
    pre: net.getPreMarking(transition.id),
  }));
}

function computeLiveness(graph: ReachabilityGraphData, transitions: TransitionSpec[]): LivenessAnalysis {
  const nodeCount = graph.nodes.length;
  const enabledMatrix = graph.nodes.map(node => transitions.map(spec => isEnabledAt(node.marking, spec.pre)));

  const incoming: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const edge of graph.edges) {
    incoming[edge.target]!.push(edge.source);
  }

  const results = transitions.map((_spec, index) => {
    let anyEnabled = false;
    const canReach = Array.from({ length: nodeCount }).fill(false);
    const queue: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      if (enabledMatrix[i]![index]) {
        anyEnabled = true;
        canReach[i] = true;
        queue.push(i);
      }
    }
    while (queue.length > 0) {
      const current = queue.pop()!;
      for (const predecessor of incoming[current]!) {
        if (!canReach[predecessor]) {
          canReach[predecessor] = true;
          queue.push(predecessor);
        }
      }
    }
    return {
      enabled: anyEnabled,
      live: nodeCount > 0 && canReach.every(Boolean),
    };
  });

  return {
    transitions: transitions.map((spec, index) => ({
      id: spec.id,
      label: spec.label,
      enabled: results[index]!.enabled,
      live: results[index]!.live,
    })),
    allLive: transitions.length > 0 && results.every(result => result.live),
  };
}

function computeMaxTokens(graph: ReachabilityGraphData, places: Place[]): PlaceBound[] {
  return places.map((place) => {
    let maxTokens = 0;
    for (const node of graph.nodes) {
      const tokens = node.marking[place.id] || 0;
      if (tokens > maxTokens) {
        maxTokens = tokens;
      }
    }
    return {
      id: place.id,
      label: place.label,
      maxTokens,
      bounded: true,
    };
  });
}

function computeSafeness(graph: ReachabilityGraphData, places: Place[]): Omit<SafenessAnalysis, 'weights'> {
  const placeResults = computeMaxTokens(graph, places).map(result => ({
    id: result.id,
    label: result.label,
    maxTokens: result.maxTokens,
    safe: result.maxTokens <= 1,
  }));

  return {
    places: placeResults,
    allPlacesSafe: placeResults.length > 0 && placeResults.every(result => result.safe),
  };
}

function computeWeightSafeness(net: IPetriNet): ArcWeightSafeness {
  const labelById = new Map<string, string>();
  for (const place of net.getPlaces()) {
    labelById.set(place.id, place.label);
  }
  for (const transition of net.getTransitions()) {
    labelById.set(transition.id, transition.label);
  }

  const arcs = net.getArcs().map(arc => ({
    id: arc.id,
    sourceLabel: labelById.get(arc.source) ?? arc.source,
    targetLabel: labelById.get(arc.target) ?? arc.target,
    weight: arc.weight,
  }));

  return {
    arcs,
    allSmall: arcs.every(arc => arc.weight < 2),
  };
}

function buildPaths(graph: ReachabilityGraphData): Map<number, PathStep[]> {
  const paths = new Map<number, PathStep[]>();
  if (graph.nodes.length === 0) {
    return paths;
  }

  const outgoing: ReachabilityEdge[][] = Array.from({ length: graph.nodes.length }, () => []);
  for (const edge of graph.edges) {
    outgoing[edge.source]!.push(edge);
  }

  const queue: number[] = [];
  paths.set(0, []);
  queue.push(0);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentPath = paths.get(current)!;
    for (const edge of outgoing[current]!) {
      if (!paths.has(edge.target)) {
        paths.set(edge.target, [...currentPath, { id: edge.transitionId, label: edge.transitionLabel }]);
        queue.push(edge.target);
      }
    }
  }
  return paths;
}

function markingsEqual(a: Marking, b: Marking): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] || 0) !== (b[key] || 0)) {
      return false;
    }
  }
  return true;
}

function strictlyDominates(a: Marking, b: Marking): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let strictlyGreater = false;
  for (const key of keys) {
    const av = a[key] || 0;
    const bv = b[key] || 0;
    if (av < bv) {
      return false;
    }
    if (av > bv) {
      strictlyGreater = true;
    }
  }
  return strictlyGreater;
}

function computeReachability(graph: ReachabilityGraphData, target: Marking, paths: Map<number, PathStep[]>): ReachabilityAnalysis {
  for (const node of graph.nodes) {
    if (markingsEqual(node.marking, target)) {
      return {
        target: { ...target },
        found: true,
        nodeId: node.id,
        path: paths.get(node.id) ?? [],
      };
    }
  }
  return {
    target: { ...target },
    found: false,
    nodeId: null,
    path: [],
  };
}

function computeBoundedness(graph: ReachabilityGraphData, places: Place[], paths: Map<number, PathStep[]>): BoundednessAnalysis {
  const placeResults = computeMaxTokens(graph, places);

  for (let i = 0; i < graph.nodes.length; i++) {
    for (let j = 0; j < graph.nodes.length; j++) {
      if (i === j) {
        continue;
      }
      const larger = graph.nodes[i]!;
      const smaller = graph.nodes[j]!;
      if (!strictlyDominates(larger.marking, smaller.marking)) {
        continue;
      }
      const increasedPlaceIds = places
        .filter(place => (larger.marking[place.id] || 0) > (smaller.marking[place.id] || 0))
        .map(place => place.id);
      const increasedSet = new Set(increasedPlaceIds);
      return {
        bound: Infinity,
        places: placeResults.map(result => ({ ...result, bounded: !increasedSet.has(result.id) })),
        provenUnbounded: true,
        witness: {
          smaller: { nodeId: smaller.id, marking: { ...smaller.marking }, path: paths.get(smaller.id) ?? [] },
          larger: { nodeId: larger.id, marking: { ...larger.marking }, path: paths.get(larger.id) ?? [] },
          increasedPlaceIds,
        },
      };
    }
  }

  return {
    bound: Math.max(0, ...placeResults.map(result => result.maxTokens)),
    places: placeResults,
    provenUnbounded: false,
    witness: null,
  };
}

export function analyzePetriNet(net: IPetriNet, limit = DEFAULT_REACHABILITY_LIMIT, target?: Marking): NetAnalysis {
  const builder = createReachabilityGraphBuilder(net, limit);
  builder.expandTo(limit);
  const graph = builder.graph;

  const transitions = buildTransitionSpecs(net);
  const places = net.getPlaces();

  const liveness = computeLiveness(graph, transitions);
  const paths = buildPaths(graph);
  const deadlockMarkings = graph.nodes
    .filter(node => node.deadlock)
    .map(node => ({
      nodeId: node.id,
      marking: { ...node.marking },
      path: paths.get(node.id) ?? [],
    }));
  const safeness: SafenessAnalysis = {
    ...computeSafeness(graph, places),
    weights: computeWeightSafeness(net),
  };
  const boundedness = computeBoundedness(graph, places, paths);
  const reachability = computeReachability(graph, target ?? {}, paths);

  return {
    limit: builder.limit,
    nodeCount: builder.nodeCount,
    complete: builder.isComplete,
    liveness,
    deadlock: { deadlocks: deadlockMarkings, exists: deadlockMarkings.length > 0 },
    safeness,
    boundedness,
    reachability,
  };
}
