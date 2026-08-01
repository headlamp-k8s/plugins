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

// `apiList` is invoked unbound at the call site, so its `this` parameter is
// irrelevant for the probe. We type the injection point with a plain function
// shape that matches the call signature (`onList`, `onError`, `opts`) without
// the (unusable here) KubeObject class-binding `this` parameter.
export type ApiListFn = (
  onList: (items: ReadonlyArray<{ jsonData?: { metadata?: { name?: string } } }>) => void,
  onError: () => void,
  opts?: { cluster?: string }
) => () => void;

/**
 * Result of probing whether Flux is installed on a cluster.
 *
 * - `unknown`: no probe has completed yet (caller should treat as "do not hide")
 * - `installed`: a successful CRD list contained at least one Flux CRD
 * - `absent`:   a successful CRD list contained no Flux CRDs (Flux is genuinely not installed)
 * - `error`:    the CRD list API call failed (RBAC, network, 5xx, etc.)
 *
 * Crucially, `error` and `unknown` are distinct from `absent`. The sidebar
 * filter only hides entries when the probe has confirmed Flux is `absent`.
 * On `error` we err on the side of showing the entries so users can still
 * navigate to the Overview page, which renders its own "Flux not installed"
 * empty state when its own probe says so.
 */
export type FluxInstallStatus = 'unknown' | 'installed' | 'absent' | 'error';

export interface CheckFluxInstalledHandle {
  /** Returns the last known status for the cluster (may be 'unknown'). */
  getStatus(cluster: string): FluxInstallStatus;
  /** Triggers a probe if the per-cluster TTL has elapsed and no probe is in flight. */
  ensureChecked(cluster: string): void;
  /** Removes all cached state. Useful for tests. */
  reset(): void;
}

const FLUX_CRD_NAME_PREFIX = 'fluxcd.';
const CHECK_TTL_MS = 30 * 1000;

/**
 * True if any item returned by the CRD list looks like a Flux CRD.
 * Defensive against missing fields — matches the previous check.
 */
function hasFluxCrd(crds: ReadonlyArray<{ jsonData?: { metadata?: { name?: string } } }>): boolean {
  return crds.some(crd => crd.jsonData?.metadata?.name?.includes(FLUX_CRD_NAME_PREFIX));
}

interface InternalState {
  statusByCluster: Record<string, FluxInstallStatus>;
  lastCheckedAt: Record<string, number>;
  inFlight: Record<string, boolean>;
}

/**
 * Builds a CRD probe scoped to a single cluster. Uses `apiList` (callback
 * style) so callers can wire it into non-React code paths like
 * `registerSidebarEntryFilter`.
 *
 * `apiList` is injected for testability; in production this is just
 * `K8s.ResourceClasses.CustomResourceDefinition.apiList`.
 */
export function createCheckFluxInstalled(
  apiList: ApiListFn = K8s.ResourceClasses.CustomResourceDefinition.apiList.bind(
    K8s.ResourceClasses.CustomResourceDefinition
  ) as ApiListFn
): CheckFluxInstalledHandle {
  const state: InternalState = {
    statusByCluster: {},
    lastCheckedAt: {},
    inFlight: {},
  };

  function probe(cluster: string) {
    state.inFlight[cluster] = true;

    const listFn = apiList(
      crds => {
        state.statusByCluster[cluster] = hasFluxCrd(crds) ? 'installed' : 'absent';
        state.lastCheckedAt[cluster] = Date.now();
        state.inFlight[cluster] = false;
      },
      () => {
        // Issue #972: a probe failure (RBAC denial, transient API error,
        // network blip, 5xx, etc.) is NOT the same as Flux being absent.
        // Record it as 'error' and leave the sidebar entries visible.
        state.statusByCluster[cluster] = 'error';
        state.lastCheckedAt[cluster] = Date.now();
        state.inFlight[cluster] = false;
      },
      { cluster }
    );
    listFn();
  }

  return {
    getStatus(cluster: string): FluxInstallStatus {
      return state.statusByCluster[cluster] ?? 'unknown';
    },
    ensureChecked(cluster: string): void {
      const now = Date.now();
      const fresh = now - (state.lastCheckedAt[cluster] ?? 0) < CHECK_TTL_MS;
      if (state.inFlight[cluster] || fresh) {
        return;
      }
      probe(cluster);
    },
    reset(): void {
      for (const key of Object.keys(state.statusByCluster)) {
        delete state.statusByCluster[key];
      }
      for (const key of Object.keys(state.lastCheckedAt)) {
        delete state.lastCheckedAt[key];
      }
      for (const key of Object.keys(state.inFlight)) {
        delete state.inFlight[key];
      }
    },
  };
}

const defaultCheck = createCheckFluxInstalled();

/** Returns the last known install status for the cluster. */
export function getFluxInstallStatus(cluster: string): FluxInstallStatus {
  return defaultCheck.getStatus(cluster);
}

/** Ensures a probe is running if the TTL has elapsed (used by the sidebar filter). */
export function checkFluxInstalled(cluster: string): void {
  defaultCheck.ensureChecked(cluster);
}

/** @internal — exposed only for tests. */
export const __resetForTests = () => defaultCheck.reset();
