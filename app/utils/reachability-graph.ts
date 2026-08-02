import type { IPetriNet, Marking } from '~/types/petri-net-core';

export interface ReachabilityNode {
  id: number;
  marking: Marking;
  depth: number;
  deadlock: boolean;
}

export interface ReachabilityEdge {
  id: number;
  source: number;
  target: number;
  transitionId: string;
  transitionLabel: string;
}

export interface ReachabilityGraphData {
  nodes: ReachabilityNode[];
  edges: ReachabilityEdge[];
}

export interface ReachabilityGraphBuilder {
  readonly graph: ReachabilityGraphData;
  readonly limit: number;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly maxDepth: number;
  readonly isComplete: boolean;
  expandTo: (limit: number) => void;
  expandMore: (count: number) => void;
}

interface TransitionSpec {
  id: string;
  label: string;
  pre: Marking;
  post: Marking;
}

interface FrontierEntry {
  nodeId: number;
  cursor: number;
}

export const DEFAULT_REACHABILITY_LIMIT = 100;

function markingKey(marking: Marking): string {
  return Object.keys(marking)
    .sort()
    .map(id => `${id}:${marking[id]}`)
    .join(';');
}

function isEnabled(marking: Marking, pre: Marking): boolean {
  if (Object.keys(pre).length === 0) {
    return false;
  }
  return Object.entries(pre).every(([placeId, weight]) => (marking[placeId] || 0) >= weight);
}

function isDeadlock(marking: Marking, transitions: TransitionSpec[]): boolean {
  return !transitions.some(spec => isEnabled(marking, spec.pre));
}

function applyFiring(marking: Marking, spec: TransitionSpec): Marking {
  const next: Marking = { ...marking };
  for (const [placeId, weight] of Object.entries(spec.pre)) {
    next[placeId] = (next[placeId] || 0) - weight;
  }
  for (const [placeId, weight] of Object.entries(spec.post)) {
    next[placeId] = (next[placeId] || 0) + weight;
  }
  return next;
}

export function createReachabilityGraphBuilder(
  net: IPetriNet,
  limit = DEFAULT_REACHABILITY_LIMIT,
  initialMarking?: Marking,
): ReachabilityGraphBuilder {
  const transitions: TransitionSpec[] = net.getTransitions().map(transition => ({
    id: transition.id,
    label: transition.label,
    pre: net.getPreMarking(transition.id),
    post: net.getPostMarking(transition.id),
  }));

  const graph: ReachabilityGraphData = { nodes: [], edges: [] };
  const markingIndex = new Map<string, number>();
  const frontier: FrontierEntry[] = [];
  let head = 0;
  let currentLimit = Math.max(1, Math.floor(limit));
  let maxDepth = 0;

  if (net.getPlaces().length > 0) {
    const initial = initialMarking ?? net.getMarking();
    const initialKey = markingKey(initial);
    markingIndex.set(initialKey, 0);
    graph.nodes.push({
      id: 0,
      marking: { ...initial },
      depth: 0,
      deadlock: isDeadlock(initial, transitions),
    });
    frontier.push({ nodeId: 0, cursor: 0 });
  }

  function expand() {
    while (head < frontier.length && graph.nodes.length < currentLimit) {
      const entry = frontier[head]!;
      const node = graph.nodes[entry.nodeId]!;
      while (entry.cursor < transitions.length) {
        if (graph.nodes.length >= currentLimit) {
          break;
        }
        const spec = transitions[entry.cursor]!;
        entry.cursor++;
        if (!isEnabled(node.marking, spec.pre)) {
          continue;
        }
        const next = applyFiring(node.marking, spec);
        const key = markingKey(next);
        let targetId = markingIndex.get(key);
        if (targetId === undefined) {
          targetId = graph.nodes.length;
          markingIndex.set(key, targetId);
          graph.nodes.push({
            id: targetId,
            marking: next,
            depth: node.depth + 1,
            deadlock: isDeadlock(next, transitions),
          });
          maxDepth = Math.max(maxDepth, node.depth + 1);
          frontier.push({ nodeId: targetId, cursor: 0 });
        }
        graph.edges.push({
          id: graph.edges.length,
          source: entry.nodeId,
          target: targetId,
          transitionId: spec.id,
          transitionLabel: spec.label,
        });
      }
      if (entry.cursor >= transitions.length) {
        head++;
      } else {
        break;
      }
    }
    if (head > 0) {
      frontier.splice(0, head);
      head = 0;
    }
  }

  return {
    get graph() {
      return graph;
    },
    get limit() {
      return currentLimit;
    },
    get nodeCount() {
      return graph.nodes.length;
    },
    get edgeCount() {
      return graph.edges.length;
    },
    get maxDepth() {
      return maxDepth;
    },
    get isComplete() {
      return frontier.length === 0;
    },
    expandTo(newLimit: number) {
      currentLimit = Math.max(1, Math.floor(newLimit));
      expand();
    },
    expandMore(count: number) {
      const extra = Math.max(1, Math.floor(count));
      currentLimit = graph.nodes.length + extra;
      expand();
    },
  };
}

export function buildReachabilityGraph(
  net: IPetriNet,
  limit = DEFAULT_REACHABILITY_LIMIT,
): ReachabilityGraphData {
  const builder = createReachabilityGraphBuilder(net, limit);
  builder.expandTo(limit);
  return builder.graph;
}
