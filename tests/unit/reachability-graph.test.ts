import { describe, expect, it } from 'vitest';
import { buildReachabilityGraph, createReachabilityGraphBuilder } from '~/utils/reachability-graph';
import { buildNet, placeId, transitionId } from '../helpers/build-net';

describe('reachability-graph', () => {
  it('builds an empty graph for a net without places', () => {
    const net = buildNet([], ['t1'], []);

    const graph = buildReachabilityGraph(net);

    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it('builds a graph for a transfer net', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }, { name: 'p2' }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p2' }],
    );

    const graph = buildReachabilityGraph(net);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes[0]).toEqual({
      id: 0,
      marking: { [placeId(net, 'p1')]: 1, [placeId(net, 'p2')]: 0 },
      depth: 0,
      deadlock: false,
    });
    expect(graph.nodes[1]).toEqual({
      id: 1,
      marking: { [placeId(net, 'p1')]: 0, [placeId(net, 'p2')]: 1 },
      depth: 1,
      deadlock: true,
    });
    expect(graph.edges).toEqual([{
      id: 0,
      source: 0,
      target: 1,
      transitionId: transitionId(net, 't1'),
      transitionLabel: 't1',
    }]);
  });

  it('marks an initially deadlocked marking', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 0 }, { name: 'p2' }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p2' }],
    );

    const graph = buildReachabilityGraph(net);

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0]!.deadlock).toBe(true);
    expect(graph.edges).toEqual([]);
  });

  it('detects a self-loop transition that returns to the same marking', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p1' }],
    );

    const graph = buildReachabilityGraph(net);

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0]!.deadlock).toBe(false);
    expect(graph.edges).toEqual([{
      id: 0,
      source: 0,
      target: 0,
      transitionId: transitionId(net, 't1'),
      transitionLabel: 't1',
    }]);
  });

  it('honours the limit while building an unbounded net', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p1', weight: 2 }],
    );

    const graph = buildReachabilityGraph(net, 3);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
    expect(graph.nodes.map(node => node.marking)).toEqual([
      { [placeId(net, 'p1')]: 1 },
      { [placeId(net, 'p1')]: 2 },
      { [placeId(net, 'p1')]: 3 },
    ]);
  });

  it('expands the graph on demand via the builder', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p1', weight: 2 }],
    );

    const builder = createReachabilityGraphBuilder(net, 3);

    expect(builder.nodeCount).toBe(1);
    expect(builder.maxDepth).toBe(0);

    builder.expandTo(3);
    expect(builder.nodeCount).toBe(3);
    expect(builder.edgeCount).toBe(2);
    expect(builder.maxDepth).toBe(2);
    expect(builder.isComplete).toBe(false);
    expect(builder.limit).toBe(3);

    builder.expandTo(5);
    expect(builder.nodeCount).toBe(5);

    builder.expandMore(2);
    expect(builder.nodeCount).toBe(7);
    expect(builder.maxDepth).toBe(6);
  });

  it('reports complete for a finite reachability graph', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }, { name: 'p2' }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p2' }],
    );

    const builder = createReachabilityGraphBuilder(net, 10);
    builder.expandTo(10);

    expect(builder.nodeCount).toBe(2);
    expect(builder.isComplete).toBe(true);
  });

  it('honours an explicitly provided initial marking', () => {
    const net = buildNet(
      [{ name: 'p1' }, { name: 'p2' }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p2' }],
    );

    const builder = createReachabilityGraphBuilder(net, 10, { [placeId(net, 'p2')]: 1 });
    builder.expandTo(10);

    expect(builder.nodeCount).toBe(1);
    expect(builder.graph.nodes[0]!.marking).toEqual({ [placeId(net, 'p2')]: 1 });
    expect(builder.graph.nodes[0]!.deadlock).toBe(true);
  });

  it('builds the full graph of a choice net', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }, { name: 'q' }, { name: 'r' }],
      ['t1', 't2'],
      [
        { from: 'p1', to: 't1' },
        { from: 'p1', to: 't2' },
        { from: 't1', to: 'q' },
        { from: 't2', to: 'r' },
      ],
    );

    const graph = buildReachabilityGraph(net);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
    expect(graph.nodes[0]!.deadlock).toBe(false);
    expect(graph.nodes[1]!.deadlock).toBe(true);
    expect(graph.nodes[2]!.deadlock).toBe(true);
  });

  it('builds the graph of a sequential net and tracks depth', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }, { name: 'p2' }, { name: 'p3' }],
      ['t1', 't2'],
      [
        { from: 'p1', to: 't1' },
        { from: 't1', to: 'p2' },
        { from: 'p2', to: 't2' },
        { from: 't2', to: 'p3' },
      ],
    );

    const builder = createReachabilityGraphBuilder(net);
    builder.expandTo(100);

    expect(builder.nodeCount).toBe(3);
    expect(builder.maxDepth).toBe(2);
    expect(builder.graph.nodes.map(node => node.depth)).toEqual([0, 1, 2]);
  });

  it('respects combined arc weights when deciding enabled transitions', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }, { name: 'p2' }],
      ['t1'],
      [
        { from: 'p1', to: 't1', weight: 1 },
        { from: 'p1', to: 't1', weight: 1 },
        { from: 't1', to: 'p2' },
      ],
    );

    const graph = buildReachabilityGraph(net);

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0]!.deadlock).toBe(true);
  });
});
