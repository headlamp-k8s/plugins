/*
 * Copyright 2026 The KubeAtlas Authors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Right-side drawer that surfaces a single resource's incoming +
 * outgoing edges when the operator selects a node on the canvas.
 * Reuses the same /api/v1/resources/.../.../... endpoint the cluster
 * canvas already proxies through Headlamp's API server proxy.
 */

import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchResourceNeighbors } from '../api/client';
import { Edge, KubeAtlasService, ResourceNeighbors } from '../api/types';

export interface DetailDrawerProps {
  service: KubeAtlasService | null;
  nodeId: string | null;
  blastActive: boolean;
  onClose: () => void;
  onShowBlastRadius: () => void;
  onExitBlastRadius: () => void;
}

interface ParsedID {
  clusterId?: string;
  namespace?: string;
  kind?: string;
  name?: string;
}

// Mirror the main repo's parseNodeId — the wire id grammar is
// `[<clusterID>:]<namespace>/<kind>/<name>`. Aggregated nodes
// (cluster-level namespace rows) only carry a name in the id, so
// the parsed namespace/kind/name come back undefined and the drawer
// surfaces "select a resource" instead of a detail fetch.
function parseNodeId(id: string): ParsedID {
  let rest = id;
  const colon = id.indexOf(':');
  let clusterId: string | undefined;
  if (colon > -1 && colon < id.indexOf('/')) {
    clusterId = id.slice(0, colon);
    rest = id.slice(colon + 1);
  }
  const parts = rest.split('/');
  if (parts.length === 3) {
    const [namespace, kind, name] = parts;
    return { clusterId, namespace: namespace || undefined, kind, name };
  }
  return { clusterId };
}

export function DetailDrawer({
  service,
  nodeId,
  blastActive,
  onClose,
  onShowBlastRadius,
  onExitBlastRadius,
}: DetailDrawerProps) {
  const parsed = nodeId ? parseNodeId(nodeId) : null;
  const isResource = parsed?.kind !== undefined && parsed?.name !== undefined;

  const [data, setData] = useState<ResourceNeighbors | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!service || !nodeId || !isResource || !parsed) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetchResourceNeighbors(service, parsed.namespace ?? '', parsed.kind!, parsed.name!)
      .then(n => {
        if (!cancelled) setData(n);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [service, nodeId, isResource, parsed?.namespace, parsed?.kind, parsed?.name]);

  return (
    <Drawer
      anchor="right"
      open={nodeId !== null}
      onClose={onClose}
      // Width matches the main web UI's right detail panel.
      PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
    >
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="overline" color="text.secondary">
            {parsed?.namespace ? `${parsed.namespace} / ` : ''}
            {parsed?.kind ?? 'Selection'}
          </Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close detail">
            <Icon icon="mdi:close" width={18} height={18} />
          </IconButton>
        </Stack>
        <Typography variant="h5" sx={{ wordBreak: 'break-all', mt: 0.5 }}>
          {parsed?.name ?? nodeId}
        </Typography>

        {isResource && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, mb: 1 }}>
            {!blastActive ? (
              <Button
                size="small"
                variant="outlined"
                onClick={onShowBlastRadius}
                disabled={!data || (data.incoming.length === 0 && data.outgoing.length === 0)}
              >
                ↯ Show blast radius
              </Button>
            ) : (
              <Button size="small" variant="contained" onClick={onExitBlastRadius}>
                Exit blast radius
              </Button>
            )}
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />

        {!isResource && (
          <Alert severity="info">
            Aggregated node — select a resource for incoming / outgoing edges.
          </Alert>
        )}

        {isResource && loading && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={14} />
            <Typography variant="caption">Loading edges…</Typography>
          </Stack>
        )}

        {isResource && error && (
          <Alert severity="error" sx={{ wordBreak: 'break-all' }}>
            {error}
          </Alert>
        )}

        {isResource && data && (
          <Stack spacing={2}>
            <EdgeSection title={`Incoming · ${data.incoming.length}`} edges={data.incoming} dir="from" />
            <EdgeSection title={`Outgoing · ${data.outgoing.length}`} edges={data.outgoing} dir="to" />
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}

interface EdgeSectionProps {
  title: string;
  edges: Edge[];
  dir: 'from' | 'to';
}

function EdgeSection({ title, edges, dir }: EdgeSectionProps) {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      {edges.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          no edges
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {edges.slice(0, 50).map((e, i) => (
            <Box
              key={`${e.from}-${e.to}-${e.type}-${i}`}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, wordBreak: 'break-all' }}
            >
              <Chip label={e.type} size="small" sx={{ height: 20, fontSize: 10 }} />
              <Box component="span" sx={{ flexGrow: 1 }}>
                {dir === 'to' ? e.to : e.from}
              </Box>
            </Box>
          ))}
          {edges.length > 50 && (
            <Typography variant="caption" color="text.secondary">
              + {edges.length - 50} more
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
}
