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

import type { FlowPeer, FlowRecord } from './flows';

/**
 * What happened to one connection. A connection gets exactly one result, so the same
 * connection is never counted twice, whatever checkpoints and nodes recorded it.
 */
export type ConnectionResult = 'blocked' | 'delivered' | 'left-cluster' | 'not-seen-arriving';

/** Hubble's verdict for a flow that was dropped. */
const DROPPED = 'DROPPED';

/** The checkpoint where a flow is handed to the pod it was sent to. */
const TO_ENDPOINT = 'TO_ENDPOINT';

/** The checkpoint where a flow leaves the pod that sent it. */
const FROM_ENDPOINT = 'FROM_ENDPOINT';

/** One end of a connection. */
export interface Peer {
  ip: string;
  port: number;
  /** The pod's namespace, empty outside the cluster. */
  namespace: string;
  /** The pod's name, empty outside the cluster. */
  pod: string;
  /** The workload (Deployment, StatefulSet...) the pod belongs to, or the pod name. */
  workload: string;
  /** DNS names Hubble saw for this end, e.g. for traffic leaving the cluster. */
  names: string[];
  /** True when the end is outside the cluster. */
  outside: boolean;
  /** Cilium's reserved identities of an end that isn't a pod, like "host". */
  reserved: string[];
}

/** All the flows of one connection, stitched together. */
export interface Connection {
  /** Protocol, the client's address and the server's IP, see {@link connectionKey}. */
  key: string;
  protocol: string;
  client: Peer;
  server: Peer;
  result: ConnectionResult;
  /** True when a flow from the server back to the client was seen. */
  answered: boolean;
  /**
   * Why it was dropped, for blocked connections and for ones that got through after a
   * drop, like a SYN sent again once a policy allowed it.
   */
  dropReason: string;
  /** The node that dropped it, when it was dropped. */
  dropNode: string;
  firstSeen: Date;
  lastSeen: Date;
  /** Every node that recorded a flow of this connection. */
  nodes: string[];
  flows: FlowRecord[];
}

/** Key of a pod in {@link podWorkloads}. */
const podKey = (peer: FlowPeer) => `${peer.namespace ?? ''}/${peer.pod ?? ''}`;

/**
 * Finds the workload of a pod from any flow that names it. Hubble only knows a pod's
 * workload on the node the pod runs on, so a flow recorded on another node has the
 * pod's name but no workload. A pod no flow names a workload for keeps its own name.
 * Its workload isn't guessed from pods with similar names, since a bare pod api-debug
 * would then show up as the StatefulSet api of the pod api-0.
 */
function podWorkloads(flows: FlowRecord[]) {
  const workloads = new Map<string, string>();
  for (const flow of flows) {
    for (const peer of [flow.source, flow.destination]) {
      if (peer.pod && peer.workload) {
        workloads.set(podKey(peer), peer.workload);
      }
    }
  }
  return (peer: FlowPeer) => peer.workload || workloads.get(podKey(peer));
}

function toPeer(peer: FlowPeer, workloadOf: (peer: FlowPeer) => string | undefined): Peer {
  return {
    ip: peer.ip,
    port: peer.port,
    namespace: peer.namespace ?? '',
    pod: peer.pod ?? '',
    workload: (peer.pod && workloadOf(peer)) || peer.pod || '',
    names: peer.names ?? [],
    outside: !!peer.outside,
    reserved: peer.reserved ?? [],
  };
}

const address = (peer: { ip: string; port: number }) => `${peer.ip}:${peer.port}`;

const isSyn = (flow: FlowRecord) => !!flow.tcpFlags?.syn && !flow.tcpFlags.ack;

const hasEnded = (flow: FlowRecord) => !!(flow.tcpFlags?.fin || flow.tcpFlags?.rst);

const flowTime = (flow: FlowRecord) => new Date(flow.time).getTime() || 0;

