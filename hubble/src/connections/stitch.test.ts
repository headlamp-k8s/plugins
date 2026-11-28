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

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { FlowRecord, FlowSnapshot } from './flows';
import { stitchConnections } from './stitch';

/**
 * 30 s of real flows from the shop namespace on Cilium 1.20.3, as the adapter returns
 * them. frontend calls backend (allowed), database (denied by policy) and example.com;
 * payments calls example.com (denied); backend calls database (allowed).
 */
const realFlows = (
  JSON.parse(
    readFileSync(resolve(__dirname, '../../test-files/shop-flows.json'), 'utf8')
  ) as FlowSnapshot
).flows;

const app = (flow: FlowRecord, side: 'source' | 'destination') =>
  flow[side].workload ?? (flow[side].outside ? 'world' : '');

/**
 * The client ports of all connections between two apps, read straight from the raw
 * flows: the client's port is on the client side of every flow, request or reply.
 */
function clientPorts(client: string, server: string) {
  const found = new Set<number>();
  for (const flow of realFlows) {
    if (flow.protocol !== 'TCP') {
      continue;
    }
    if (app(flow, 'source') === client && app(flow, 'destination') === server) {
      found.add(flow.source.port);
    } else if (app(flow, 'source') === server && app(flow, 'destination') === client) {
      found.add(flow.destination.port);
    }
  }
  return found;
}

function stitched(client: string, server: string) {
  const name = (peer: { workload: string; outside: boolean }) =>
    peer.workload || (peer.outside ? 'world' : '');
  return stitchConnections(realFlows).filter(
    connection =>
      connection.protocol === 'TCP' &&
      name(connection.client) === client &&
      name(connection.server) === server
  );
}

describe('stitchConnections on real Hubble flows', () => {
  it('counts each frontend to backend connection once, as delivered', () => {
    const connections = stitched('frontend', 'backend');
    expect(connections.length).toBeGreaterThan(0);
    expect(connections.length).toBe(clientPorts('frontend', 'backend').size);
    expect(connections.every(connection => connection.result === 'delivered')).toBe(true);
    expect(connections.every(connection => connection.server.port === 80)).toBe(true);
  });

  it('counts a denied connection once even though TCP retried the SYN', () => {
    const connections = stitched('frontend', 'database');
    const drops = realFlows.filter(
      flow =>
        flow.verdict === 'DROPPED' &&
        app(flow, 'source') === 'frontend' &&
        app(flow, 'destination') === 'database'
    );
    expect(connections.length).toBe(clientPorts('frontend', 'database').size);
    expect(drops.length).toBeGreaterThan(connections.length);
    expect(connections.every(connection => connection.result === 'blocked')).toBe(true);
    expect(connections[0].dropReason).toBe('POLICY_DENIED');
  });

  it('shows traffic to the internet as blocked or as leaving the cluster', () => {
    const payments = stitched('payments', 'world');
    expect(payments.length).toBe(clientPorts('payments', 'world').size);
    expect(payments.every(connection => connection.result === 'blocked')).toBe(true);
    expect(payments[0].dropReason).toBe('POLICY_DENY');

    const frontend = stitched('frontend', 'world');
    expect(frontend.length).toBe(clientPorts('frontend', 'world').size);
    expect(frontend.every(connection => connection.result === 'left-cluster')).toBe(true);
  });

  it('counts backend to database as delivered, so the policy only blocks frontend', () => {
    const connections = stitched('backend', 'database');
    expect(connections.length).toBe(clientPorts('backend', 'database').size);
    expect(connections.every(connection => connection.result === 'delivered')).toBe(true);
  });

  it('keeps a connection whole when the Service port differs from the pod port', () => {
    // The database Service listens on 5432 and sends to port 80 in the pod. Hubble shows
    // 80 on the request and 5432 on the reply, which must not make two connections.
    const connections = stitched('backend', 'database');
    expect(connections.every(connection => connection.server.port === 80)).toBe(true);
    expect(connections.every(connection => connection.answered)).toBe(true);
  });
});

