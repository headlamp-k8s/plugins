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

import { useTheme } from '@mui/material/styles';
import cytoscape, { type Core } from 'cytoscape';
import { useEffect, useRef } from 'react';
import { Edge, GraphView } from '../api/types';
import { applyAtlasPalette, buildAtlasStylesheet, elementsFromView } from '../lib/cytoscape';
import { paletteForScheme } from '../lib/themePalettes';

export interface NeighborGraphProps {
  centerId: string;
  centerLabel: string;
  incoming: Edge[];
  outgoing: Edge[];
}

// Parse a KubeAtlas resource id ([clusterID:]<namespace>/<kind>/<name>)
// back into its parts so the cartography stylesheet's family / shape
// rules light up the same way they do in the standalone web UI.
function parseId(id: string): { namespace?: string; kind?: string; name?: string } {
  let rest = id;
  const colon = id.indexOf(':');
  if (colon > -1 && colon < id.indexOf('/')) {
    rest = id.slice(colon + 1);
  }
  const parts = rest.split('/');
  if (parts.length === 3) {
    const [namespace, kind, name] = parts;
    return { namespace: namespace || undefined, kind, name };
  }
  return {};
}

// NeighborGraph renders the one-hop dependency neighbourhood of a
// single resource using the same cartography stylesheet the cluster
// canvas uses. Synthesises a GraphView from (center, incoming,
// outgoing) so elementsFromView + buildAtlasStylesheet can apply the
// node-family shapes + edge-type encoding. Layout stays concentric —
// a star reads better than a force layout for a handful of nodes.
export function NeighborGraph({ centerId, centerLabel, incoming, outgoing }: NeighborGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const theme = useTheme();
  const palette = paletteForScheme(theme.palette.mode === 'dark' ? 'dark' : 'light');

  // Hold the current palette in a ref so the build effect can seed the
  // initial stylesheet without listing `palette` as a dependency —
  // otherwise a theme toggle would destroy and rebuild the whole
  // instance (and rerun layout). Palette changes are handled in place
  // by the applyAtlasPalette effect below.
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    // Build a GraphView whose nodes carry the parsed kind/namespace
    // so the family classifier picks the right shape.
    const seen = new Map<string, ReturnType<typeof parseId>>();
    seen.set(centerId, parseId(centerId));
    for (const e of incoming) if (!seen.has(e.from)) seen.set(e.from, parseId(e.from));
    for (const e of outgoing) if (!seen.has(e.to)) seen.set(e.to, parseId(e.to));

    const view: GraphView = {
      level: 'resource',
      nodes: [...seen.entries()].map(([id, p]) => ({
        id,
        type: 'resource',
        kind: p.kind,
        namespace: p.namespace,
        name: p.name,
        label: id === centerId ? centerLabel : p.kind && p.name ? `${p.kind}/${p.name}` : id,
      })),
      edges: [
        ...incoming.map(e => ({ from: e.from, to: centerId, type: e.type, count: 1 })),
        ...outgoing.map(e => ({ from: centerId, to: e.to, type: e.type, count: 1 })),
      ],
    };

    const cy = cytoscape({
      container,
      elements: elementsFromView(view),
      style: buildAtlasStylesheet(paletteRef.current) as unknown as cytoscape.StylesheetCSS[],
    });
    // Star layout — the centre node sits in the middle, neighbours
    // ring around it. levelWidth=1 forces a single neighbour ring.
    cy.layout({
      name: 'concentric',
      concentric: node => (node.data('id') === centerId ? 2 : 1),
      levelWidth: () => 1,
      minNodeSpacing: 50,
      fit: true,
      padding: 24,
    } as cytoscape.LayoutOptions).run();

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [centerId, centerLabel, incoming, outgoing]);

  // Live palette swap on theme toggle without rerunning layout.
  useEffect(() => {
    if (cyRef.current) {
      applyAtlasPalette(cyRef.current, palette);
    }
  }, [palette]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '420px',
        backgroundColor: palette.bg,
        borderRadius: 2,
      }}
    />
  );
}
