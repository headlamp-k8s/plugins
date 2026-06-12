/*
 * Copyright 2026 The KubeAtlas Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it } from 'vitest';
import type { GraphView } from '../api/types';
import { computeBlastRadius } from './blastRadius';

// view builds a minimal GraphView from a list of [from, to] edges.
// computeBlastRadius only reads view.edges, so nodes stay empty.
function view(...edges: [string, string][]): GraphView {
  return {
    level: 'resource',
    nodes: [],
    edges: edges.map(([from, to]) => ({ from, to, type: 'OWNS', count: 1 })),
  };
}

// A simple chain a -> b -> c -> d.
const chain = view(['a', 'b'], ['b', 'c'], ['c', 'd']);

describe('computeBlastRadius', () => {
  it('always includes the root at hop 0', () => {
    const r = computeBlastRadius(view(), 'a', 'downstream', Infinity);
    expect(r.reachable.has('a')).toBe(true);
    expect([...r.reachable]).toEqual(['a']);
    expect(r.byHop.get(0)).toEqual(['a']);
  });

  it('walks outgoing edges in downstream mode', () => {
    const r = computeBlastRadius(chain, 'a', 'downstream', Infinity);
    expect([...r.reachable].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(r.byHop.get(1)).toEqual(['b']);
    expect(r.byHop.get(2)).toEqual(['c']);
    expect(r.byHop.get(3)).toEqual(['d']);
  });

  it('does not walk backwards in downstream mode', () => {
    // Rooted at the tail of the chain, downstream finds nothing.
    const r = computeBlastRadius(chain, 'd', 'downstream', Infinity);
    expect([...r.reachable]).toEqual(['d']);
  });

  it('walks incoming edges in upstream mode', () => {
    const r = computeBlastRadius(chain, 'd', 'upstream', Infinity);
    expect([...r.reachable].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(r.byHop.get(1)).toEqual(['c']);
    expect(r.byHop.get(2)).toEqual(['b']);
    expect(r.byHop.get(3)).toEqual(['a']);
  });

  it('walks both directions in both mode', () => {
    // b sits in the middle; both reaches the whole chain from it.
    const r = computeBlastRadius(chain, 'b', 'both', Infinity);
    expect([...r.reachable].sort()).toEqual(['a', 'b', 'c', 'd']);
    // a (incoming) and c (outgoing) are both one hop away.
    expect(r.byHop.get(1)?.sort()).toEqual(['a', 'c']);
  });

  it('respects the depth limit', () => {
    const r = computeBlastRadius(chain, 'a', 'downstream', 2);
    expect([...r.reachable].sort()).toEqual(['a', 'b', 'c']);
    expect(r.reachable.has('d')).toBe(false);
    expect(r.byHop.has(3)).toBe(false);
  });

  it('depth 0 yields only the root', () => {
    const r = computeBlastRadius(chain, 'a', 'downstream', 0);
    expect([...r.reachable]).toEqual(['a']);
    expect(r.byHop.get(1)).toBeUndefined();
  });

  it('terminates on a cycle without revisiting nodes', () => {
    // a -> b -> c -> a is a 3-cycle.
    const cyclic = view(['a', 'b'], ['b', 'c'], ['c', 'a']);
    const r = computeBlastRadius(cyclic, 'a', 'downstream', Infinity);
    expect([...r.reachable].sort()).toEqual(['a', 'b', 'c']);
    // Each non-root node is discovered exactly once, at its first hop.
    expect(r.byHop.get(1)).toEqual(['b']);
    expect(r.byHop.get(2)).toEqual(['c']);
    expect(r.byHop.get(3)).toBeUndefined();
  });

  it('terminates on a self-loop', () => {
    const r = computeBlastRadius(view(['a', 'a']), 'a', 'downstream', Infinity);
    expect([...r.reachable]).toEqual(['a']);
  });

  it('handles a diamond without double-counting the join node', () => {
    // a -> b, a -> c, b -> d, c -> d.
    const diamond = view(['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd']);
    const r = computeBlastRadius(diamond, 'a', 'downstream', Infinity);
    expect([...r.reachable].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(r.byHop.get(1)?.sort()).toEqual(['b', 'c']);
    // d is reached once, on its first (second-hop) discovery.
    expect(r.byHop.get(2)).toEqual(['d']);
  });
});
