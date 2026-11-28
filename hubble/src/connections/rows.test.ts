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

import { describe, expect, it } from 'vitest';
import type { FlowRecord } from './flows';
import { peerName, rowsForPod } from './rows';
import { stitchConnections } from './stitch';

type Pod = { workload: string; pod: string; ip: string };

const frontendA: Pod = { workload: 'frontend', pod: 'frontend-abc-11111', ip: '10.0.0.1' };
const frontendB: Pod = { workload: 'frontend', pod: 'frontend-abc-22222', ip: '10.0.0.2' };
const backendA: Pod = { workload: 'backend', pod: 'backend-def-33333', ip: '10.0.0.3' };
const backendB: Pod = { workload: 'backend', pod: 'backend-def-44444', ip: '10.0.0.4' };

/** A request from one pod to another on port 80, each call from a new client port. */
function request(from: Pod, to: Pod, ms: number, dropped = false): FlowRecord {
  return {
    time: new Date(ms).toISOString(),
    verdict: dropped ? 'DROPPED' : 'FORWARDED',
    dropReason: dropped ? 'POLICY_DENIED' : undefined,
    observationPoint: 'TO_ENDPOINT',
    protocol: 'TCP',
    tcpFlags: { syn: true },
    source: {
      ip: from.ip,
      port: 40000 + ms,
      namespace: 'shop',
      pod: from.pod,
      workload: from.workload,
    },
    destination: { ip: to.ip, port: 80, namespace: 'shop', pod: to.pod, workload: to.workload },
  };
}

/** A request to an address outside the cluster that Hubble has a DNS name for. */
function requestOutside(from: Pod, ms: number): FlowRecord {
  return {
    ...request(from, backendA, ms),
    observationPoint: 'TO_STACK',
    destination: { ip: '93.184.216.34', port: 443, names: ['example.com'], outside: true },
  };
}

describe('rowsForPod', () => {
  it('groups the connections a pod opened by peer and lists the peer pods', () => {
    const connections = stitchConnections([
      request(frontendA, backendA, 1),
      request(frontendA, backendB, 2),
      request(frontendB, backendA, 3),
    ]);
    const rows = rowsForPod(connections, 'shop', frontendA.pod);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      direction: 'out',
      peer: 'shop/backend',
      port: 80,
      protocol: 'TCP',
      result: 'delivered',
      count: 2,
    });
    expect(rows[0].peerPods.sort()).toEqual([backendA.pod, backendB.pod]);
    expect(rows[0].firstSeen).toEqual(new Date(1));
    expect(rows[0].lastSeen).toEqual(new Date(2));
  });

  it('shows the connections a pod received as incoming', () => {
    const connections = stitchConnections([
      request(frontendA, backendA, 1),
      request(frontendB, backendA, 2),
    ]);
    const rows = rowsForPod(connections, 'shop', backendA.pod);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ direction: 'in', peer: 'shop/frontend', count: 2 });
  });

  it('keeps blocked connections in their own row, listed first', () => {
    const connections = stitchConnections([
      request(frontendA, backendA, 1),
      request(frontendA, backendA, 2),
      request(frontendA, backendA, 3, true),
    ]);
    const rows = rowsForPod(connections, 'shop', frontendA.pod);
    expect(rows.map(row => [row.result, row.count, row.dropReason])).toEqual([
      ['blocked', 1, 'POLICY_DENIED'],
      ['delivered', 2, ''],
    ]);
  });

  it('names a peer outside the cluster by its DNS name', () => {
    const rows = rowsForPod(
      stitchConnections([requestOutside(frontendA, 1)]),
      'shop',
      frontendA.pod
    );
    expect(rows[0]).toMatchObject({
      direction: 'out',
      peer: 'example.com',
      peerPods: [],
      port: 443,
      result: 'left-cluster',
    });
  });

  it('leaves out connections of other pods, also with the same name in another namespace', () => {
    const connections = stitchConnections([request(frontendB, backendB, 1)]);
    expect(rowsForPod(connections, 'shop', frontendA.pod)).toEqual([]);
    expect(rowsForPod(connections, 'other', frontendB.pod)).toEqual([]);
  });

  it('names a pod without a workload by its own name, not after a pod with a similar name', () => {
    // A bare pod has no workload, and api-debug isn't a pod of the StatefulSet api of api-0.
    const api: Pod = { workload: 'api', pod: 'api-0', ip: '10.0.0.5' };
    const bare = (ms: number) => {
      const flow = request({ workload: '', pod: 'api-debug', ip: '10.0.0.6' }, backendA, ms);
      return { ...flow, source: { ...flow.source, workload: undefined } };
    };
    const rows = rowsForPod(
      stitchConnections([request(api, backendA, 1), bare(2), bare(3)]),
      'shop',
      backendA.pod
    );
    expect(rows.map(row => [row.peer, row.peerPods, row.count])).toEqual([
      ['shop/api-debug', ['api-debug'], 2],
      ['shop/api', ['api-0'], 1],
    ]);
  });

  it('keeps a pod without a workload apart from a workload of the same name', () => {
    // The Deployment svc has the pod svc-1, and a bare pod is also called svc.
    const svc: Pod = { workload: 'svc', pod: 'svc-1', ip: '10.0.0.7' };
    const bare = (ms: number) => {
      const flow = request(frontendA, { workload: '', pod: 'svc', ip: '10.0.0.8' }, ms);
      return { ...flow, destination: { ...flow.destination, workload: undefined } };
    };
    const rows = rowsForPod(
      stitchConnections([request(frontendA, svc, 1), bare(2)]),
      'shop',
      frontendA.pod
    );
    expect(rows.map(row => [row.peer, row.peerPods, row.count])).toEqual([
      ['shop/svc', ['svc-1'], 1],
      ['shop/svc (pod)', ['svc'], 1],
    ]);
  });
});