/**
 * The part of a flow's time below a millisecond, in nanoseconds. Hubble records times to
 * the nanosecond but a Date keeps milliseconds, and the checkpoints of one packet are
 * often microseconds apart.
 */
const subMillisecond = (flow: FlowRecord) =>
  Number((/\.\d{3}(\d{1,6})/.exec(flow.time)?.[1] ?? '').padEnd(6, '0'));

/**
 * Orders flows by time. A drop recorded at the same time as another flow goes last, since
 * nothing follows the drop of a packet.
 */
const byTime = (a: FlowRecord, b: FlowRecord) =>
  flowTime(a) - flowTime(b) ||
  subMillisecond(a) - subMillisecond(b) ||
  Number(a.verdict === DROPPED) - Number(b.verdict === DROPPED);

/**
 * How many of the latest packets between the same two ends a later record can still
 * join. One packet's checkpoints are microseconds apart, but packets sent at the same
 * time from different CPUs can be recorded interleaved.
 */
const OPEN_PACKETS = 8;

/**
 * How far apart in time the records of one packet can be. A packet goes through the
 * checkpoints of its node within microseconds, so records further apart than this are
 * of different packets.
 */
const SAME_PACKET_MS = 1000;

/** The checkpoints on the way out of a pod to outside the cluster, in the order passed. */
const WAY_OUT = ['FROM_ENDPOINT', 'TO_STACK', 'TO_NETWORK'];

/** Protocol, the client's IP and port, and the server's IP. */
const endsKey = (protocol: string, client: Peer, server: Peer) =>
  `${protocol} ${address(client)} -> ${server.ip}`;

/**
 * Protocol, the client's IP and port, and the server's IP and port, so connections to
 * different ports of a server stay apart. The port is the one the request went to.
 */
export function connectionKey(protocol: string, client: Peer, server: Peer) {
  return `${endsKey(protocol, client, server)}:${server.port}`;
}

/**
 * Decides which end of a flow started the connection: the SYN sender, else the side that
 * isn't replying, else the sender of a dropped packet, else the side with the higher
 * (ephemeral) port.
 *
 * @returns 'source' or 'destination', and whether the answer is certain.
 */
function clientSide(flow: FlowRecord): { side: 'source' | 'destination'; sure: boolean } {
  if (isSyn(flow)) {
    return { side: 'source', sure: true };
  }
  if (flow.isReply !== undefined) {
    return { side: flow.isReply ? 'destination' : 'source', sure: true };
  }
  // Hubble has no direction for drops. A policy only drops the first packets of a
  // connection, since replies of an allowed connection pass, so the sender opened it.
  // Without this, a UDP packet to a high port would be read as a reply.
  if (flow.verdict === DROPPED) {
    return { side: 'source', sure: true };
  }
  return {
    side: flow.source.port >= flow.destination.port ? 'source' : 'destination',
    sure: false,
  };
}

interface Building {
  key: string;
  protocol: string;
  client: Peer;
  server: Peer;
  clientSure: boolean;
  /** Whether a flow from the client to the server was seen, which gives the server port. */
  requestSeen: boolean;
  /** The server's port on the replies, which a Service can show as another port. */
  replyPort?: number;
  ended: boolean;
  /** Deadline for repeated SYN observations after a close stamped before the request. */
  lateSynUntil?: number;
  flows: FlowRecord[];
}

/** Whether the request went to this port of the server or the replies came from it. */
const sameReplyPort = (connection: Building, port: number) =>
  connection.server.port === port || connection.replyPort === port;

/**
 * Whether the request was seen but no reply yet. Its first reply can come from another
 * port than the request went to, since a Service can change it. A connection seen only
 * in replies has no request to tell that, so replies from another port aren't its own.
 */
const awaitsFirstReply = (connection: Building) =>
  connection.requestSeen && connection.replyPort === undefined;

