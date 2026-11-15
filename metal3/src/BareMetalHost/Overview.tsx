/*
 * Copyright 2026 The Kubernetes Authors
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
  EmptyContent,
  Link,
  Loader,
  NamespacesAutocomplete,
  PageGrid,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Box, MenuItem, TextField } from '@mui/material';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { CRDGuard } from '../common/CRDGuard';
import { HostStatusLabel } from './HostStatusLabel';
import { bareMetalHostClass } from './List';
import type { InProgressHost } from './overviewStats';
import { computeOverview, groupByLabel, inProgressHosts, labelKeys } from './overviewStats';

/**
 * The globally selected namespaces (empty means all), read from Headlamp's shared
 * filter store the way its list views do. Uses react-redux directly because the
 * internal filter module is not exposed to plugins at runtime.
 */
function useSelectedNamespaces(): string[] | undefined {
  const namespaces = useSelector(
    (state: { filter?: { namespaces?: Set<string> } }) => state.filter?.namespaces
  );
  // Undefined means all namespaces; otherwise a stable array so it can be passed
  // straight to useList as a query dependency without re-fetching every render.
  return useMemo(() => (namespaces && namespaces.size ? [...namespaces] : undefined), [namespaces]);
}

/** A dwell time in ms as a short human string, or an em dash when unknown. */
function formatDuration(ms: number | null): string {
  if (ms === null) {
    return '—';
  }
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

/** One row of the fleets table: a fleet and its per-fleet counts. */
interface FleetRow {
  name: string;
  total: number;
  free: number;
  claimed: number;
  backing: number;
  inProgress: number;
  error: number;
  poweredOn: number;
}

/** A link to a host's detail page. */
function hostLink(host: KubeObject) {
  return (
    <Link
      routeName="baremetalhost-detail"
      params={{ namespace: host.metadata.namespace, name: host.metadata.name }}
    >
      {host.metadata.name}
    </Link>
  );
}

/** The overview body, rendered once the CRD is confirmed present. */
function OverviewContent() {
  const [groupKey, setGroupKey] = useState('');
  const selectedNamespaces = useSelectedNamespaces();
  // Scope the request to the selected namespaces so a user with namespace-only list
  // permission is not forced into a cluster-wide request they cannot make.
  const [hosts, error] = bareMetalHostClass().useList({ namespace: selectedNamespaces });
  if (!hosts) {
    return error ? (
      <EmptyContent>
        Could not load bare-metal hosts. You may not have permission to list them, or the request
        failed.
      </EmptyContent>
    ) : (
      <Loader title="Loading bare-metal hosts…" />
    );
  }
  if (hosts.length === 0) {
    return <EmptyContent>No bare-metal hosts found.</EmptyContent>;
  }

  const now = Date.now();
  const keys = labelKeys(hosts);
  // The chosen label can drop out when the namespace filter changes; fall back to no
  // grouping so the select never carries an out-of-range value.
  const effectiveGroupKey = keys.includes(groupKey) ? groupKey : '';
  const fleets = groupByLabel(hosts, effectiveGroupKey);
  const overall = computeOverview(hosts);
  const allInProgress = inProgressHosts(hosts, now);

  // Which fleet a host belongs to under the current grouping, for the list columns.
  const fleetOf = (host: KubeObject): string =>
    effectiveGroupKey
      ? host.jsonData.metadata?.labels?.[effectiveGroupKey] ?? `(no ${effectiveGroupKey})`
      : 'All hosts';

  const fleetRows: FleetRow[] = fleets.map(fleet => {
    const s = computeOverview(fleet.hosts);
    return {
      name: fleet.name,
      total: s.total,
      free: s.free,
      claimed: s.claimed,
      backing: s.backingMachine,
      inProgress: inProgressHosts(fleet.hosts, now).length,
      error: s.error,
      poweredOn: s.poweredOn,
    };
  });

  return (
    <PageGrid>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mt: 1.5, mb: 1 }}>
        <NamespacesAutocomplete />
        {keys.length > 0 && (
          <TextField
            select
            label="Group by label"
            value={effectiveGroupKey}
            onChange={e => setGroupKey(e.target.value)}
            size="small"
            sx={{ minWidth: 240 }}
          >
            <MenuItem value="">All hosts</MenuItem>
            {keys.map(k => (
              <MenuItem key={k} value={k}>
                {k}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>
      <SectionBox title="Fleets">
        <SimpleTable
          columns={[
            { label: 'Fleet', getter: (row: FleetRow) => row.name, sort: true },
            { label: 'Hosts', getter: (row: FleetRow) => row.total, sort: true },
            { label: 'Free', getter: (row: FleetRow) => row.free, sort: true },
            { label: 'Claimed', getter: (row: FleetRow) => row.claimed, sort: true },
            { label: 'Backing a machine', getter: (row: FleetRow) => row.backing, sort: true },
            { label: 'In progress', getter: (row: FleetRow) => row.inProgress, sort: true },
            { label: 'In error', getter: (row: FleetRow) => row.error, sort: true },
            {
              label: 'Powered on',
              getter: (row: FleetRow) => `${row.poweredOn}/${row.total}`,
              sort: (row: FleetRow) => row.poweredOn,
            },
          ]}
          data={fleetRows}
        />
      </SectionBox>

      <SectionBox title="In progress">
        {allInProgress.length === 0 ? (
          <EmptyContent>No hosts are mid-operation right now.</EmptyContent>
        ) : (
          <SimpleTable
            columns={[
              { label: 'Name', getter: (row: InProgressHost) => hostLink(row.host) },
              ...(effectiveGroupKey
                ? [{ label: 'Fleet', getter: (row: InProgressHost) => fleetOf(row.host) }]
                : []),
              { label: 'State', getter: (row: InProgressHost) => row.state },
              { label: 'For', getter: (row: InProgressHost) => formatDuration(row.durationMs) },
            ]}
            data={allInProgress}
          />
        )}
      </SectionBox>

      <SectionBox title="Needs attention">
        {overall.attention.length === 0 ? (
          <EmptyContent>No hosts need attention.</EmptyContent>
        ) : (
          <SimpleTable
            columns={[
              { label: 'Name', getter: (host: KubeObject) => hostLink(host) },
              ...(effectiveGroupKey
                ? [{ label: 'Fleet', getter: (host: KubeObject) => fleetOf(host) }]
                : []),
              { label: 'Namespace', getter: (host: KubeObject) => host.metadata.namespace },
              { label: 'Status', getter: (host: KubeObject) => <HostStatusLabel host={host} /> },
            ]}
            data={overall.attention}
          />
        )}
      </SectionBox>

      <Box sx={{ height: 24 }} />
    </PageGrid>
  );
}

/**
 * Fleet overview and landing page for the Metal3 section.
 *
 * Metal3 has no fleet resource, so hosts are grouped into fleets by a label the
 * user picks, and each fleet is a row showing its allocation (free, claimed, and
 * how many back a Metal3Machine), how many are in error or in progress, and how
 * many are powered on. Below that, two lists across all fleets: the hosts
 * currently mid-operation with how long they have been there, and the hosts
 * needing attention. Namespace scoping is left to Headlamp's own namespace
 * filter. It is pure aggregation over the host list, so no new data is fetched
 * beyond what the list view already loads. Guarded by CRD presence.
 */
export function BareMetalHostOverview() {
  return (
    <CRDGuard crdName="baremetalhosts.metal3.io" resourceLabel="Bare Metal Host">
      <OverviewContent />
    </CRDGuard>
  );
}
