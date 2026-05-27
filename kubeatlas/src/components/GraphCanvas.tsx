/*
 * Copyright 2026 The KubeAtlas Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useTheme } from '@mui/material/styles';
import type { Core, EventObject } from 'cytoscape';
import { useEffect, useRef } from 'react';
import { GraphView } from '../api/types';
import {
  applyAtlasPalette,
  createCytoscape,
  updateCytoscape,
} from '../lib/cytoscape';
import { paletteForScheme } from '../lib/themePalettes';

export interface GraphCanvasProps {
  graph: GraphView;
  // onSelect fires with a node id when the operator taps a node, or
  // null when the canvas background is tapped (clear-selection
  // gesture). The parent owns the detail drawer that surfaces the
  // node's incoming/outgoing edges.
  onSelect?: (nodeId: string | null) => void;
  // reachable, when non-null, holds the set of node ids that stay
  // bright in blast-radius mode; every other node + edge picks up
  // the `dimmed` data flag and fades to ~20% via the cartography
  // node[?dimmed] / edge[?dimmed] rules. null clears the dim pass.
  reachable?: ReadonlySet<string> | null;
}

// GraphCanvas renders a KubeAtlas aggregated view with the same
// cartography stylesheet the standalone web UI uses. Lifecycle is
// direct: create on mount, update on view change via cy.json,
// applyAtlasPalette on theme toggle (preserves selection), destroy
// on unmount.
export function GraphCanvas({ graph, onSelect, reachable }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  // Keep the latest onSelect in a ref so the cytoscape tap handlers
  // (registered once at mount) always see the current callback
  // without rebinding the whole canvas.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const theme = useTheme();
  const palette = paletteForScheme(theme.palette.mode === 'dark' ? 'dark' : 'light');

  // Effect 1: create / update the cytoscape instance.
  useEffect(() => {
    if (!containerRef.current) return;
    if (cyRef.current) {
      updateCytoscape(cyRef.current, graph);
    } else {
      const cy = createCytoscape(containerRef.current, graph, palette);
      cyRef.current = cy;
      cy.on('tap', 'node', (ev: EventObject) => {
        onSelectRef.current?.(String(ev.target.id()));
      });
      cy.on('tap', (ev: EventObject) => {
        if (ev.target === cy) onSelectRef.current?.(null);
      });
    }
    // palette is intentionally NOT a dep — palette changes flow
    // through effect 2 (live restyle) without rerunning create /
    // update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  // Effect 2: live palette swap on theme change.
  useEffect(() => {
    if (cyRef.current) {
      applyAtlasPalette(cyRef.current, palette);
    }
  }, [palette]);

  // Effect 3: project the blast-radius reachable set onto the canvas
  // as a `dimmed` data flag. null reachable wipes every flag so the
  // canvas snaps back to normal.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      if (!reachable) {
        cy.nodes().removeData('dimmed');
        cy.edges().removeData('dimmed');
        return;
      }
      cy.nodes().forEach(n => {
        if (reachable.has(String(n.id()))) n.removeData('dimmed');
        else n.data('dimmed', true);
      });
      cy.edges().forEach(e => {
        const inSet =
          reachable.has(String(e.source().id())) && reachable.has(String(e.target().id()));
        if (inSet) e.removeData('dimmed');
        else e.data('dimmed', true);
      });
    });
  }, [reachable, graph]);

  // Effect 4: destroy on unmount.
  useEffect(() => {
    return () => {
      cyRef.current?.destroy();
      cyRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '70vh',
        backgroundColor: palette.bg,
        borderRadius: 2,
      }}
    />
  );
}