/**
 * The port a flow event's replies come from: the one seen on them, else the one seen on
 * the replies to another packet sent to the same port, since a Service can change it,
 * else the port the request went to.
 */
function replyPortOf(event: Building, events: Building[]) {
  const learned = events.find(
    other => other.server.port === event.server.port && other.replyPort !== undefined
  );
  return event.replyPort ?? learned?.replyPort ?? event.server.port;
}

/**
 * Whether a flow from sender can be another record of the packet sender sent in this
 * flow event: the client's packet or the server's reply. A
 * packet is recorded at most once at each checkpoint, passes them in order and within a
 * moment, nothing follows its drop, and it can only be dropped before it got further
 * than leaving the pod.
 */
function canBeSamePacket(event: Building, flow: FlowRecord, sender: Peer) {
  const step = WAY_OUT.indexOf(flow.observationPoint);
  return !event.flows.some(seen => {
    if (address(seen.source) !== address(sender)) {
      return false;
    }
    const seenStep = WAY_OUT.indexOf(seen.observationPoint);
    return (
      seen.observationPoint === flow.observationPoint ||
      seen.verdict === DROPPED ||
      (flow.verdict === DROPPED && seen.observationPoint !== FROM_ENDPOINT) ||
      (step !== -1 && seenStep > step) ||
      flowTime(flow) - flowTime(seen) > SAME_PACKET_MS
    );
  });
}

const isDropped = (connection: Building) => connection.flows.some(flow => flow.verdict === DROPPED);

/**
 * Whether a request can be the one that a flow event seen only in replies answered. With
 * the two ends on two nodes, the reply can be stamped before its request when the clocks
 * differ a little, but not by more than a moment.
 */
const canBeLateRequest = (event: Building, flow: FlowRecord) =>
  !event.requestSeen &&
  event.flows.every(seen => flowTime(flow) - flowTime(seen) <= SAME_PACKET_MS);

/**
 * Turns around the open connections that flows of a guessed direction started the wrong
 * way round, once a flow from client is sure of the direction. They're the connections
 * of the same ends the other way whose server port is the client's port.
 */
function turnGuessedAround(
  open: Map<string, Building[]>,
  reversed: string,
  ends: string,
  client: Peer
) {
  const others = open.get(reversed) ?? [];
  const wrong = others.filter(
    connection => !connection.clientSure && connection.server.port === client.port
  );
  if (!wrong.length) {
    return;
  }
  const rest = others.filter(connection => !wrong.includes(connection));
  if (rest.length) {
    open.set(reversed, rest);
  } else {
    open.delete(reversed);
  }
  for (const connection of wrong) {
    [connection.client, connection.server] = [connection.server, connection.client];
    connection.clientSure = true;
    const request = connection.flows.find(
      flow => address(flow.source) === address(connection.client)
    );
    connection.requestSeen = !!request;
    if (request) {
      connection.server.port = request.destination.port;
    }
    connection.replyPort = connection.flows.find(
      flow => address(flow.source) === address(connection.server)
    )?.source.port;
    connection.key = connectionKey(connection.protocol, connection.client, connection.server);
  }
  open.set(ends, [...(open.get(ends) ?? []), ...wrong]);
}

/** Merges what two flows know about the same end, keeping names and pod details. */
function mergePeer(known: Peer, seen: Peer): Peer {
  return {
    ...known,
    namespace: known.namespace || seen.namespace,
    pod: known.pod || seen.pod,
    workload: known.workload || seen.workload,
    names: [...new Set([...known.names, ...seen.names])],
    outside: known.outside || seen.outside,
    reserved: [...new Set([...known.reserved, ...seen.reserved])],
  };
}

