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

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import type { AdapterService } from '../utils/settings';

/** One end of a flow, as the hubble-flows-adapter returns it. */
export interface FlowPeer {
  ip: string;
  /** 0 for protocols without ports. */
  port: number;
  namespace?: string;
  pod?: string;
  /** The Deployment, StatefulSet or similar that the pod belongs to. */
  workload?: string;
  /** DNS names Hubble saw for this end. */
  names?: string[];
  /** True when this end is outside the cluster. */
  outside?: boolean;
  /**
   * Cilium's reserved identities of an end that isn't a pod, like "host",
   * "kube-apiserver", "remote-node" or "world".
   */
  reserved?: string[];
}

/** The part of a Hubble flow the adapter returns, see adapter/flow.go. */
export interface FlowRecord {
  /** RFC 3339 time the flow was recorded. */
  time: string;
  /** The node that recorded it. */
  node?: string;
  /** Hubble's verdict, like "FORWARDED" or "DROPPED". */
  verdict: string;
  /** Why it was dropped, like "POLICY_DENIED". */
  dropReason?: string;
  /** Where on the node it was seen, like "TO_ENDPOINT". */
  observationPoint: string;
  /** Missing when Hubble couldn't tell the direction. */
  isReply?: boolean;
  protocol: string;
  tcpFlags?: { syn?: boolean; ack?: boolean; fin?: boolean; rst?: boolean };
  source: FlowPeer;
  destination: FlowPeer;
}

/** The flows Relay had, the events the nodes lost, and the nodes it couldn't read. */
export interface FlowSnapshot {
  flows: FlowRecord[];
  lostEvents: number;
  unreadNodes: string[];
}

/** The pods to load flows for: a whole namespace, or one pod in it. */
export interface FlowScope {
  namespace: string;
  pod?: string;
}

/**
 * The adapter's flows URL behind the Kubernetes API server's Service proxy, so the
 * request uses the user's own credentials and RBAC.
 */
export function flowsPath(service: AdapterService, scope: FlowScope) {
  const query = new URLSearchParams({ namespace: scope.namespace });
  if (scope.pod) {
    query.set('pod', scope.pod);
  }
  const { namespace, name, port } = service;
  const target = [namespace, name, port].map(encodeURIComponent);
  return `/api/v1/namespaces/${target[0]}/services/${target[1]}:${target[2]}/proxy/v1/flows?${query}`;
}

/**
 * Asks the adapter for the most recent flows of a namespace or pod. This is a one-shot
 * snapshot, not a live stream.
 *
 * @param cluster - The cluster to ask.
 * @param service - Where the adapter's Service is.
 * @param scope - The namespace, and optionally the pod, to load flows for.
 */
export async function getFlowSnapshot(
  cluster: string,
  service: AdapterService,
  scope: FlowScope
): Promise<FlowSnapshot> {
  const body: Partial<FlowSnapshot> | null = await ApiProxy.clusterRequest(
    flowsPath(service, scope),
    { cluster, autoLogoutOnAuthError: false }
  );
  // Another Service could be answering at this address, so don't trust the shape.
  if (!body || !Array.isArray(body.flows)) {
    throw new Error('The answer is not a list of flows. Is this Service the hubble-flows-adapter?');
  }
  return {
    flows: body.flows,
    lostEvents: Number(body.lostEvents) || 0,
    unreadNodes: Array.isArray(body.unreadNodes) ? body.unreadNodes.map(String) : [],
  };
}
