/*
 * Copyright 2025 The Kubernetes Authors
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
import {
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Alert, Typography } from '@mui/material';
import { useMemo } from 'react';
import { CILIUM_CRD } from '../status/statusRows';
import { type AdapterService, useAdapterService } from '../utils/settings';
import { type ConnectionRow, rowsForPod } from './rows';
import type { ConnectionResult } from './stitch';
import {
  CONNECTIONS_REFRESH_MS,
  type ConnectionsError,
  type ConnectionsState,
  useConnections,
} from './useConnections';

const resultLabels: Record<
  ConnectionResult,
  { status: 'success' | 'error' | 'warning' | ''; text: string }
> = {
  delivered: { status: 'success', text: 'Delivered' },
  blocked: { status: 'error', text: 'Blocked' },
  'left-cluster': { status: '', text: 'Left the cluster' },
  'not-seen-arriving': { status: 'warning', text: 'Arrival not seen' },
};

/**
 * What a count of one protocol is: Hubble shows TCP connections being opened, but it
 * can't tell which of them were set up, and other protocols have no connections at all.
 */
export function observedText(protocol: string, count: number) {
  const unit = protocol === 'TCP' ? 'connection attempt' : 'flow event';
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

/** Says how much the table covers: Relay only keeps the last few thousand flows per node. */
export function coverageText(state: ConnectionsState) {
  const connections = state.connections ?? [];
  const lost = state.lostEvents
    ? ` Hubble lost ${state.lostEvents} events on the nodes, so some may be missing.`
    : '';
  if (!connections.length) {
    // Relay only has some of the flows when it couldn't read a node.
    const which = state.unreadNodes.length ? 'could read' : 'still has';
    return `No connections in the flows Hubble Relay ${which}.${lost}`;
  }
  const first = Math.min(...connections.map(connection => connection.firstSeen.getTime()));
  const last = Math.max(...connections.map(connection => connection.lastSeen.getTime()));
  const time = (ms: number) => new Date(ms).toLocaleTimeString();
  const tcp = connections.filter(connection => connection.protocol === 'TCP').length;
  const counts = [
    tcp && `${observedText('TCP', tcp)} over TCP`,
    connections.length - tcp && observedText('other', connections.length - tcp),
  ].filter(Boolean);
  return `Observed ${counts.join(' and ')} between ${time(first)} and ${time(last)}.${lost}`;
}

/** Says that the flows of some nodes are missing, because Relay couldn't read them. */
export function unreadText(nodes: string[]) {
  const which = nodes.length === 1 ? `node ${nodes[0]}` : `nodes ${nodes.join(', ')}`;
  return `Hubble Relay couldn't read the flows of ${which}, so some connections may be missing.`;
}

/** Explains why the flows couldn't be loaded, with what to do about it. */
export function errorText(error: ConnectionsError, service: AdapterService) {
  const where = `the ${service.name} Service in ${service.namespace}`;
  switch (error.status) {
    case 403:
      return `You don't have permission to use the proxy of ${where}.`;
    // The API server answers 503 for a Service that is missing or has no ready pod, and
    // the adapter answers 503 when it can't connect to Relay or Relay has no nodes.
    case 404:
    case 503:
      return `Couldn't get flows from ${where} (${error.status}). Check that the hubble-flows-adapter is deployed and that Hubble Relay is running and connected to the Cilium agents, see the plugin README.`;
    case 502:
    case 504:
      return `Hubble Relay didn't answer ${where} (${error.status}). Check that Relay is running.`;
    default:
      return `Couldn't load flows from ${where}: ${error.message}`;
  }
}

function resultCell(row: ConnectionRow) {
  const { status, text } = resultLabels[row.result];
  // A connection that got through after a drop keeps the drop's reason.
  let drop = '';
  if (row.dropReason) {
    drop = row.result === 'blocked' ? ` (${row.dropReason})` : ` after a drop (${row.dropReason})`;
  }
  return (
    <StatusLabel status={status}>
      {text}
      {drop}
    </StatusLabel>
  );
}

const columns = [
  {
    label: 'Direction',
    getter: (row: ConnectionRow) => (row.direction === 'out' ? 'Out →' : '← In'),
  },
  { label: 'Peer', getter: (row: ConnectionRow) => row.peer },
  { label: 'Peer pods', getter: (row: ConnectionRow) => row.peerPods.join(', ') || '-' },
  { label: 'Port', getter: (row: ConnectionRow) => `${row.port}/${row.protocol}` },
  { label: 'Result', getter: resultCell },
  { label: 'Observed', getter: (row: ConnectionRow) => observedText(row.protocol, row.count) },
  { label: 'Last seen', getter: (row: ConnectionRow) => row.lastSeen.toLocaleTimeString() },
];

interface PodProps {
  cluster: string;
  namespace: string;
  pod: string;
}

/**
 * The pod's recent connections from Hubble, on clusters that have Cilium. The check runs
 * again as often as the table refreshes, so the table starts once Cilium is installed,
 * and clusters without it get no section and no requests to the adapter.
 */
export default function PodConnections(props: PodProps) {
  // Same check as the status page. A check that fails keeps the last answer, so the
  // table doesn't go away and come back when one request fails.
  const [crds] = K8s.ResourceClasses.CustomResourceDefinition.useList({
    cluster: props.cluster,
    fieldSelector: `metadata.name=${CILIUM_CRD}`,
    refetchInterval: CONNECTIONS_REFRESH_MS,
  });
  if (!crds?.length) {
    return null;
  }
  return <ConnectionsTable {...props} />;
}

/**
 * The pod's recent connections from Hubble: one row per direction, peer, port and
 * result, counting each connection once.
 */
function ConnectionsTable(props: PodProps) {
  const { cluster, namespace, pod } = props;
  const service = useAdapterService();
  const state = useConnections(cluster, service, namespace, pod);
  const rows = useMemo(
    () => rowsForPod(state.connections ?? [], namespace, pod),
    [state.connections, namespace, pod]
  );

  return (
    <SectionBox title="Connections (Hubble)">
      {state.error && <Alert severity="warning">{errorText(state.error, service)}</Alert>}
      {!state.error && state.unreadNodes.length > 0 && (
        <Alert severity="warning">{unreadText(state.unreadNodes)}</Alert>
      )}
      {state.connections === null && !state.error && <Typography>Loading flows…</Typography>}
      {state.connections !== null && (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {coverageText(state)}
          </Typography>
          <SimpleTable columns={columns} data={rows} />
        </>
      )}
    </SectionBox>
  );
}
