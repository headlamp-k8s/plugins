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

import { describe, expect, it, vi } from 'vitest';
import { type ApiListFn,createCheckFluxInstalled } from './checkFluxInstalled';

interface Harness {
  check: ReturnType<typeof createCheckFluxInstalled>;
  apiList: ReturnType<typeof vi.fn>;
  triggerSuccess: (crds: any[]) => void;
  triggerError: () => void;
}

function makeHarness(): Harness {
  let onSuccess: ((data: any[]) => void) | undefined;
  let onError: (() => void) | undefined;

  const apiList = vi.fn<ApiListFn>((success, error) => {
    onSuccess = success;
    onError = error;
    return () => {
      // no-op: a real cancel-fn could clear pending state here, but the
      // module under test never invokes the cancel; tests drive the
      // callbacks directly via triggerSuccess / triggerError.
    };
  });

  const check = createCheckFluxInstalled(apiList);

  return {
    check,
    apiList,
    triggerSuccess(crds) {
      onSuccess?.(crds);
    },
    triggerError() {
      onError?.();
    },
  };
}

describe('checkFluxInstalled (issue #972)', () => {
  it("reports 'unknown' before any probe completes", () => {
    const { check } = makeHarness();
    expect(check.getStatus('cluster-a')).toBe('unknown');
  });

  it("reports 'installed' when the CRD list contains a fluxcd.* CRD", () => {
    const h = makeHarness();
    h.check.ensureChecked('cluster-a');
    h.triggerSuccess([
      { jsonData: { metadata: { name: 'kustomizations.kustomize.toolkit.fluxcd.io' } } },
    ]);
    expect(h.check.getStatus('cluster-a')).toBe('installed');
  });

  it("reports 'absent' when the CRD list succeeds with no fluxcd.* entries (Flux not installed)", () => {
    const h = makeHarness();
    h.check.ensureChecked('cluster-a');
    h.triggerSuccess([{ jsonData: { metadata: { name: 'clusters.cluster.x-k8s.io' } } }]);
    expect(h.check.getStatus('cluster-a')).toBe('absent');
  });

  // The core fix for issue #972: a probe failure MUST NOT be reported as
  // 'absent'. Previously the error callback set the cache to `false`, which
  // caused the sidebar filter to hide Flux child entries on any probe
  // failure (RBAC / 403, transient 5xx, network).
  it("reports 'error' (NOT 'absent') when the CRD list probe fails — issue #972", () => {
    const h = makeHarness();
    h.check.ensureChecked('cluster-a');
    h.triggerError();
    expect(h.check.getStatus('cluster-a')).toBe('error');
  });

  it('does not re-probe within the TTL window', () => {
    const h = makeHarness();
    h.check.ensureChecked('cluster-a');
    h.check.ensureChecked('cluster-a');
    h.check.ensureChecked('cluster-a');
    expect(h.apiList).toHaveBeenCalledTimes(1);
  });

  it('tracks each cluster independently', () => {
    const h = makeHarness();
    h.check.ensureChecked('cluster-a');
    h.check.ensureChecked('cluster-b');
    expect(h.apiList).toHaveBeenCalledTimes(2);
    expect(h.apiList.mock.calls[0][2]).toEqual({ cluster: 'cluster-a' });
    expect(h.apiList.mock.calls[1][2]).toEqual({ cluster: 'cluster-b' });
  });

  it('reset() clears cached state and the next ensureChecked re-probes', () => {
    const h = makeHarness();
    h.check.ensureChecked('cluster-a');
    h.triggerError();
    expect(h.check.getStatus('cluster-a')).toBe('error');
    h.check.reset();
    expect(h.check.getStatus('cluster-a')).toBe('unknown');
    h.check.ensureChecked('cluster-a');
    expect(h.apiList).toHaveBeenCalledTimes(2);
  });

  it('handles CRD entries with missing jsonData/metadata/name gracefully', () => {
    const h = makeHarness();
    h.check.ensureChecked('cluster-a');
    // The previous optional-chaining in the predicate should keep us safe.
    expect(() =>
      h.triggerSuccess([{}, { jsonData: {} }, { jsonData: { metadata: {} } }])
    ).not.toThrow();
    expect(h.check.getStatus('cluster-a')).toBe('absent');
  });

  it('a successful probe that runs after a previous error updates the status to installed/absent', () => {
    const h = makeHarness();
    h.check.ensureChecked('cluster-a');
    h.triggerError();
    expect(h.check.getStatus('cluster-a')).toBe('error');

    // simulate retry within the TTL window -> no new probe is fired.
    // Now use reset() to force a fresh probe.
    h.check.reset();
    h.check.ensureChecked('cluster-a');
    h.triggerSuccess([{ jsonData: { metadata: { name: 'helmreleases.helm.toolkit.fluxcd.io' } } }]);
    expect(h.check.getStatus('cluster-a')).toBe('installed');
  });
});
