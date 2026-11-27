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

/**
 * PipeCD does not give API keys a piped's online status, but a piped is a pod.
 * For pipeds running in the cluster Headlamp is looking at, the pod says
 * whether it is up, and the piped's ConfigMap says which piped it is.
 */

/**
 * Label the PipeCD Helm charts put on the piped pod and ConfigMap. Each chart
 * uses its own name: `piped`, and `pipedv1-exp` for the plugin-based piped.
 */
export const PIPED_LABEL_SELECTOR = 'app.kubernetes.io/name in (piped,pipedv1-exp)';

/** The parts of a Pod this needs, as in its JSON. */
export interface PodLike {
  metadata: { name: string; namespace?: string };
  spec?: { volumes?: { configMap?: { name?: string } }[] };
  status?: {
    phase?: string;
    containerStatuses?: { ready?: boolean; state?: { waiting?: { reason?: string } } }[];
  };
}

/** The parts of a ConfigMap this needs, as in its JSON. */
export interface ConfigMapLike {
  metadata: { name: string; namespace?: string };
  data?: Record<string, string>;
}

export interface ClusterPiped {
  /** True when at least one of the piped's pods is running and ready. */
  running: boolean;
  namespace: string;
  pod: string;
  /** Why it is not running, e.g. "CrashLoopBackOff" or "Pending". */
  reason: string;
}

/** Reads `pipedID` from a piped config file. */
export function pipedIdFromConfig(config: string): string | undefined {
  // Spaces and tabs only: a blank id must not pick up the next line.
  return /^[ \t]*pipedID:[ \t]*["']?([\w-]+)/m.exec(config)?.[1];
}

function isReady(pod: PodLike): boolean {
  const containers = pod.status?.containerStatuses ?? [];
  return pod.status?.phase === 'Running' && containers.length > 0 && containers.every(c => c.ready);
}

function notRunningReason(pod: PodLike): string {
  for (const c of pod.status?.containerStatuses ?? []) {
    const reason = c.state?.waiting?.reason;
    if (reason) return reason;
  }
  return pod.status?.phase === 'Running' ? 'NotReady' : pod.status?.phase || 'Unknown';
}

/** Where a ConfigMap lives, as `namespace/name`. */
function configMapKey(namespace: string, name: string): string {
  return `${namespace}/${name}`;
}

function mountedConfigMaps(pod: PodLike): string[] {
  return (pod.spec?.volumes ?? [])
    .map(v => v.configMap?.name)
    .filter((name): name is string => !!name);
}

/**
 * ConfigMaps mounted by piped pods that mount none of `configMaps`. The Helm
 * chart can use an existing ConfigMap (`config.create=false`), which need not
 * carry the chart's labels, so a label search does not find it. A pod that
 * already mounts a listed ConfigMap is skipped, so its other mounts (CA
 * bundles, scripts) are not read.
 */
export function unlistedConfigMaps(
  pods: PodLike[],
  configMaps: ConfigMapLike[]
): { namespace: string; name: string }[] {
  const listed = new Set(
    configMaps.map(cm => configMapKey(cm.metadata.namespace ?? '', cm.metadata.name))
  );
  const missing = new Map<string, { namespace: string; name: string }>();
  for (const pod of pods) {
    const namespace = pod.metadata.namespace ?? '';
    const names = mountedConfigMaps(pod);
    if (names.some(name => listed.has(configMapKey(namespace, name)))) continue;
    for (const name of names) missing.set(configMapKey(namespace, name), { namespace, name });
  }
  return [...missing.values()];
}

/**
 * Matches piped pods to piped ids through the ConfigMap each pod mounts.
 * A pod whose ConfigMap cannot be read or has no pipedID is skipped.
 */
export function clusterPipeds(
  pods: PodLike[],
  configMaps: ConfigMapLike[]
): Map<string, ClusterPiped> {
  const idByConfigMap = new Map<string, string>();
  for (const cm of configMaps) {
    for (const value of Object.values(cm.data ?? {})) {
      const id = pipedIdFromConfig(value);
      if (id) {
        idByConfigMap.set(configMapKey(cm.metadata.namespace ?? '', cm.metadata.name), id);
        break;
      }
    }
  }

  const result = new Map<string, ClusterPiped>();
  for (const pod of pods) {
    const namespace = pod.metadata.namespace ?? '';
    const id = mountedConfigMaps(pod)
      .map(name => idByConfigMap.get(configMapKey(namespace, name)))
      .find(Boolean);
    if (!id) continue;

    const entry: ClusterPiped = {
      running: isReady(pod),
      namespace,
      pod: pod.metadata.name,
      reason: isReady(pod) ? '' : notRunningReason(pod),
    };
    // During a rollout a piped has two pods; it is running if either is.
    const existing = result.get(id);
    if (!existing || (!existing.running && entry.running)) result.set(id, entry);
  }
  return result;
}
