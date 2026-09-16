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

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { fetchOtelOverlay, fetchOtelTraces } from '../api/client';
import { KubeAtlasService, OtelOverlayEdge, OtelTraceSummary } from '../api/types';
import { TraceTimeline } from '../components/TraceTimeline';
import { ChooseService } from './ChooseService';

// OTelOverlay is the F-204 runtime-overlay view (KubeAtlas v1.5): the
// observed CALLS_AT_RUNTIME calls the correlator inferred from OTLP
// traces, per namespace, plus a compact recent-trace strip. It is the
// Headlamp peer of the main Web UI's overlay toggle.
export function OTelOverlay() {
  const [service, setService] = useState<KubeAtlasService | null>(null);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h4">OTel Overlay</Typography>
        {service && (
          <Button size="small" onClick={() => setService(null)}>
            Change service
          </Button>
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Observed runtime calls (CALLS_AT_RUNTIME) inferred from OpenTelemetry traces, layered over
        the declarative graph. Requires a Tier 2 KubeAtlas with <code>otel.enabled</code>.
      </Typography>

      {!service && <ChooseService onSelect={setService} />}
      {service && <Overlay service={service} />}
    </Box>
  );
}

function Overlay({ service }: { service: KubeAtlasService }) {
  const [namespace, setNamespace] = useState('');
  const [jaeger, setJaeger] = useState('');
  const [edges, setEdges] = useState<OtelOverlayEdge[] | null>(null);
  const [traces, setTraces] = useState<OtelTraceSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    const ns = namespace.trim();
    if (!ns) {
      setError('Enter a namespace to load its runtime overlay.');
      return;
    }
    setLoading(true);
    setError(null);
    setEdges(null);
    Promise.all([fetchOtelOverlay(service, ns), fetchOtelTraces(service)])
      .then(([overlay, recent]) => {
        setEdges(overlay.edges);
        setTraces(recent);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <TextField
          size="small"
          label="Namespace"
          value={namespace}
          onChange={e => setNamespace(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              load();
            }
          }}
        />
        <TextField
          size="small"
          label="Jaeger/Tempo base URL (optional)"
          placeholder="https://jaeger.example.com"
          value={jaeger}
          onChange={e => setJaeger(e.target.value)}
          sx={{ minWidth: 300 }}
        />
        <Button variant="contained" size="small" onClick={load} disabled={loading}>
          Load
        </Button>
      </Stack>

      {error && (
        <Alert severity="error">
          Could not load the overlay: {error}. The overlay needs a Tier 2 KubeAtlas with
          otel.enabled.
        </Alert>
      )}
      {loading && <CircularProgress size={24} />}

      {edges !== null && !loading && (
        <Stack spacing={1}>
          <Typography variant="h6">
            Runtime calls in {namespace.trim()} ({edges.length})
          </Typography>
          {edges.length === 0 ? (
            <Alert severity="info">
              No runtime calls observed. Send OTLP traces carrying the k8s.* resource attributes so
              the correlator can map them to graph resources.
            </Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Caller</TableCell>
                  <TableCell>Callee</TableCell>
                  <TableCell align="right">Calls</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {edges.map(e => (
                  <TableRow key={`${e.from}->${e.to}`}>
                    <TableCell>{e.attributes?.from_service || e.from}</TableCell>
                    <TableCell>{e.attributes?.to_service || e.to}</TableCell>
                    <TableCell align="right">{e.attributes?.call_count ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Typography variant="h6" sx={{ mt: 2 }}>
            Recent traces
          </Typography>
          <TraceTimeline traces={traces} jaegerBaseUrl={jaeger.trim() || undefined} />
        </Stack>
      )}
    </Stack>
  );
}