describe('rowsForPod with flows from two nodes', () => {
  it('names a peer pod by its workload also when only the other node knew it', () => {
    // Hubble leaves the workload out for a pod on another node than the one recording.
    const remote = (ms: number) => {
      const flow = request(frontendA, backendA, ms);
      return { ...flow, destination: { ...flow.destination, workload: undefined } };
    };
    const rows = rowsForPod(
      stitchConnections([remote(1), remote(2), request(frontendA, backendA, 3)]),
      'shop',
      frontendA.pod
    );
    expect(rows.map(row => [row.peer, row.count])).toEqual([['shop/backend', 3]]);
  });
});

describe('peerName', () => {
  const peer = { ip: '10.0.0.228', port: 0, namespace: '', pod: '', workload: '', names: [] };

  it('names the node and the API server instead of showing a bare IP', () => {
    // kubelet probes come from the node's address, which Cilium labels like this.
    expect(peerName({ ...peer, outside: false, reserved: ['host', 'kube-apiserver'] })).toBe(
      'This node or its API server (10.0.0.228)'
    );
    expect(peerName({ ...peer, outside: true, reserved: ['world', 'kube-apiserver'] })).toBe(
      'Kubernetes API server (10.0.0.228)'
    );
    expect(peerName({ ...peer, outside: false, reserved: ['host'] })).toBe(
      'This node (10.0.0.228)'
    );
    expect(peerName({ ...peer, outside: false, reserved: ['remote-node'] })).toBe(
      'Another node (10.0.0.228)'
    );
  });

  it('prefers the DNS name for an end outside the cluster, else its IP', () => {
    expect(peerName({ ...peer, outside: true, reserved: ['world'], names: ['example.com'] })).toBe(
      'example.com'
    );
    expect(peerName({ ...peer, outside: true, reserved: ['world'] })).toBe('10.0.0.228');
  });
});