function finish(connection: Building): Connection {
  const flows = connection.flows;
  const times = flows.map(flowTime);
  // The last drop is the one that decides whether the connection ended blocked, so its
  // reason and node are the ones shown.
  const drop = [...flows].reverse().find(flow => flow.verdict === DROPPED);
  let answered = false;
  let delivered = false;
  let sent = false;
  // Whether the traffic got through after the last drop, like a SYN sent again once a
  // policy allowed it. Then the connection isn't blocked, but keeps the drop's reason.
  let throughSinceDrop = false;
  for (const flow of flows) {
    // True when the flow goes from the connection's client to its server.
    const toServer = address(flow.source) === address(connection.client);
    if (toServer) {
      if (flow.observationPoint === TO_ENDPOINT) {
        delivered = true;
      }
      sent = true;
    } else {
      answered = true;
    }
    if (flow.verdict === DROPPED) {
      throughSinceDrop = false;
    } else if (!toServer || flow.observationPoint === TO_ENDPOINT || connection.server.outside) {
      throughSinceDrop = true;
    }
  }

  let result: ConnectionResult = 'not-seen-arriving';
  if (drop && !throughSinceDrop) {
    result = 'blocked';
  } else if (connection.server.outside && (sent || answered)) {
    result = 'left-cluster';
  } else if (delivered || answered) {
    // An answer means the server got the connection, also when the delivery itself
    // wasn't recorded, like for traffic to the node or the API server.
    result = 'delivered';
  }

  return {
    key: connection.key,
    protocol: connection.protocol,
    client: connection.client,
    server: connection.server,
    result,
    answered,
    dropReason: drop?.dropReason ?? '',
    dropNode: drop?.node ?? '',
    firstSeen: new Date(Math.min(...times)),
    lastSeen: new Date(Math.max(...times)),
    nodes: [...new Set(flows.map(flow => flow.node ?? '').filter(Boolean))].sort(),
    flows,
  };
}

/**
 * Stitches Hubble flows into connections, so one connection counts once even when it
 * was recorded at several checkpoints, by both nodes, and in both directions.
 *
 * @param flows - Flows from the adapter, in any order.
 * @returns The connections, oldest first.
 */
