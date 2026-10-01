import { describe, expect, it } from 'vitest';
import { exportToPnml } from '~/utils/pnml';

describe('exportToPnml', () => {
  it('exports a PNML PT-net with names, positions, markings and weights', () => {
    const xml = exportToPnml({
      title: 'Transfer & Test',
      formatVersion: 1,
      elements: [
        { id: 'p1', type: 'place', label: 'Input <A>', tokens: 2, x: 100, y: 150 },
        { id: 't1', type: 'transition', label: 'Fire', x: 250, y: 150 },
        { id: 'a1', type: 'arc', label: '', source: 'p1', target: 't1', weight: 2 },
      ],
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns="http://www.pnml.org/version-2009/grammar/pnml"');
    expect(xml).toContain('type="http://www.pnml.org/version-2009/grammar/ptnet"');
    expect(xml).toContain('<name><text>Transfer &amp; Test</text></name>');
    expect(xml).toContain('<place id="p1">');
    expect(xml).toContain('<name><text>Input &lt;A&gt;</text></name>');
    expect(xml).toContain('<initialMarking><text>2</text></initialMarking>');
    expect(xml).toContain('<position x="100" y="150" />');
    expect(xml).toContain('<arc id="a1" source="p1" target="t1">');
    expect(xml).toContain('<inscription><text>2</text></inscription>');
  });

  it('omits default markings and arc weights', () => {
    const xml = exportToPnml({
      elements: [
        { id: 'p1', type: 'place', label: 'P1', x: 0, y: 0 },
        { id: 't1', type: 'transition', label: 'T1', x: 0, y: 0 },
        { id: 'a1', type: 'arc', label: '', source: 'p1', target: 't1', weight: 1 },
      ],
    });

    expect(xml).not.toContain('<initialMarking>');
    expect(xml).not.toContain('<inscription>');
  });
});
