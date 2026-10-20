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
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { fetchConstraintAffected, fetchPolicyConstraints } from '../api/client';
import { AffectedResource, KubeAtlasService, PolicyConstraint } from '../api/types';
import { ChooseService } from './ChooseService';

// PolicyView is the cluster-level policy view: it lists Gatekeeper
// Constraints / Kyverno policies and, for a selected one, the resources
// it enforces with their violation status. Read-only — KubeAtlas
// observes the policy engines, it does not edit policies.
export function PolicyView() {
  const [service, setService] = useState<KubeAtlasService | null>(null);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h4">Policies</Typography>
        {service && (
          <Button size="small" onClick={() => setService(null)}>
            Change service
          </Button>
        )}
      </Stack>

      {!service && <ChooseService onSelect={setService} />}
      {service && <Constraints service={service} />}
    </Box>
  );
}

function Constraints({ service }: { service: KubeAtlasService }) {
  const [rows, setRows] = useState<PolicyConstraint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    setSelected('');
    fetchPolicyConstraints(service)
      .then(r => {
        if (!cancelled) setRows(r);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [service.namespace, service.name, service.port]);

  if (error) {
    return <Alert severity="error">Could not load policies: {error}</Alert>;
  }
  if (rows === null) {
    return <CircularProgress size={24} />;
  }
  if (rows.length === 0) {
    return (
      <Alert severity="info">
        No policy constraints found. Install Gatekeeper or Kyverno and apply a policy to see it
        here.
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Kind</TableCell>
            <TableCell>Engine</TableCell>
            <TableCell align="right">Violations</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow
              key={`${r.engine}/${r.name}`}
              hover
              selected={selected === r.name}
              onClick={() => setSelected(r.name)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.kind}</TableCell>
              <TableCell>{r.engine}</TableCell>
              <TableCell align="right">
                <Chip
                  size="small"
                  color={r.violations > 0 ? 'error' : 'success'}
                  label={r.violations}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selected && <Affected service={service} name={selected} />}
    </Stack>
  );
}

function Affected({ service, name }: { service: KubeAtlasService; name: string }) {
  const [resources, setResources] = useState<AffectedResource[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResources(null);
    setError(null);
    fetchConstraintAffected(service, name)
      .then(r => {
        if (!cancelled) setResources(r.resources);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [service.namespace, service.name, service.port, name]);

  if (error) {
    return <Alert severity="error">Could not load affected resources: {error}</Alert>;
  }
  if (resources === null) {
    return <CircularProgress size={20} />;
  }

  return (
    <Stack spacing={1}>
      <Typography variant="h6">
        Resources enforced by {name} ({resources.length})
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Resource</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Message</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {resources.map(a => (
            <TableRow key={`${a.resource.namespace}/${a.resource.kind}/${a.resource.name}`}>
              <TableCell>
                {a.resource.namespace}/{a.resource.kind}/{a.resource.name}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color={a.violated ? 'error' : 'success'}
                  label={a.violated ? 'Violating' : 'Compliant'}
                />
              </TableCell>
              <TableCell>{a.message ?? ''}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