function tcpFlow(options: {
  ms: number;
  from: string;
  to: string;
  fromPort: number;
  toPort: number;
  flags: FlowRecord['tcpFlags'];
  isReply?: boolean;
  verdict?: string;
  point?: string;
  node?: string;
}): FlowRecord {
  return {
    time: new Date(options.ms).toISOString(),
    node: options.node ?? 'node-a',
    verdict: options.verdict ?? 'FORWARDED',
    dropReason: options.verdict === 'DROPPED' ? 'POLICY_DENIED' : undefined,
    observationPoint: options.point ?? 'TO_ENDPOINT',
    isReply: options.isReply,
    protocol: 'TCP',
    tcpFlags: options.flags,
    source: {
      ip: options.from,
      port: options.fromPort,
      namespace: 'shop',
      pod: `pod-${options.from}`,
    },
    destination: {
      ip: options.to,
      port: options.toPort,
      namespace: 'shop',
      pod: `pod-${options.to}`,
    },
  };
}

describe('stitchConnections rules', () => {
  const client = '10.0.0.1';
  const server = '10.0.0.2';
  const syn = {
    ms: 1,
    from: client,
    to: server,
    fromPort: 40000,
    toPort: 80,
    flags: { syn: true },
  };

  it('folds the reply into the same connection and marks it answered', () => {
    const [connection, ...rest] = stitchConnections([
      tcpFlow(syn),
      tcpFlow({
        ms: 2,
        from: server,
        to: client,
        fromPort: 80,
        toPort: 40000,
        flags: { syn: true, ack: true },
        isReply: true,
      }),
    ]);
    expect(rest).toHaveLength(0);
    expect(connection.client.ip).toBe(client);
    expect(connection.result).toBe('delivered');
    expect(connection.answered).toBe(true);
  });

  it('keeps connections from one client port to different server ports apart', () => {
    const connections = stitchConnections([
      tcpFlow(syn),
      tcpFlow({ ...syn, ms: 2, toPort: 8080 }),
      tcpFlow({
        ms: 3,
        from: server,
        to: client,
        fromPort: 8080,
        toPort: 40000,
        flags: { syn: true, ack: true },
        isReply: true,
      }),
    ]);
    expect(connections.map(connection => connection.server.port)).toEqual([80, 8080]);
    expect(connections.map(connection => connection.answered)).toEqual([false, true]);
  });

  it('counts a connection once when the other node stamped its reply first', () => {
    // Seen on two nodes: the reply, with the Service's port, was stamped 10 ms before the
    // request on the server's node, whose clock was behind.
    const reply = (ms: number, flags: FlowRecord['tcpFlags']) =>
      tcpFlow({
        ms,
        from: server,
        to: client,
        fromPort: 5432,
        toPort: 40000,
        flags,
        isReply: true,
        node: 'node-a',
      });
    const connections = stitchConnections([
      reply(1, { syn: true, ack: true }),
      reply(2, { ack: true }),
      reply(3, { fin: true, ack: true }),
      tcpFlow({ ...syn, ms: 11, node: 'node-b' }),
      tcpFlow({ ...syn, ms: 12, node: 'node-b' }),
      tcpFlow({ ...syn, ms: 13, flags: { fin: true, ack: true }, node: 'node-b' }),
    ]);
    expect(connections).toHaveLength(1);
    expect(connections[0].server.port).toBe(80);
    expect(connections[0].result).toBe('delivered');
    expect(connections[0].nodes).toEqual(['node-a', 'node-b']);
  });

  it('counts a connection once when both nodes recorded it', () => {
    const [connection, ...rest] = stitchConnections([
      tcpFlow({ ...syn, node: 'node-a', point: 'TO_OVERLAY' }),
      tcpFlow({ ...syn, ms: 2, node: 'node-b' }),
    ]);
    expect(rest).toHaveLength(0);
    expect(connection.result).toBe('delivered');
    expect(connection.nodes).toEqual(['node-a', 'node-b']);
  });

  it('starts a new connection when the same ports are reused after the old one ended', () => {
    const connections = stitchConnections([
      tcpFlow(syn),
      tcpFlow({ ...syn, ms: 2, flags: { fin: true, ack: true } }),
      tcpFlow({ ...syn, ms: 3 }),
    ]);
    expect(connections).toHaveLength(2);
  });

  it('finds the client from the SYN when Hubble does not know the direction', () => {
    const [connection] = stitchConnections([
      tcpFlow({ ...syn, fromPort: 80, toPort: 40000, verdict: 'DROPPED' }),
    ]);
    expect(connection.client.ip).toBe(client);
    expect(connection.result).toBe('blocked');
    expect(connection.dropReason).toBe('POLICY_DENIED');
    expect(connection.dropNode).toBe('node-a');
  });

  it('takes the sender of a dropped packet as the client, also for UDP to a high port', () => {
    // Seen live: a UDP packet from port 49161 to 62000 denied by a policy has no
    // direction in Hubble, and the lower port would make it look like a reply.
    const [connection, ...rest] = stitchConnections([
      {
        ...tcpFlow({ ...syn, fromPort: 49161, toPort: 62000, flags: undefined }),
        protocol: 'UDP',
        verdict: 'DROPPED',
        dropReason: 'POLICY_DENIED',
        observationPoint: 'UNKNOWN_POINT',
      },
    ]);
    expect(rest).toHaveLength(0);
    expect(connection.client.ip).toBe(client);
    expect(connection.server.port).toBe(62000);
    expect(connection.result).toBe('blocked');
  });

  it('counts a connection as delivered when only the answer was recorded', () => {
    // Traffic to the node or the API server isn't recorded on the way there, only the
    // answer coming back to the pod.
    const [connection] = stitchConnections([
      tcpFlow({
        ms: 2,
        from: server,
        to: client,
        fromPort: 443,
        toPort: 40000,
        flags: { ack: true },
        isReply: true,
      }),
    ]);
    expect(connection.client.ip).toBe(client);
    expect(connection.answered).toBe(true);
    expect(connection.result).toBe('delivered');
  });

  it('says it did not see the arrival when only the send was seen inside the cluster', () => {
    const [connection] = stitchConnections([tcpFlow({ ...syn, point: 'TO_STACK' })]);
    expect(connection.result).toBe('not-seen-arriving');
  });

  it('gives flows in any order the same connections', () => {
    const flows = [tcpFlow(syn), tcpFlow({ ...syn, ms: 2, flags: { fin: true, ack: true } })];
    const [forward] = stitchConnections(flows);
    const [backward] = stitchConnections([...flows].reverse());
    expect(backward.firstSeen).toEqual(forward.firstSeen);
    expect(backward.lastSeen).toEqual(forward.lastSeen);
  });

  const dropped = { verdict: 'DROPPED', dropReason: 'POLICY_DENIED', observationPoint: '' };

  it('counts each UDP packet as its own flow event, with drops apart', () => {
    const udp = (ms: number, extra: Partial<FlowRecord> = {}): FlowRecord => ({
      ...tcpFlow({ ...syn, ms, fromPort: 40000, toPort: 53, flags: undefined }),
      protocol: 'UDP',
      isReply: false,
      ...extra,
    });
    const reply = (ms: number): FlowRecord => ({
      ...tcpFlow({ ms, from: server, to: client, fromPort: 53, toPort: 40000, flags: undefined }),
      protocol: 'UDP',
      isReply: true,
    });
    const connections = stitchConnections([
      udp(1),
      reply(2),
      udp(3),
      udp(5),
      udp(7, dropped),
      udp(8, dropped),
      udp(9),
    ]);
    expect(connections.map(connection => connection.result)).toEqual([
      'delivered',
      'delivered',
      'delivered',
      'blocked',
      'blocked',
      'delivered',
    ]);
    expect(connections[0].answered).toBe(true);
    expect(connections[1].answered).toBe(false);
  });

  /** A UDP packet from the client to an address outside the cluster. */
  const toWorld = (ms: number, extra: Partial<FlowRecord> = {}): FlowRecord => {
    const flow = tcpFlow({ ...syn, ms, to: '93.184.215.14', toPort: 443, flags: undefined });
    return {
      ...flow,
      protocol: 'UDP',
      isReply: false,
      destination: { ip: '93.184.215.14', port: 443, outside: true, reserved: ['world'] },
      ...extra,
    };
  };

  it('keeps one UDP packet to the world whole across the checkpoints that saw it', () => {
    // With Cilium's monitor aggregation turned down, a packet is also recorded as it
    // leaves the pod, before it's handed on or dropped.
    const connections = stitchConnections([
      toWorld(1, { observationPoint: 'FROM_ENDPOINT' }),
      toWorld(1, { observationPoint: 'TO_STACK' }),
      toWorld(3, { observationPoint: 'FROM_ENDPOINT' }),
      toWorld(3, dropped),
    ]);
    expect(connections.map(connection => [connection.result, connection.flows.length])).toEqual([
      ['left-cluster', 2],
      ['blocked', 2],
    ]);
  });

  it('keeps a packet and its drop together in any order, also within one millisecond', () => {
    // Hubble's times have nanoseconds, with the trailing zeros left out.
    const sent = toWorld(0, {
      time: '2026-11-26T10:00:00.0001Z',
      observationPoint: 'FROM_ENDPOINT',
    });
    const drop = toWorld(0, { ...dropped, time: '2026-11-26T10:00:00.000200Z' });
    const dropAtTheSameTime = { ...drop, time: sent.time };
    for (const flows of [
      [sent, drop],
      [drop, sent],
      [dropAtTheSameTime, sent],
    ]) {
      expect(stitchConnections(flows).map(connection => connection.result)).toEqual(['blocked']);
    }
  });

  it('keeps UDP packets sent at the same time apart when their records interleave', () => {
    // Sent from two CPUs at once: both leave the pod before either is handed on.
    const connections = stitchConnections([
      toWorld(1, { observationPoint: 'FROM_ENDPOINT' }),
      toWorld(2, { observationPoint: 'FROM_ENDPOINT' }),
      toWorld(3, { observationPoint: 'TO_STACK' }),
      toWorld(4, { observationPoint: 'TO_STACK' }),
    ]);
    expect(connections.map(connection => [connection.result, connection.flows.length])).toEqual([
      ['left-cluster', 2],
      ['left-cluster', 2],
    ]);
  });

  it('keeps UDP packets apart when a record comes at an earlier checkpoint or long after', () => {
    const results = (flows: FlowRecord[]) =>
      stitchConnections(flows).map(connection => connection.flows.length);
    // A packet handed on to the stack doesn't leave the pod again afterwards.
    expect(
      results([
        toWorld(1000, { observationPoint: 'TO_STACK' }),
        toWorld(1001, { observationPoint: 'FROM_ENDPOINT' }),
      ])
    ).toEqual([1, 1]);
    // And one packet's records aren't seconds apart.
    expect(
      results([
        toWorld(1000, { observationPoint: 'FROM_ENDPOINT' }),
        toWorld(31000, { observationPoint: 'TO_STACK' }),
      ])
    ).toEqual([1, 1]);
  });

  it('turns a connection around when a later flow is sure its guessed direction was wrong', () => {
    // A UDP server on a higher port than the client: Hubble doesn't know the direction
    // of the request, so it's guessed from the ports, until the answer says otherwise.
    const udp = (flow: FlowRecord): FlowRecord => ({ ...flow, protocol: 'UDP' });
    const connections = stitchConnections([
      udp(
        tcpFlow({
          ms: 1,
          from: client,
          to: server,
          fromPort: 30100,
          toPort: 40000,
          flags: undefined,
        })
      ),
      udp(
        tcpFlow({
          ms: 2,
          from: server,
          to: client,
          fromPort: 40000,
          toPort: 30100,
          flags: undefined,
          isReply: true,
        })
      ),
    ]);
    expect(connections).toHaveLength(1);
    expect(connections[0].client.ip).toBe(client);
    expect(connections[0].server.port).toBe(40000);
    expect(connections[0].answered).toBe(true);
    expect(connections[0].result).toBe('delivered');
  });

  it('counts a connection as delivered after a drop when a later SYN got through', () => {
    // The SYN was dropped, then sent again once a policy allowed it, and answered.
    const [connection, ...rest] = stitchConnections([
      tcpFlow({ ...syn, ms: 1000, verdict: 'DROPPED', point: '' }),
      tcpFlow({ ...syn, ms: 31000 }),
      tcpFlow({
        ms: 31001,
        from: server,
        to: client,
        fromPort: 80,
        toPort: 40000,
        flags: { syn: true, ack: true },
        isReply: true,
      }),
    ]);
    expect(rest).toHaveLength(0);
    expect(connection.result).toBe('delivered');
    expect(connection.dropReason).toBe('POLICY_DENIED');
    expect(connection.answered).toBe(true);
  });

  it('does not take a UDP reply as the answer to a dropped packet', () => {
    const udp = (ms: number, extra: Partial<FlowRecord> = {}): FlowRecord => ({
      ...tcpFlow({ ...syn, ms, fromPort: 40000, toPort: 53, flags: undefined }),
      protocol: 'UDP',
      isReply: false,
      ...extra,
    });
    const connections = stitchConnections([
      udp(1),
      udp(2, dropped),
      {
        ...tcpFlow({
          ms: 3,
          from: server,
          to: client,
          fromPort: 53,
          toPort: 40000,
          flags: undefined,
        }),
        protocol: 'UDP',
        isReply: true,
      },
    ]);
    expect(connections.map(connection => [connection.result, connection.answered])).toEqual([
      ['delivered', true],
      ['blocked', false],
    ]);
  });

  it('keeps replies from two server ports apart when no request was seen', () => {
    const reply = (ms: number, fromPort: number) =>
      tcpFlow({
        ms,
        from: server,
        to: client,
        fromPort,
        toPort: 40000,
        flags: { ack: true },
        isReply: true,
      });
    const ports = (flows: FlowRecord[]) =>
      stitchConnections(flows).map(connection => [connection.server.port, connection.flows.length]);
    expect(ports([reply(1, 80), reply(2, 443), reply(3, 80)])).toEqual([
      [80, 2],
      [443, 1],
    ]);
    // With a Service, the first reply comes from another port than the request went to,
    // but a third port is still another connection.
    expect(ports([tcpFlow({ ...syn, toPort: 8080 }), reply(2, 80), reply(3, 443)])).toEqual([
      [8080, 2],
      [443, 1],
    ]);
    // The same for UDP.
    const udp = (flow: FlowRecord): FlowRecord => ({
      ...flow,
      protocol: 'UDP',
      tcpFlags: undefined,
    });
    expect(ports([udp(reply(1, 80)), udp(reply(2, 443))])).toEqual([
      [80, 1],
      [443, 1],
    ]);
  });

  it('shows the reason and node of the drop that decided the result', () => {
    const [connection] = stitchConnections([
      {
        ...tcpFlow({ ...syn, verdict: 'DROPPED', point: '' }),
        dropReason: 'CT_MAP_INSERTION_FAILED',
      },
      tcpFlow({ ...syn, ms: 2, flags: { ack: true } }),
      tcpFlow({
        ...syn,
        ms: 3,
        flags: { ack: true },
        verdict: 'DROPPED',
        point: '',
        node: 'node-b',
      }),
    ]);
    expect(connection.result).toBe('blocked');
    expect(connection.dropReason).toBe('POLICY_DENIED');
    expect(connection.dropNode).toBe('node-b');
  });

  it('gives a UDP reply to the packet sent to its port, also behind a Service', () => {
    const request = (ms: number, toPort: number): FlowRecord => ({
      ...tcpFlow({ ...syn, ms, toPort, flags: undefined }),
      protocol: 'UDP',
      isReply: false,
    });
    const reply = (ms: number, fromPort: number): FlowRecord => ({
      ...tcpFlow({ ms, from: server, to: client, fromPort, toPort: 40000, flags: undefined }),
      protocol: 'UDP',
      isReply: true,
    });
    const answered = (flows: FlowRecord[]) =>
      stitchConnections(flows).map(connection => [connection.server.port, connection.answered]);
    // One client port sends to two ports of the server, and the answer comes from the first.
    expect(answered([request(1, 53), request(2, 123), reply(3, 53)])).toEqual([
      [53, true],
      [123, false],
    ]);
    // A Service sends the packets to port 5353 of the pod, and the replies come from its
    // port 53. Each reply answers the packet that is still waiting for one.
    expect(answered([request(1, 5353), reply(2, 53), request(3, 5353), reply(4, 53)])).toEqual([
      [5353, true],
      [5353, true],
    ]);
  });

  /** A UDP reply from port 53 of the server to the client. */
  const udpReply = (ms: number, point?: string): FlowRecord => ({
    ...tcpFlow({
      ms,
      from: server,
      to: client,
      fromPort: 53,
      toPort: 40000,
      flags: undefined,
      point,
    }),
    protocol: 'UDP',
    isReply: true,
  });

  it('counts repeated UDP replies from one port as their own flow events when no request was seen', () => {
    // Packets to the node aren't recorded on the way there, only the replies coming back.
    const flowsPerEvent = (flows: FlowRecord[]) =>
      stitchConnections(flows).map(connection => connection.flows.length);
    expect(flowsPerEvent([udpReply(0), udpReply(30000), udpReply(60000)])).toEqual([1, 1, 1]);
    // One reply recorded at two checkpoints is still one flow event.
    expect(flowsPerEvent([udpReply(0, 'TO_OVERLAY'), udpReply(0, 'TO_ENDPOINT')])).toEqual([2]);
  });

  it('gives a UDP request the reply stamped just before it, not an older one', () => {
    // The other node stamped the reply a little before the request, and earlier replies
    // from the same port were seen without their requests.
    const request = (ms: number): FlowRecord => ({
      ...tcpFlow({ ...syn, ms, toPort: 53, flags: undefined, node: 'node-b' }),
      protocol: 'UDP',
      isReply: false,
    });
    const events = (flows: FlowRecord[]) =>
      stitchConnections(flows).map(connection => [
        connection.firstSeen.getTime(),
        connection.flows.length,
      ]);
    expect(events([udpReply(0), udpReply(30000), request(30005)])).toEqual([
      [0, 1],
      [30000, 2],
    ]);
    // A request long after the replies starts its own flow event, with its reply.
    expect(events([udpReply(0), udpReply(30000), request(60000), udpReply(60001)])).toEqual([
      [0, 1],
      [30000, 1],
      [60000, 2],
    ]);
  });

  it.each([80, 8080])('keeps an old reply-only TCP connection apart from a new SYN to %i', port => {
    for (const closed of [false, true]) {
      const reply = (ms: number) =>
        tcpFlow({
          ms,
          from: server,
          to: client,
          fromPort: 80,
          toPort: 40000,
          flags: closed ? { fin: true, ack: true } : { ack: true },
          isReply: true,
        });
      const connections = stitchConnections([
        reply(0),
        tcpFlow({ ...syn, ms: 30000, toPort: port }),
        { ...reply(30001), source: { ...reply(30001).source, port } },
      ]);
      expect(connections.map(c => [c.server.port, c.flows.length])).toEqual([
        [80, 1],
        [port, 2],
      ]);
    }
  });

  it('stops accepting skewed SYNs after a later close or the skew window', () => {
    const reply = tcpFlow({
      ms: 0,
      from: server,
      to: client,
      fromPort: 80,
      toPort: 40000,
      flags: { fin: true, ack: true },
      isReply: true,
    });
    expect(
      stitchConnections([reply, tcpFlow({ ...syn, ms: 10 }), tcpFlow({ ...syn, ms: 2000 })])
    ).toHaveLength(2);
    expect(
      stitchConnections([
        reply,
        tcpFlow({ ...syn, ms: 10 }),
        tcpFlow({ ...syn, ms: 11, flags: { fin: true, ack: true } }),
        tcpFlow({ ...syn, ms: 12 }),
      ])
    ).toHaveLength(2);
  });

  const udpRequest = (ms: number, toPort = 53): FlowRecord => ({
    ...tcpFlow({ ...syn, ms, toPort, flags: undefined }),
    protocol: 'UDP',
    isReply: false,
  });

  it('counts later UDP replies separately when their requests were not observed', () => {
    const connections = stitchConnections([
      udpRequest(0),
      udpReply(1),
      udpReply(30000),
      udpReply(60000),
    ]);
    expect(connections.map(c => c.flows.length)).toEqual([2, 1, 1]);
  });

  it('keeps interleaved replies to two pending UDP requests with their own events', () => {
    const flows = [
      udpRequest(0),
      udpRequest(1),
      udpReply(2, 'FROM_ENDPOINT'),
      udpReply(3, 'FROM_ENDPOINT'),
      udpReply(4, 'TO_ENDPOINT'),
      udpReply(5, 'TO_ENDPOINT'),
    ];
    for (const input of [flows, [...flows].reverse()]) {
      const connections = stitchConnections(input);
      expect(connections.map(c => c.flows.length)).toEqual([3, 3]);
      expect(connections.map(c => c.answered)).toEqual([true, true]);
    }
  });

  it('matches a late UDP request to its own reply port before a different port', () => {
    const otherReply = { ...udpReply(1), source: { ...udpReply(1).source, port: 123 } };
    const connections = stitchConnections([udpReply(0), otherReply, udpRequest(2)]);
    expect(connections.map(c => [c.server.port, c.flows.length])).toEqual([
      [53, 2],
      [123, 1],
    ]);
  });

  it('keeps later TCP data with a reply-only connection when no new SYN was seen', () => {
    const connections = stitchConnections([
      tcpFlow({
        ms: 0,
        from: server,
        to: client,
        fromPort: 80,
        toPort: 40000,
        flags: { ack: true },
        isReply: true,
      }),
      tcpFlow({ ...syn, ms: 30000, flags: { ack: true } }),
    ]);
    expect(connections).toHaveLength(1);
    expect(connections[0].flows).toHaveLength(2);

    // Behind a Service the replies show its port 80 and the client's data the pod's 8080.
    const behindService = stitchConnections([
      tcpFlow({
        ms: 0,
        from: server,
        to: client,
        fromPort: 80,
        toPort: 40000,
        flags: { ack: true },
        isReply: true,
      }),
      tcpFlow({ ...syn, ms: 30000, toPort: 8080, flags: { ack: true } }),
    ]);
    expect(behindService.map(c => [c.server.port, c.flows.length])).toEqual([[8080, 2]]);
  });

  it.each(['ICMPv4', 'ICMPv6'])('keeps repeated %s echo requests and replies apart', protocol => {
    const echo = (flow: FlowRecord): FlowRecord => ({
      ...flow,
      protocol,
      source: { ...flow.source, port: 0 },
      destination: { ...flow.destination, port: 0 },
    });
    const connections = stitchConnections(
      [udpRequest(0), udpRequest(1), udpReply(2), udpReply(3), udpReply(30000)].map(echo).reverse()
    );
    expect(connections.map(c => c.flows.length)).toEqual([2, 2, 1]);
    expect(connections.every(c => c.answered)).toBe(true);
  });
});