export function stitchConnections(flows: FlowRecord[]): Connection[] {
  const sorted = [...flows].sort(byTime);
  const workloadOf = podWorkloads(flows);
  // Open connections by protocol, client address and server IP. There is usually one per
  // entry; more when a client port talked to several ports of the same server.
  const open = new Map<string, Building[]>();
  const done: Building[] = [];

  for (const flow of sorted) {
    const source = toPeer(flow.source, workloadOf);
    const destination = toPeer(flow.destination, workloadOf);
    const { side, sure } = clientSide(flow);
    let client = side === 'source' ? source : destination;
    let server = side === 'source' ? destination : source;
    let ends = endsKey(flow.protocol, client, server);
    // A flow whose direction was only guessed joins a connection already seen the other way.
    const reversed = endsKey(flow.protocol, server, client);
    if (!sure && !open.has(ends) && open.has(reversed)) {
      [client, server, ends] = [server, client, reversed];
    }
    // And connections that such flows started the wrong way round turn around once a flow
    // is sure of the direction.
    if (sure) {
      turnGuessedAround(open, reversed, ends, client);
    }
    const toServer = address(source) === address(client);

    // A request names the server port it went to. A reply can't be trusted for that: with
    // a Service whose port differs from the pod's, Hubble shows the pod's port on the
    // request but the Service's port on the reply (seen on Cilium 1.20 with kube-proxy).
    // So a reply joins the connection with that port if there is one, else the latest one
    // still waiting for its first reply, see awaitsFirstReply.
    // Nodes' clocks differ a little, so with the two ends on two nodes the reply can be
    // stamped before its request. A request then joins the connection only its replies
    // started, whose port it couldn't know yet.
    const candidates = open.get(ends) ?? [];
    let connection: Building | undefined;
    if (flow.protocol === 'TCP') {
      const latest = [...candidates].reverse();
      // A SYN starts a connection, so it only joins one seen only in replies when they were
      // stamped just before it. The client's other packets continue the connection those
      // replies belong to, also when a Service shows them on another port.
      const canJoinRepliesOnly = (candidate: Building) =>
        isSyn(flow) ? canBeLateRequest(candidate, flow) : !candidate.requestSeen;
      connection = toServer
        ? latest.find(
            candidate =>
              candidate.server.port === server.port &&
              (candidate.requestSeen || canJoinRepliesOnly(candidate))
          ) ?? latest.find(canJoinRepliesOnly)
        : latest.find(candidate => sameReplyPort(candidate, server.port)) ??
          latest.find(awaitsFirstReply);
      // A close stamped before the first SYN can also precede that SYN's other
      // observations. Keep those together only within the same clock-skew window;
      // another close after the request ends that exception.
      if (connection?.ended && isSyn(flow)) {
        if (canBeLateRequest(connection, flow)) {
          connection.lateSynUntil = flowTime(connection.flows[0]) + SAME_PACKET_MS;
        } else if (
          connection.lateSynUntil === undefined ||
          flowTime(flow) > connection.lateSynUntil
        ) {
          done.push(connection);
          candidates.splice(candidates.indexOf(connection), 1);
          connection = undefined;
        }
      }
    } else if (toServer) {
      // Other protocols have no connection to stitch: each packet the client sends is its
      // own flow event, with its replies. Packets sent at the same time can be recorded
      // interleaved, so a record joins the oldest of the latest packets it can be part of,
      // else the flow event of a reply stamped just before it, and starts a new flow event
      // when there is none.
      const lateReplies = [...candidates]
        .reverse()
        .filter(candidate => canBeLateRequest(candidate, flow));
      connection =
        candidates.find(
          candidate =>
            candidate.requestSeen &&
            candidate.server.port === server.port &&
            canBeSamePacket(candidate, flow, client)
        ) ??
        lateReplies.find(candidate => sameReplyPort(candidate, server.port)) ??
        lateReplies[0];
    } else {
      // A reply answers the latest packet whose replies come from its port. Only when there
      // is none can it be the first reply of a packet sent to another port, and a dropped
      // packet gets none. Once a reply is recorded, another record joins it only when
      // it can be another checkpoint of that packet, even if its request was seen.
      const answerable = candidates
        .filter(candidate => !isDropped(candidate) && canBeSamePacket(candidate, flow, server))
        .reverse();
      connection =
        answerable.find(candidate => replyPortOf(candidate, candidates) === server.port) ??
        answerable.find(awaitsFirstReply);
    }
    if (!connection) {
      connection = {
        key: connectionKey(flow.protocol, client, server),
        protocol: flow.protocol,
        client,
        server,
        clientSure: sure,
        requestSeen: false,
        ended: false,
        flows: [],
      };
      candidates.push(connection);
      open.set(ends, candidates);
      if (flow.protocol !== 'TCP' && candidates.length > OPEN_PACKETS) {
        done.push(...candidates.splice(0, candidates.length - OPEN_PACKETS));
      }
    } else if (!connection.clientSure && sure) {
      connection.client = client;
      connection.server = server;
      connection.clientSure = true;
    }

    const isClientSource = address(source) === address(connection.client);
    connection.client = mergePeer(connection.client, isClientSource ? source : destination);
    connection.server = mergePeer(connection.server, isClientSource ? destination : source);
    // The request shows the port the server really got the connection on.
    if (isClientSource) {
      connection.requestSeen = true;
      connection.server.port = destination.port;
      connection.key = connectionKey(connection.protocol, connection.client, connection.server);
    } else {
      connection.replyPort ??= source.port;
    }
    if (hasEnded(flow)) {
      connection.ended = true;
      connection.lateSynUntil = undefined;
    }
    connection.flows.push(flow);
  }

  return [...done, ...[...open.values()].flat()]
    .map(finish)
    .sort((a, b) => a.firstSeen.getTime() - b.firstSeen.getTime());
}
