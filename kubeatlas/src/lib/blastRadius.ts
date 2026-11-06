/* ============================================================
 * blastRadius — pure BFS over a View graph.
 *
 * Given a View (the same shape the topology canvas already consumes)
 * compute the reachable set from a root node up to a depth limit, in
 * one of three directions:
 *
 *   downstream — follow outgoing edges (default; "what depends on me")
 *   upstream   — follow incoming edges ("what do I depend on")
 *   both       — undirected; intersection rarely matters for ops work
 *
 * Returns the set of reachable node IDs (including the root) and a
 * per-hop bucketing so the right panel can render "1 hop / 2 hop /
 * 3 hop" sections. depth=Infinity means no cap — the BFS runs until
 * the frontier exhausts (still O(V+E)).
 * ============================================================ */
import type { GraphEdge as ViewEdge, GraphView as View } from '../api/types';

export type BlastDirection = 'downstream' | 'upstream' | 'both';

export interface BlastRadiusResult {
  reachable: ReadonlySet<string>;
  byHop: ReadonlyMap<number, string[]>;
  edges: ReadonlyArray<ViewEdge>;
}

export function computeBlastRadius(
  view: View,
  rootId: string,
  direction: BlastDirection,
  depth: number
): BlastRadiusResult {
  const reachable = new Set<string>([rootId]);
  const byHop = new Map<number, string[]>();
  const edges: ViewEdge[] = [];
  byHop.set(0, [rootId]);

  // Adjacency index — built per call. Fine for the v1 scale target
  // (1K nodes); if blast radius becomes a hot path on >10K node
  // graphs, lift the index up to the view-fetch effect.
  const outAdj = new Map<string, ViewEdge[]>();
  const inAdj = new Map<string, ViewEdge[]>();
  for (const e of view.edges) {
    (outAdj.get(e.from) ?? outAdj.set(e.from, []).get(e.from)!).push(e);
    (inAdj.get(e.to) ?? inAdj.set(e.to, []).get(e.to)!).push(e);
  }

  let frontier: string[] = [rootId];
  let hop = 0;
  while (frontier.length && hop < depth) {
    const next: string[] = [];
    for (const id of frontier) {
      const out = direction !== 'upstream' ? outAdj.get(id) ?? [] : [];
      const inc = direction !== 'downstream' ? inAdj.get(id) ?? [] : [];
      for (const e of out) {
        edges.push(e);
        if (!reachable.has(e.to)) {
          reachable.add(e.to);
          next.push(e.to);
        }
      }
      for (const e of inc) {
        edges.push(e);
        if (!reachable.has(e.from)) {
          reachable.add(e.from);
          next.push(e.from);
        }
      }
    }
    hop += 1;
    if (next.length) byHop.set(hop, next);
    frontier = next;
  }

  return { reachable, byHop, edges };
}
