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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchResourceNeighbors } from '../api/client';
import { ResourceNeighbors } from '../api/types';
import { NeighborGraph } from '../components/NeighborGraph';

const KUBEATLAS_SERVICE_LABEL = 'app.kubernetes.io/name=kubeatlas';

// SUPPORTED_KINDS are the resource kinds KubeAtlas graphs. The
// Dependencies section is registered only for these — every other
// kind is skipped entirely, so no empty section appears (rather than
// rendering a blank or broken graph).
export const SUPPORTED_KINDS = new Set<string>([
  'Pod',
  'Deployment',
  'ReplicaSet',
  'StatefulSet',
  'DaemonSet',
  'Job',
  'CronJob',
  'Service',
  'Ingress',
  'ConfigMap',
  'Secret',
  'ServiceAccount',
  'PersistentVolumeClaim',
  'NetworkPolicy',
]);

export function isSupportedKind(kind: string | undefined): boolean {
  return kind !== undefined && SUPPORTED_KINDS.has(kind);
}

export interface DependenciesSectionProps {
  kind: string;
  namespace: string;
  name: string;
}

// DependenciesSection is the "KubeAtlas Dependencies" section shown on
// a resource's details page. It finds a KubeAtlas Service, fetches
// the resource's one-hop edges, and renders them as a small graph.
export function DependenciesSection({ kind, namespace, name }: DependenciesSectionProps) {
  const [services] = K8s.ResourceClasses.Service.useList({
    labelSelector: KUBEATLAS_SERVICE_LABEL,
  });
  const [neighbors, setNeighbors] = useState<ResourceNeighbors | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // The first KubeAtlas Service found backs the lookup — the cluster
  // view has an explicit picker, but a details section stays
  // unobtrusive and just uses what it discovers.
  const hasService = (services?.length ?? 0) > 0;
  const svcNamespace = services?.[0]?.metadata.namespace ?? '';
  const svcName = services?.[0]?.metadata.name ?? '';
  const svcPort = services?.[0]?.spec?.ports?.[0]?.port ?? 8080;

  useEffect(() => {
    if (!hasService) {
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNeighbors(null);
    fetchResourceNeighbors({ namespace: svcNamespace, name: svcName, port: svcPort }, namespace, kind, name)
      .then(result => {
        if (!cancelled) {
          setNeighbors(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hasService, svcNamespace, svcName, svcPort, namespace, kind, name]);

  const isEmpty =
    neighbors !== null && neighbors.incoming.length + neighbors.outgoing.length === 0;

  return (
    <SectionBox title="KubeAtlas Dependencies">
      {services !== null && !hasService && (
        <Alert severity="info">
          KubeAtlas is not installed in this cluster — no dependency data available.
        </Alert>
      )}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {error && <Alert severity="error">Could not load dependencies: {error}</Alert>}
      {isEmpty && <Typography>No dependencies recorded for this resource.</Typography>}
      {neighbors !== null && !isEmpty && (
        <NeighborGraph
          centerId={`${namespace}/${kind}/${name}`}
          centerLabel={`${kind}/${name}`}
          incoming={neighbors.incoming}
          outgoing={neighbors.outgoing}
        />
      )}
    </SectionBox>
  );
}
