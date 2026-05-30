/*
 * Copyright 2026 The KubeAtlas Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { fetchClusterGraph, fetchNamespaceGraph } from '../api/client';
import { GraphView, KubeAtlasService } from '../api/types';
import { DetailDrawer } from '../components/DetailDrawer';
import { GraphCanvas } from '../components/GraphCanvas';
import { computeBlastRadius } from '../lib/blastRadius';
import { ChooseService } from './ChooseService';

const DOCS_URL = 'https://docs.kubeatlas.lithastra.com';

// "_cluster" is the conventional value the MUI Select uses when the
// operator wants the cluster-wide view instead of a single namespace.
// It's not a valid namespace name, so there's no risk of collision.
const ALL_NAMESPACES = '_cluster';

interface NamespaceListState {
  list: string[];
  loading: boolean;
  error: string | null;
}

// DependencyGraphPage is the cluster-level dependency graph view.
// Composes three pieces on top of GraphCanvas:
//   - Namespace selector (drives the fetch between cluster + namespace level).
//   - DetailDrawer that opens on node tap with the resource's
//     incoming/outgoing edges.
//   - Blast-radius mode driven from inside the drawer; the canvas
//     dims everything outside the BFS reachable set.
export function DependencyGraphPage() {
  const [service, setService] = useState<KubeAtlasService | null>(null);

  // Cluster-graph fetch — always runs after a service is picked so
  // the namespace dropdown has a list to render. Single source of
  // truth for the namespace list (the cluster view's aggregated
  // nodes ARE the namespaces).
  const [clusterGraph, setClusterGraph] = useState<GraphView | null>(null);
  const [namespaces, setNamespaces] = useState<NamespaceListState>({
    list: [],
    loading: false,
    error: null,
  });
  const [namespace, setNamespace] = useState<string>(ALL_NAMESPACES);

  // Active view (cluster OR namespace) — what the canvas renders.
  const [graph, setGraph] = useState<GraphView | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);

  // Selection + blast-radius state, lifted up so the drawer + the
  // canvas dim pass stay in sync.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blastRootId, setBlastRootId] = useState<string | null>(null);
  const [blastDepth, setBlastDepth] = useState(3);

  // Fetch cluster graph + derive namespace list whenever the
  // KubeAtlas service changes.
  useEffect(() => {
    // A service change invalidates everything derived from the old
    // service: the namespace dropdown is repopulated below, so reset
    // the selection to the cluster view (the previous namespace may
    // not exist in the new service) and drop any open drawer / blast
    // mode whose node ids belong to the old graph.
    setNamespace(ALL_NAMESPACES);
    setSelectedId(null);
    setBlastRootId(null);

    if (!service) {
      setClusterGraph(null);
      setGraph(null);
      setNamespaces({ list: [], loading: false, error: null });
      return undefined;
    }
    let cancelled = false;
    setNamespaces({ list: [], loading: true, error: null });
    fetchClusterGraph(service)
      .then(view => {
        if (cancelled) return;
        setClusterGraph(view);
        const list = view.nodes
          .map(n => n.name ?? n.label ?? n.id)
          .filter(Boolean)
          .sort();
        setNamespaces({ list, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setNamespaces({
            list: [],
            loading: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [service]);

  // Drive the canvas graph from (service, namespace). The cluster
  // graph is reused directly when ALL_NAMESPACES is picked so we
  // don't re-issue the same fetch.
  useEffect(() => {
    if (!service) return undefined;
    if (namespace === ALL_NAMESPACES) {
      setGraph(clusterGraph);
      setGraphError(null);
      setGraphLoading(false);
      return undefined;
    }
    let cancelled = false;
    setGraphLoading(true);
    setGraphError(null);
    setGraph(null);
    fetchNamespaceGraph(service, namespace)
      .then(view => {
        if (!cancelled) setGraph(view);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setGraphError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setGraphLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [service, namespace, clusterGraph]);

  // Switching namespace clears any open detail / blast-radius mode
  // — the previously-selected node id may not exist in the new view.
  const onNamespaceChange = (e: SelectChangeEvent<string>) => {
    setNamespace(e.target.value);
    setSelectedId(null);
    setBlastRootId(null);
  };

  // BFS reachable set for the dim pass. Recomputed cheaply when the
  // root or the graph changes. Null when blast mode is off.
  const reachable = useMemo<ReadonlySet<string> | null>(() => {
    if (!blastRootId || !graph) return null;
    return computeBlastRadius(graph, blastRootId, 'downstream', blastDepth).reachable;
  }, [blastRootId, graph, blastDepth]);

  const showCanvas = service && graph;
  const loading = service && (graphLoading || namespaces.loading);
  const error = graphError ?? namespaces.error;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h4">Dependency Graph</Typography>
        {service && (
          <Button size="small" onClick={() => setService(null)}>
            Change service
          </Button>
        )}
      </Stack>

      {!service && <ChooseService onSelect={setService} />}

      {service && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="ns-label">Namespace</InputLabel>
            <Select
              labelId="ns-label"
              label="Namespace"
              value={namespace}
              onChange={onNamespaceChange}
            >
              <MenuItem value={ALL_NAMESPACES}>All namespaces (cluster view)</MenuItem>
              {namespaces.list.map(ns => (
                <MenuItem key={ns} value={ns}>
                  {ns}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {blastRootId && (
            <>
              <Chip
                label={`Blast radius · ${blastRootId}`}
                color="primary"
                onDelete={() => setBlastRootId(null)}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="blast-depth-label">Depth</InputLabel>
                <Select
                  labelId="blast-depth-label"
                  label="Depth"
                  value={String(blastDepth)}
                  onChange={(e: SelectChangeEvent<string>) => setBlastDepth(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map(d => (
                    <MenuItem key={d} value={String(d)}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Stack>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {service && error && (
        <Alert severity="error">
          Could not load the graph: {error}. Check that KubeAtlas is healthy — see the{' '}
          <Link href={DOCS_URL} target="_blank" rel="noopener noreferrer">
            documentation
          </Link>
          .
        </Alert>
      )}

      {showCanvas && <GraphCanvas graph={graph} onSelect={setSelectedId} reachable={reachable} />}

      <DetailDrawer
        service={service}
        nodeId={selectedId}
        blastActive={blastRootId !== null}
        onClose={() => setSelectedId(null)}
        onShowBlastRadius={() => {
          if (selectedId) setBlastRootId(selectedId);
        }}
        onExitBlastRadius={() => setBlastRootId(null)}
      />
    </Box>
  );
}
