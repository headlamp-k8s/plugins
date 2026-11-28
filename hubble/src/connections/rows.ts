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

import type { Connection, ConnectionResult, Peer } from './stitch';

/** Whether the pod opened the connection (out) or received it (in). */
export type Direction = 'in' | 'out';

/** One row of a pod's connections: same direction, peer, port, protocol and result. */
export interface ConnectionRow {
  direction: Direction;
  /** The other end, see {@link peerName}. */
  peer: string;
  /** The pods of the other end that took part, empty outside the cluster. */
  peerPods: string[];
  /** The server's port. */
  port: number;
  protocol: string;
  result: ConnectionResult;
  /** Why the connections were dropped, for blocked rows and ones that got through after. */
  dropReason: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

/**
 * Names for Cilium's reserved identities. When the API server runs on the node, the
 * node's address has both "host" and "kube-apiserver", and traffic from it can be either
 * (kubelet probes come from there too), so that name says both.
 */
const reservedNames: [string[], string][] = [
  [['host', 'kube-apiserver'], 'This node or its API server'],
  [['remote-node', 'kube-apiserver'], 'Another node or its API server'],
  [['kube-apiserver'], 'Kubernetes API server'],
  [['host'], 'This node'],
  [['remote-node'], 'Another node'],
  [['health'], 'Cilium health check'],
  [['ingress'], 'Cilium ingress'],
];

/**
 * Names one end of a connection: "namespace/workload" for a pod, the DNS name Hubble saw
 * for an end outside the cluster, a name for the node or the API server, otherwise the IP.
 */
export function peerName(peer: Peer) {
  if (peer.pod) {
    return `${peer.namespace}/${peer.workload}`;
  }
  if (peer.names[0]) {
    return peer.names[0];
  }
  const reserved = reservedNames.find(([identities]) =>
    identities.every(identity => peer.reserved.includes(identity))
  );
  return reserved ? `${reserved[1]} (${peer.ip})` : peer.ip;
}

const isPod = (peer: Peer, namespace: string, pod: string) =>
  peer.namespace === namespace && peer.pod === pod;

/** Whether the peer is a pod that goes by its own name, since no flow named its workload. */
const byOwnName = (peer: Peer) => !!peer.pod && peer.workload === peer.pod;

/**
 * Groups a pod's connections into rows, one per direction, peer, port, protocol and
 * result, with the number of connections in each.
 *
 * @param connections - Stitched connections.
 * @param namespace - The pod's namespace.
 * @param pod - The pod's name.
 * @returns The rows, blocked first, then the busiest.
 */
export function rowsForPod(connections: Connection[], namespace: string, pod: string) {
  const rows = new Map<string, ConnectionRow>();
  const ownNameRows = new Set<ConnectionRow>();
  for (const connection of connections) {
    let direction: Direction;
    let other: Peer;
    if (isPod(connection.client, namespace, pod)) {
      direction = 'out';
      other = connection.server;
    } else if (isPod(connection.server, namespace, pod)) {
      direction = 'in';
      other = connection.client;
    } else {
      continue;
    }
    const peer = peerName(other);
    const ownName = byOwnName(other);
    const key = [
      direction,
      peer,
      ownName,
      connection.server.port,
      connection.protocol,
      connection.result,
      connection.dropReason,
    ].join('|');
    const row = rows.get(key) ?? {
      direction,
      peer,
      peerPods: [],
      port: connection.server.port,
      protocol: connection.protocol,
      result: connection.result,
      dropReason: connection.dropReason,
      count: 0,
      firstSeen: connection.firstSeen,
      lastSeen: connection.lastSeen,
    };
    row.count += 1;
    if (other.pod && !row.peerPods.includes(other.pod)) {
      row.peerPods.push(other.pod);
    }
    if (connection.firstSeen < row.firstSeen) {
      row.firstSeen = connection.firstSeen;
    }
    if (connection.lastSeen > row.lastSeen) {
      row.lastSeen = connection.lastSeen;
    }
    rows.set(key, row);
    if (ownName) {
      ownNameRows.add(row);
    }
  }
  // A pod that goes by its own name can have the same name as a workload in its
  // namespace. Then its rows say it's a pod, so the two aren't taken for one.
  const workloadNames = new Set(
    [...rows.values()].filter(row => !ownNameRows.has(row)).map(row => row.peer)
  );
  for (const row of ownNameRows) {
    if (workloadNames.has(row.peer)) {
      row.peer += ' (pod)';
    }
  }
  return [...rows.values()].sort(
    (a, b) => Number(b.result === 'blocked') - Number(a.result === 'blocked') || b.count - a.count
  );
}
