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

import { describe, expect, test, vi } from 'vitest';
import { PolicyRule } from './kyvernoPolicy';
import { collectPolicyImpact, describeMatchReasons, suggestFix } from './policyImpact';
import { ClusterPolicyReport, POLICY_REPORT_SOURCE, PolicyReport } from './policyReport';

// describeMatchReasons takes a translator rather than calling useTranslation() itself (see its
// own comment in policyImpact.ts), so these tests stand in a real one with i18next's own
// `{{var}}` interpolation syntax, substituting straight back to English, the same as the actual
// `en` locale catalogue does for every key.
function identityT(key: string, options?: Record<string, unknown>): string {
  if (!options) return key;
  return key.replace(/\{\{(\w+)\}\}/g, (_, name) => String(options[name] ?? ''));
}

// policyReport.ts extends KubeObject from @kinvolk/headlamp-plugin/lib/k8s/cluster,
// which only resolves at real build time through a rollup-only external/globals
// mapping in the shared vite config (build.rollupOptions.external / output.globals).
// Vite's own import-analysis tries to resolve that path before vitest's mock
// registry gets a chance to substitute it, since it is a deep, non-relative
// package path, not a file that genuinely exists where Vite looks. No test in
// this plugin has been able to construct a real resource class instance
// because of this, it isn't specific to this file. Mocking the local
// ./policyReport module instead sidesteps it: it is a real file on disk, so
// Vite resolves it fine, and this reimplements PolicyReportBase's actual
// getters exactly (see policyReport.ts), so collectPolicyImpact, which only
// ever touches .results / .scope / .jsonData at runtime, behaves identically
// to how it would against the real classes.
vi.mock('./policyReport', () => {
  class PolicyReportBase {
    jsonData: any;
    constructor(json: any) {
      this.jsonData = json;
    }
    get results() {
      return this.jsonData.results || [];
    }
    get scope() {
      return this.jsonData.scope;
    }
  }
  class PolicyReport extends PolicyReportBase {}
  class ClusterPolicyReport extends PolicyReportBase {}
  // Same reason as the classes above: vi.mock's factory can't call
  // importOriginal() to pull the real constant in, since that re-triggers the
  // same external-import resolution failure. Values copied verbatim from
  // policyReport.ts; keep the two in sync if Kyverno's own source values ever change.
  const POLICY_REPORT_SOURCE = {
    legacy: 'kyverno',
    validating: 'KyvernoValidatingPolicy',
    mutating: 'KyvernoMutatingPolicy',
    generating: 'KyvernoGeneratingPolicy',
    imageValidating: 'KyvernoImageValidatingPolicy',
  } as const;
  return { PolicyReport, ClusterPolicyReport, POLICY_REPORT_SOURCE };
});

// Real reports pulled from a live kind cluster running Kyverno v1.18.2, with a
// legacy ClusterPolicy (require-app-label) and a CEL ValidatingPolicy
// (require-team-label) both installed, trimmed of fields collectPolicyImpact
// does not read. On this Kyverno version, `resources[]` never populates in the
// aggregated PolicyReport, identity always lives on `scope`, confirmed for both
// background-scanned resources and a pod created seconds before checking, and
// confirmed identical for the legacy and CEL policy. See notes/02-policy-impact-map.md.

function report(
  namespace: string,
  scope: Record<string, unknown>,
  results: Record<string, unknown>[]
): PolicyReport {
  return new PolicyReport({
    apiVersion: 'wgpolicyk8s.io/v1alpha2',
    kind: 'PolicyReport',
    metadata: {
      name: String(scope.uid),
      namespace,
      uid: 'report-' + String(scope.uid),
      creationTimestamp: '2026-08-04T07:33:45Z',
      resourceVersion: '1',
    },
    scope,
    results,
  } as any);
}

const badPod = {
  apiVersion: 'v1',
  kind: 'Pod',
  name: 'bad-pod',
  namespace: 'team-checkout',
  uid: '0bb9bfaa-31ca-436f-9034-f6ae5853ebd5',
};

const goodTeamPod = {
  apiVersion: 'v1',
  kind: 'Pod',
  name: 'good-team-pod',
  namespace: 'team-checkout',
  uid: '929b2f17-493d-44d2-a2c6-b53c251baf93',
};

const corednsDeployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  name: 'coredns',
  namespace: 'kube-system',
  uid: '43aec13f-5c85-40b8-95ea-ac2cd3a8ecc9',
};

describe('collectPolicyImpact', () => {
  test('aggregates real fail and pass results for the legacy require-app-label policy', () => {
    const reports = [
      report('team-checkout', badPod, [
        {
          policy: 'require-app-label',
          rule: 'check-for-app-label',
          result: 'fail',
          message: "validation error: The label 'app' is required on all Pods.",
          source: POLICY_REPORT_SOURCE.legacy,
        },
      ]),
    ];

    const impact = collectPolicyImpact(
      'require-app-label',
      POLICY_REPORT_SOURCE.legacy,
      reports,
      []
    );

    expect(impact.counts.fail).toBe(1);
    expect(impact.resources).toEqual([
      expect.objectContaining({ kind: 'Pod', name: 'bad-pod', status: 'fail' }),
    ]);
  });

  test('aggregates real fail and pass results for the CEL require-team-label policy', () => {
    const reports = [
      report('team-checkout', badPod, [
        {
          policy: 'require-team-label',
          result: 'fail',
          message: "the 'team' label is required on all pods",
          source: POLICY_REPORT_SOURCE.validating,
        },
      ]),
      report('team-checkout', goodTeamPod, [
        {
          policy: 'require-team-label',
          result: 'pass',
          message: 'success',
          source: POLICY_REPORT_SOURCE.validating,
        },
      ]),
    ];

    const impact = collectPolicyImpact(
      'require-team-label',
      POLICY_REPORT_SOURCE.validating,
      reports,
      []
    );

    expect(impact.counts).toEqual({ pass: 1, fail: 1, warn: 0, error: 0, skip: 0 });
    expect(impact.namespaces).toEqual(new Set(['team-checkout']));
  });

  test('does not attribute one policy kind to another when a legacy ClusterPolicy and a CEL ValidatingPolicy share a name, found via Copilot review', () => {
    // Kubernetes puts no constraint on a kyverno.io/v1 ClusterPolicy and a
    // policies.kyverno.io ValidatingPolicy sharing a bare name; both are
    // independent objects of different kinds. Confirmed against
    // pkg/utils/report/results.go (ToPolicyReportResult) in kyverno/kyverno:
    // every result it builds carries a `source` stamped from the policy kind
    // that produced it ("kyverno" for legacy, "KyvernoValidatingPolicy" for
    // this CEL kind), so filtering on `source` as well as `policy` is enough
    // to tell these two apart even though their `policy` string is identical.
    const reports = [
      report('team-checkout', badPod, [
        {
          policy: 'require-label',
          rule: 'check-for-label',
          result: 'fail',
          message: 'legacy engine result',
          source: POLICY_REPORT_SOURCE.legacy,
        },
        {
          policy: 'require-label',
          result: 'pass',
          message: 'CEL engine result',
          source: POLICY_REPORT_SOURCE.validating,
        },
      ]),
    ];

    const legacyImpact = collectPolicyImpact(
      'require-label',
      POLICY_REPORT_SOURCE.legacy,
      reports,
      []
    );
    expect(legacyImpact.counts).toEqual({ pass: 0, fail: 1, warn: 0, error: 0, skip: 0 });
    expect(legacyImpact.resources[0].message).toBe('legacy engine result');

    const celImpact = collectPolicyImpact(
      'require-label',
      POLICY_REPORT_SOURCE.validating,
      reports,
      []
    );
    expect(celImpact.counts).toEqual({ pass: 1, fail: 0, warn: 0, error: 0, skip: 0 });
    expect(celImpact.resources[0].message).toBe('CEL engine result');
  });

  test('a namespaced Policy is invisible without policyNamespace, found via Copilot review on real cluster data', () => {
    // Real report from a namespaced Policy (kyverno.io/v1 Policy, not
    // ClusterPolicy) installed on the live cluster. Kyverno encodes its
    // identity in result.policy as "team-checkout/require-cost-center-label",
    // the same <namespace>/<name> convention bucketReportResults already
    // documents. Passing just policy.metadata.name, the obvious thing a
    // caller holding a Policy object would do, silently returns zero impact
    // even though this exact report has real failures.
    const reports = [
      report('team-checkout', badPod, [
        {
          policy: 'team-checkout/require-cost-center-label',
          rule: 'check-for-cost-center-label',
          result: 'fail',
          message:
            "validation error: the 'cost-center' label is required on all Pods in this namespace.",
          source: POLICY_REPORT_SOURCE.legacy,
        },
      ]),
    ];

    const withoutNamespace = collectPolicyImpact(
      'require-cost-center-label',
      POLICY_REPORT_SOURCE.legacy,
      reports,
      []
    );
    expect(withoutNamespace.resources).toEqual([]);

    const withNamespace = collectPolicyImpact(
      'require-cost-center-label',
      POLICY_REPORT_SOURCE.legacy,
      reports,
      [],
      'team-checkout'
    );
    expect(withNamespace.counts.fail).toBe(1);
    expect(withNamespace.resources[0]).toEqual(
      expect.objectContaining({ kind: 'Pod', name: 'bad-pod', status: 'fail' })
    );
  });

  test('groups by kind across both namespaced and cluster-scoped reports', () => {
    const policyReports = [
      report('team-checkout', badPod, [
        { policy: 'p', result: 'fail', source: POLICY_REPORT_SOURCE.legacy },
      ]),
    ];
    const clusterReports = [
      new ClusterPolicyReport({
        apiVersion: 'wgpolicyk8s.io/v1alpha2',
        kind: 'ClusterPolicyReport',
        metadata: {
          name: 'cluster-report',
          uid: 'cr-1',
          creationTimestamp: '2026-08-04T07:33:45Z',
          resourceVersion: '1',
        },
        scope: corednsDeployment,
        results: [{ policy: 'p', result: 'fail', source: POLICY_REPORT_SOURCE.legacy }],
      } as any),
    ];

    const impact = collectPolicyImpact(
      'p',
      POLICY_REPORT_SOURCE.legacy,
      policyReports,
      clusterReports
    );

    expect(Array.from(impact.byKind.keys()).sort()).toEqual(['Deployment', 'Pod']);
    expect(impact.byKind.get('Deployment')).toHaveLength(1);
    expect(impact.byKind.get('Pod')).toHaveLength(1);
  });

  test('returns an empty summary for a policy with zero results, not an error', () => {
    const reports = [
      report('team-checkout', badPod, [{ policy: 'require-app-label', result: 'fail' }]),
    ];

    const impact = collectPolicyImpact(
      'a-policy-nothing-matches',
      POLICY_REPORT_SOURCE.legacy,
      reports,
      []
    );

    expect(impact.resources).toEqual([]);
    expect(impact.byKind.size).toBe(0);
    expect(impact.namespaces.size).toBe(0);
    expect(impact.counts).toEqual({ pass: 0, fail: 0, warn: 0, error: 0, skip: 0 });
  });

  test('handles null report lists the same as empty ones, useList() returns null while loading', () => {
    const impact = collectPolicyImpact('any-policy', POLICY_REPORT_SOURCE.legacy, null, null);

    expect(impact.resources).toEqual([]);
  });

  test('keeps the worst status when a resource appears more than once for the same policy', () => {
    // Not reproduced live: on the current Kyverno version a resource gets exactly
    // one report entry per policy (see notes/02-policy-impact-map.md), so this
    // exercises collectPolicyImpact's documented dedup contract defensively,
    // in case a version or mode produces more than one result per resource.
    const reports = [
      report('team-checkout', badPod, [
        { policy: 'p', rule: 'r1', result: 'pass', source: POLICY_REPORT_SOURCE.legacy },
        { policy: 'p', rule: 'r2', result: 'fail', source: POLICY_REPORT_SOURCE.legacy },
      ]),
    ];

    const impact = collectPolicyImpact('p', POLICY_REPORT_SOURCE.legacy, reports, []);

    expect(impact.resources).toHaveLength(1);
    expect(impact.resources[0].status).toBe('fail');
  });

  test('falls back to resources[] when a report populates it instead of scope', () => {
    // Not reproduced live either, see the module comment above. resources[] is
    // in the PolicyReportResult type and collectPolicyImpact explicitly checks
    // it first, so it needs coverage even without a live example to point at.
    const withResourcesArray = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'admission-style',
        namespace: 'team-checkout',
        uid: 'r-2',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      results: [
        {
          policy: 'p',
          result: 'fail',
          source: POLICY_REPORT_SOURCE.legacy,
          resources: [{ kind: 'Pod', name: 'from-resources-array', namespace: 'team-checkout' }],
        },
      ],
    } as any);

    const impact = collectPolicyImpact('p', POLICY_REPORT_SOURCE.legacy, [withResourcesArray], []);

    expect(impact.resources[0].name).toBe('from-resources-array');
  });

  test('keeps every resource when a single result references more than one, found via Copilot review', () => {
    // resources[] is typed as an array. The original code only ever read
    // resources[0], silently dropping every later resource a result
    // referenced.
    const multiResourceReport = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'multi-resource',
        namespace: 'team-checkout',
        uid: 'r-3',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      results: [
        {
          policy: 'p',
          result: 'fail',
          source: POLICY_REPORT_SOURCE.legacy,
          resources: [
            { kind: 'Pod', name: 'first', namespace: 'team-checkout', uid: 'uid-first' },
            { kind: 'Pod', name: 'second', namespace: 'team-checkout', uid: 'uid-second' },
          ],
        },
      ],
    } as any);

    const impact = collectPolicyImpact('p', POLICY_REPORT_SOURCE.legacy, [multiResourceReport], []);

    expect(impact.resources.map(r => r.name).sort()).toEqual(['first', 'second']);
  });

  test('prefers the UID over the name-based key so same-named resources from different API groups do not collapse, found via Copilot review', () => {
    // Also covers the "conflicting known UIDs" case from the UID-reconciliation fix below:
    // both entries here carry their own distinct, non-empty UID, so they must stay separate,
    // reconciliation only merges a UID-less reference into an already-known UID, never two
    // references that both already know a (different) UID.
    const crossGroupReport = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'cross-group',
        namespace: 'team-checkout',
        uid: 'r-4',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      results: [
        {
          policy: 'p',
          result: 'fail',
          source: POLICY_REPORT_SOURCE.legacy,
          resources: [
            { kind: 'Widget', name: 'shared-name', namespace: 'team-checkout', uid: 'widget-a' },
          ],
        },
        {
          policy: 'p',
          result: 'pass',
          source: POLICY_REPORT_SOURCE.legacy,
          resources: [
            { kind: 'Widget', name: 'shared-name', namespace: 'team-checkout', uid: 'widget-b' },
          ],
        },
      ],
    } as any);

    const impact = collectPolicyImpact('p', POLICY_REPORT_SOURCE.legacy, [crossGroupReport], []);

    expect(impact.resources).toHaveLength(2);
    expect(impact.resources.map(r => r.uid).sort()).toEqual(['widget-a', 'widget-b']);
  });

  test('reconciles a UID-less reference into an already-known UID-backed one, found via Copilot review', () => {
    // Same resource (apiVersion/kind/namespace/name agree), seen once with a
    // UID and once without, UID-backed first. The UID-less reference used to
    // get its own name-key entry instead of merging, double-counting the
    // resource and losing the worse of the two statuses.
    const uidFirstReport = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'uid-first',
        namespace: 'team-checkout',
        uid: 'r-uid-first',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      results: [
        {
          policy: 'p',
          result: 'pass',
          source: POLICY_REPORT_SOURCE.legacy,
          resources: [
            { kind: 'Pod', name: 'reconciled', namespace: 'team-checkout', uid: 'uid-1' },
          ],
        },
        {
          policy: 'p',
          result: 'fail',
          source: POLICY_REPORT_SOURCE.legacy,
          resources: [{ kind: 'Pod', name: 'reconciled', namespace: 'team-checkout' }],
        },
      ],
    } as any);

    const impact = collectPolicyImpact('p', POLICY_REPORT_SOURCE.legacy, [uidFirstReport], []);

    expect(impact.resources).toHaveLength(1);
    expect(impact.resources[0]).toMatchObject({ name: 'reconciled', uid: 'uid-1', status: 'fail' });
  });

  test('reconciles a UID-backed reference into an already-known UID-less one, found via Copilot review', () => {
    // Same scenario as above with the input order reversed: UID-less first,
    // UID-backed second. Reconciliation has to work in both input orders,
    // real report data has no guaranteed arrival order.
    const uidLastReport = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'uid-last',
        namespace: 'team-checkout',
        uid: 'r-uid-last',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      results: [
        {
          policy: 'p',
          result: 'pass',
          source: POLICY_REPORT_SOURCE.legacy,
          resources: [{ kind: 'Pod', name: 'reconciled', namespace: 'team-checkout' }],
        },
        {
          policy: 'p',
          result: 'fail',
          source: POLICY_REPORT_SOURCE.legacy,
          resources: [
            { kind: 'Pod', name: 'reconciled', namespace: 'team-checkout', uid: 'uid-1' },
          ],
        },
      ],
    } as any);

    const impact = collectPolicyImpact('p', POLICY_REPORT_SOURCE.legacy, [uidLastReport], []);

    expect(impact.resources).toHaveLength(1);
    expect(impact.resources[0]).toMatchObject({ name: 'reconciled', uid: 'uid-1', status: 'fail' });
  });

  test('preserves the worst status across three references that differ in apiVersion and UID presence, in either input order, found via Copilot review', () => {
    // An HPA reported three ways: autoscaling/v1 with a UID and `fail`, then autoscaling/v2
    // without a UID and `pass`, then autoscaling/v2 with the same UID and `pass`. The third
    // reference's apiVersion differs from the first, so it reaches the orphan-merge path with
    // a UID-keyed slot that already holds the first reference's `fail` entry. Moving the orphan
    // into that slot unconditionally used to overwrite the `fail` with `pass`, losing it; the
    // merge has to keep whichever of the two actually ranks worse, in either input order, since
    // real report data has no guaranteed arrival order.
    const references = [
      {
        policy: 'p',
        result: 'fail',
        source: POLICY_REPORT_SOURCE.legacy,
        resources: [
          {
            apiVersion: 'autoscaling/v1',
            kind: 'HorizontalPodAutoscaler',
            name: 'hpa',
            namespace: 'team-checkout',
            uid: 'hpa-uid',
          },
        ],
      },
      {
        policy: 'p',
        result: 'pass',
        source: POLICY_REPORT_SOURCE.legacy,
        resources: [
          {
            apiVersion: 'autoscaling/v2',
            kind: 'HorizontalPodAutoscaler',
            name: 'hpa',
            namespace: 'team-checkout',
          },
        ],
      },
      {
        policy: 'p',
        result: 'pass',
        source: POLICY_REPORT_SOURCE.legacy,
        resources: [
          {
            apiVersion: 'autoscaling/v2',
            kind: 'HorizontalPodAutoscaler',
            name: 'hpa',
            namespace: 'team-checkout',
            uid: 'hpa-uid',
          },
        ],
      },
    ];

    const forwardReport = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'hpa-forward',
        namespace: 'team-checkout',
        uid: 'r-hpa-forward',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      results: references,
    } as any);

    const forwardImpact = collectPolicyImpact(
      'p',
      POLICY_REPORT_SOURCE.legacy,
      [forwardReport],
      []
    );
    expect(forwardImpact.resources).toHaveLength(1);
    expect(forwardImpact.resources[0]).toMatchObject({
      name: 'hpa',
      uid: 'hpa-uid',
      status: 'fail',
    });

    const reversedReport = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'hpa-reversed',
        namespace: 'team-checkout',
        uid: 'r-hpa-reversed',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      results: [...references].reverse(),
    } as any);

    const reversedImpact = collectPolicyImpact(
      'p',
      POLICY_REPORT_SOURCE.legacy,
      [reversedReport],
      []
    );
    expect(reversedImpact.resources).toHaveLength(1);
    expect(reversedImpact.resources[0]).toMatchObject({
      name: 'hpa',
      uid: 'hpa-uid',
      status: 'fail',
    });
  });

  test('reconciles two UID-less references to the same resource across API versions, in either input order, found via Copilot review', () => {
    // No UID anywhere this time, unlike the three-reference test above: an HPA reported as
    // autoscaling/v1 (failing) and again as autoscaling/v2 (passing), the same live object
    // under two different served versions of the same group. Folding the full apiVersion into
    // the fallback key used to treat these as two unrelated resources, producing two rows and
    // conflicting counts instead of reconciling them into one with the worse status.
    const versionReferences = [
      {
        policy: 'p',
        result: 'fail',
        source: POLICY_REPORT_SOURCE.legacy,
        resources: [
          {
            apiVersion: 'autoscaling/v1',
            kind: 'HorizontalPodAutoscaler',
            name: 'hpa',
            namespace: 'team-checkout',
          },
        ],
      },
      {
        policy: 'p',
        result: 'pass',
        source: POLICY_REPORT_SOURCE.legacy,
        resources: [
          {
            apiVersion: 'autoscaling/v2',
            kind: 'HorizontalPodAutoscaler',
            name: 'hpa',
            namespace: 'team-checkout',
          },
        ],
      },
    ];

    const forwardReport = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'hpa-version-forward',
        namespace: 'team-checkout',
        uid: 'r-hpa-version-forward',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      results: versionReferences,
    } as any);

    const forwardImpact = collectPolicyImpact(
      'p',
      POLICY_REPORT_SOURCE.legacy,
      [forwardReport],
      []
    );
    expect(forwardImpact.resources).toHaveLength(1);
    expect(forwardImpact.resources[0]).toMatchObject({ name: 'hpa', status: 'fail' });

    const reversedReport = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'hpa-version-reversed',
        namespace: 'team-checkout',
        uid: 'r-hpa-version-reversed',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      results: [...versionReferences].reverse(),
    } as any);

    const reversedImpact = collectPolicyImpact(
      'p',
      POLICY_REPORT_SOURCE.legacy,
      [reversedReport],
      []
    );
    expect(reversedImpact.resources).toHaveLength(1);
    expect(reversedImpact.resources[0]).toMatchObject({ name: 'hpa', status: 'fail' });
  });

  test('does not borrow the report scope UID for resources[] entries that omit their own, found via Copilot review', () => {
    // Two distinct resources[] entries, neither with its own uid. Both used
    // to fall back to reportScope.uid, colliding into one entry and losing
    // one of them, even though the multi-resource loop should keep both.
    const scopedReport = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'scoped',
        namespace: 'team-checkout',
        uid: 'r-5',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      scope: { kind: 'Pod', name: 'scope-subject', namespace: 'team-checkout', uid: 'scope-uid' },
      results: [
        {
          policy: 'p',
          result: 'fail',
          source: POLICY_REPORT_SOURCE.legacy,
          resources: [
            { kind: 'Pod', name: 'no-own-uid-1', namespace: 'team-checkout' },
            { kind: 'Pod', name: 'no-own-uid-2', namespace: 'team-checkout' },
          ],
        },
      ],
    } as any);

    const impact = collectPolicyImpact('p', POLICY_REPORT_SOURCE.legacy, [scopedReport], []);

    expect(impact.resources.map(r => r.name).sort()).toEqual(['no-own-uid-1', 'no-own-uid-2']);
  });

  test('folds apiVersion into the fallback key so same kind/name resources from different API groups do not collapse, found via Copilot review', () => {
    const differentApiGroupsReport = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'different-groups',
        namespace: 'team-checkout',
        uid: 'r-6',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      results: [
        {
          policy: 'p',
          result: 'fail',
          source: POLICY_REPORT_SOURCE.legacy,
          resources: [
            {
              apiVersion: 'group-a/v1',
              kind: 'Widget',
              name: 'shared-name',
              namespace: 'team-checkout',
            },
          ],
        },
        {
          policy: 'p',
          result: 'pass',
          source: POLICY_REPORT_SOURCE.legacy,
          resources: [
            {
              apiVersion: 'group-b/v1',
              kind: 'Widget',
              name: 'shared-name',
              namespace: 'team-checkout',
            },
          ],
        },
      ],
    } as any);

    const impact = collectPolicyImpact(
      'p',
      POLICY_REPORT_SOURCE.legacy,
      [differentApiGroupsReport],
      []
    );

    expect(impact.resources).toHaveLength(2);
    expect(impact.resources.map(r => r.apiVersion).sort()).toEqual(['group-a/v1', 'group-b/v1']);
  });

  test('produces no entry at all when a result has neither resources[] nor a report scope, found via Copilot review', () => {
    // Previously this iterated once anyway and fabricated an
    // "Unknown/(unscoped)" resource, collapsing every identity-less result
    // from any policy into one fake entry instead of reporting nothing.
    const noIdentityReport = new PolicyReport({
      apiVersion: 'wgpolicyk8s.io/v1alpha2',
      kind: 'PolicyReport',
      metadata: {
        name: 'no-identity',
        namespace: 'team-checkout',
        uid: 'r-7',
        creationTimestamp: '2026-08-04T07:33:45Z',
        resourceVersion: '1',
      },
      results: [{ policy: 'p', result: 'fail', source: POLICY_REPORT_SOURCE.legacy }],
    } as any);

    const impact = collectPolicyImpact('p', POLICY_REPORT_SOURCE.legacy, [noIdentityReport], []);

    expect(impact.resources).toEqual([]);
  });
});

describe('describeMatchReasons', () => {
  const rules: PolicyRule[] = [
    {
      name: 'check-pods',
      match: {
        any: [{ resources: { kinds: ['Pod'], namespaces: ['team-checkout'] } }],
      },
    },
  ];

  test('explains a direct kind match with its namespace scope', () => {
    const reasons = describeMatchReasons(rules, 'Pod', identityT);

    expect(reasons).toEqual([
      'Rule "check-pods" matches kind "Pod" and namespaces [team-checkout].',
    ]);
  });

  test('admits when no rule explicitly matches the kind, autogen or background scan territory', () => {
    const reasons = describeMatchReasons(rules, 'Deployment', identityT);

    expect(reasons[0]).toContain('No rule in this policy explicitly lists kind "Deployment"');
  });

  test('recognizes a wildcard kind as an explicit match, found via Copilot review', () => {
    const wildcardRules: PolicyRule[] = [
      { name: 'check-everything', match: { any: [{ resources: { kinds: ['*'] } }] } },
    ];

    const reasons = describeMatchReasons(wildcardRules, 'Deployment', identityT);

    expect(reasons[0]).toContain('Rule "check-everything" matches kind "Deployment"');
  });

  test('mentions a namespace label selector, not just a resource label selector, found via Copilot review', () => {
    const namespaceSelectorRules: PolicyRule[] = [
      {
        name: 'check-team-namespaces',
        match: {
          any: [{ resources: { kinds: ['Pod'], namespaceSelector: { team: 'checkout' } } }],
        },
      },
    ];

    const reasons = describeMatchReasons(namespaceSelectorRules, 'Pod', identityT);

    expect(reasons[0]).toContain('a namespace label selector');
  });

  test('gives an honest unknown-provenance message for an empty rules array instead of implying autogen or a background scan, found via Copilot review', () => {
    // An empty rules array is also how a policy type this function was not
    // written for (a CEL ValidatingPolicy has no rules[] at all) can reach
    // here, that is not the same as "rules exist but none matched".
    const reasons = describeMatchReasons([], 'Pod', identityT);

    expect(reasons[0]).toContain('provenance for kind "Pod" is unknown');
    expect(reasons[0]).not.toContain('background scan');
  });

  test('requires every entry in match.all to cover the kind, not just any one of them, found via Copilot review', () => {
    // An all[] block requiring both Pod and Deployment kinds can never be
    // satisfied by any single resource. Concatenating any and all into one
    // OR'd list used to report this as a match for Pod anyway.
    const impossibleAllRules: PolicyRule[] = [
      {
        name: 'impossible',
        match: {
          all: [{ resources: { kinds: ['Pod'] } }, { resources: { kinds: ['Deployment'] } }],
        },
      },
    ];

    expect(describeMatchReasons(impossibleAllRules, 'Pod', identityT)).toEqual([
      expect.stringContaining('No rule in this policy explicitly lists kind "Pod"'),
    ]);
  });

  test('reports a match when every entry in match.all genuinely covers the kind', () => {
    const satisfiableAllRules: PolicyRule[] = [
      {
        name: 'namespaced-pods',
        match: {
          all: [
            { resources: { kinds: ['Pod'], namespaces: ['team-checkout'] } },
            { resources: { kinds: ['Pod'], selector: { matchLabels: { team: 'checkout' } } } },
          ],
        },
      },
    ];

    const reasons = describeMatchReasons(satisfiableAllRules, 'Pod', identityT);

    expect(reasons[0]).toContain('Rule "namespaced-pods" matches kind "Pod"');
    expect(reasons[0]).toContain('namespaces [team-checkout]');
    expect(reasons[0]).toContain('a label selector');
  });

  test("describes each match.all selector's namespaces separately instead of their flattened union, found via Copilot review", () => {
    // match.all requires every selector to hold at once, so a selector allowing [dev, prod]
    // alongside one allowing [prod] only ever admits prod, the intersection, not "dev, prod,
    // prod". Flattening every selector's namespaces into one list used to describe the union
    // instead, misstating the actual constraint.
    const intersectingNamespaceRules: PolicyRule[] = [
      {
        name: 'namespaced-pods',
        match: {
          all: [
            { resources: { kinds: ['Pod'], namespaces: ['dev', 'prod'] } },
            { resources: { kinds: ['Pod'], namespaces: ['prod'] } },
          ],
        },
      },
    ];

    const reasons = describeMatchReasons(intersectingNamespaceRules, 'Pod', identityT);

    expect(reasons[0]).toContain('namespaces [dev, prod]');
    expect(reasons[0]).toContain('namespaces [prod]');
  });

  test('includes resource-name constraints in the explanation, found via Copilot review', () => {
    // Omitting a selector's names [] understated the policy's actual scope: a selector
    // restricted to kinds ['Pod'], namespaces ['prod'], names ['database-*'] used to be
    // described as covering every Pod in prod, not just the ones matching that name pattern.
    const namedResourceRules: PolicyRule[] = [
      {
        name: 'database-pods',
        match: {
          any: [{ resources: { kinds: ['Pod'], namespaces: ['prod'], names: ['database-*'] } }],
        },
      },
    ];

    const reasons = describeMatchReasons(namedResourceRules, 'Pod', identityT);

    expect(reasons[0]).toContain('namespaces [prod]');
    expect(reasons[0]).toContain('names [database-*]');
  });

  test('includes the singular resources.name selector in the explanation, found via Copilot review', () => {
    // Kyverno supports this singular exact-name form (one name) alongside the plural `names`
    // (a pattern list) on the same ResourceDescription. Reading only `names` described a rule with
    // kinds: ['Pod'], name: 'database-primary' as matching every Pod, omitting its name
    // restriction entirely.
    const singularNameRules: PolicyRule[] = [
      {
        name: 'database-primary-pod',
        match: {
          any: [{ resources: { kinds: ['Pod'], name: 'database-primary' } }],
        },
      },
    ];

    const reasons = describeMatchReasons(singularNameRules, 'Pod', identityT);

    expect(reasons[0]).toContain('names [database-primary]');
  });

  test('combines the singular resources.name with the plural names when both are set, found via Copilot review', () => {
    const bothNameFormsRules: PolicyRule[] = [
      {
        name: 'mixed-name-selector',
        match: {
          any: [{ resources: { kinds: ['Pod'], name: 'database-primary', names: ['database-*'] } }],
        },
      },
    ];

    const reasons = describeMatchReasons(bothNameFormsRules, 'Pod', identityT);

    expect(reasons[0]).toContain('names [database-primary, database-*]');
  });

  test('includes resource annotation constraints in the explanation, found via Copilot review', () => {
    // resources.annotations is a real match restriction on Kyverno's ResourceDescription, distinct
    // from `selector` (a label selector). Omitting it described a selector restricted to
    // kinds: ['Pod'], annotations: { team: 'platform' } as matching every Pod.
    const annotatedResourceRules: PolicyRule[] = [
      {
        name: 'platform-team-pods',
        match: {
          any: [{ resources: { kinds: ['Pod'], annotations: { team: 'platform' } } }],
        },
      },
    ];

    const reasons = describeMatchReasons(annotatedResourceRules, 'Pod', identityT);

    expect(reasons[0]).toContain('annotations [team=platform]');
  });

  test('recognizes the deprecated direct match.resources form, not just any/all, found via Copilot review', () => {
    // Confirmed against api/kyverno/v1/match_resources_types.go: MatchResources
    // embeds ResourceDescription directly as `resources`, deprecated in favor
    // of any/all but still real and still supported. A policy written this
    // way used to fall through to the "No rule explicitly lists kind" message
    // even when it plainly matched.
    const directMatchRules: PolicyRule[] = [
      {
        name: 'legacy-style-pods',
        match: { resources: { kinds: ['Pod'], namespaces: ['team-checkout'] } },
      },
    ];

    const reasons = describeMatchReasons(directMatchRules, 'Pod', identityT);

    expect(reasons[0]).toContain('Rule "legacy-style-pods" matches kind "Pod"');
    expect(reasons[0]).toContain('namespaces [team-checkout]');
  });

  test('notes when a rule also has an exclude block that plausibly covers the same kind, found via Copilot review', () => {
    const excludedRules: PolicyRule[] = [
      {
        name: 'require-labels',
        match: { any: [{ resources: { kinds: ['Pod'] } }] },
        exclude: { any: [{ resources: { kinds: ['Pod'], namespaces: ['kube-system'] } }] },
      },
    ];

    const reasons = describeMatchReasons(excludedRules, 'Pod', identityT);

    expect(reasons).toHaveLength(2);
    expect(reasons[1]).toContain('exclude block covering kind "Pod"');
  });

  test('recognizes the deprecated direct exclude.resources form, not just any/all, found via Copilot review', () => {
    const directExcludeRules: PolicyRule[] = [
      {
        name: 'require-labels-direct-exclude',
        match: { any: [{ resources: { kinds: ['Pod'] } }] },
        exclude: { resources: { kinds: ['Pod'], namespaces: ['kube-system'] } },
      },
    ];

    const reasons = describeMatchReasons(directExcludeRules, 'Pod', identityT);

    expect(reasons).toHaveLength(2);
    expect(reasons[1]).toContain('exclude block covering kind "Pod"');
  });

  test('recognizes a group+version-qualified kind pattern as a match, found via Copilot review', () => {
    // Confirmed against kubectl explain: report results only ever carry the
    // bare kind, but a policy's match kinds can be fully qualified.
    const qualifiedRules: PolicyRule[] = [
      {
        name: 'check-deployments',
        match: { any: [{ resources: { kinds: ['apps/v1/Deployment'] } }] },
      },
    ];

    const reasons = describeMatchReasons(qualifiedRules, 'Deployment', identityT);

    expect(reasons[0]).toContain('Rule "check-deployments" matches kind "Deployment"');
  });

  test('does not mistake a group name starting with alpha/beta for a version segment, found via Copilot review', () => {
    // Kyverno's own versionRegex (pkg/utils/kube/kind.go) requires at least one digit after
    // "alpha"/"beta", so a 3-segment pattern whose first segment is the API group "v1alpha" (no
    // trailing digit, not a real version) is "group/version/kind", not "version/kind/subresource".
    // Allowing zero digits used to misread "v1alpha" as a version and return segments[1] ("v1")
    // as the kind instead of the real kind in segments[2] ("Widget").
    const groupQualifiedRules: PolicyRule[] = [
      { name: 'check-widgets', match: { any: [{ resources: { kinds: ['v1alpha/v1/Widget'] } }] } },
    ];

    const reasons = describeMatchReasons(groupQualifiedRules, 'Widget', identityT);

    expect(reasons[0]).toContain('Rule "check-widgets" matches kind "Widget"');
  });

  test('recognizes a version-qualified kind pattern as a match, found via Copilot review', () => {
    const versionQualifiedRules: PolicyRule[] = [
      { name: 'check-pods', match: { any: [{ resources: { kinds: ['v1/Pod'] } }] } },
    ];

    const reasons = describeMatchReasons(versionQualifiedRules, 'Pod', identityT);

    expect(reasons[0]).toContain('Rule "check-pods" matches kind "Pod"');
  });

  test('recognizes a subresource-qualified kind pattern as a match, found via Copilot review', () => {
    const subresourceRules: PolicyRule[] = [
      { name: 'check-pod-status', match: { any: [{ resources: { kinds: ['Pod/status'] } }] } },
    ];

    const reasons = describeMatchReasons(subresourceRules, 'Pod', identityT);

    expect(reasons[0]).toContain('Rule "check-pod-status" matches kind "Pod"');
  });

  test('does not let a qualified pattern for a different kind falsely match, found via Copilot review', () => {
    const qualifiedRules: PolicyRule[] = [
      {
        name: 'check-deployments',
        match: { any: [{ resources: { kinds: ['apps/v1/Deployment'] } }] },
      },
    ];

    const reasons = describeMatchReasons(qualifiedRules, 'Pod', identityT);

    expect(reasons[0]).toContain('No rule in this policy explicitly lists kind "Pod"');
  });

  test('treats an omitted kinds list as matching any kind, not none, found via Copilot review', () => {
    // Confirmed against pkg/utils/match/match.go checkResourceDescription: the kind check only
    // runs when len(conditionBlock.Kinds) > 0, so a selector that only constrains namespaces
    // (no kinds at all) applies to every kind, it never narrows by kind in the first place.
    const noKindsRules: PolicyRule[] = [
      {
        name: 'require-team-label-namespace',
        match: { any: [{ resources: { namespaces: ['team-checkout'] } }] },
      },
    ];

    const reasons = describeMatchReasons(noKindsRules, 'Pod', identityT);

    expect(reasons[0]).toContain('Rule "require-team-label-namespace" matches kind "Pod"');
    expect(reasons[0]).toContain('namespaces [team-checkout]');
  });

  test('recognizes a wildcard version segment ("*/Pod") as a match, found via Copilot review', () => {
    // Confirmed against Kyverno's own versionRegex (pkg/utils/kube/kind.go): it matches a
    // literal "*" explicitly, so "*/Pod" parses as (version: *, kind: Pod), not a bare pattern
    // whose first segment happens to be the literal string "*".
    const wildcardVersionRules: PolicyRule[] = [
      { name: 'check-pods', match: { any: [{ resources: { kinds: ['*/Pod'] } }] } },
    ];

    const reasons = describeMatchReasons(wildcardVersionRules, 'Pod', identityT);

    expect(reasons[0]).toContain('Rule "check-pods" matches kind "Pod"');
  });

  test('recognizes a dot-qualified subresource kind pattern ("Pod.status") as a match, found via Copilot review', () => {
    // Confirmed against Kyverno's own ParseKindSelector (pkg/utils/kube/kind.go): it splits the
    // last "/"-segment on "." too, so a dot-qualified subresource means the same thing as a
    // slash-qualified one, "Pod.status" and "Pod/status" both parse to kind "Pod".
    const dotSubresourceRules: PolicyRule[] = [
      { name: 'check-pod-status', match: { any: [{ resources: { kinds: ['Pod.status'] } }] } },
    ];

    const reasons = describeMatchReasons(dotSubresourceRules, 'Pod', identityT);

    expect(reasons[0]).toContain('Rule "check-pod-status" matches kind "Pod"');
  });

  test('recognizes a version-qualified dot-subresource pattern ("v1/Pod.status") as a match, found via Copilot review', () => {
    const versionDotSubresourceRules: PolicyRule[] = [
      { name: 'check-pod-status', match: { any: [{ resources: { kinds: ['v1/Pod.status'] } }] } },
    ];

    const reasons = describeMatchReasons(versionDotSubresourceRules, 'Pod', identityT);

    expect(reasons[0]).toContain('Rule "check-pod-status" matches kind "Pod"');
  });

  test('recognizes a group+version-qualified dot-subresource pattern ("apps/v1/Deployment.scale") as a match, found via Copilot review', () => {
    const groupVersionDotSubresourceRules: PolicyRule[] = [
      {
        name: 'check-deployment-scale',
        match: { any: [{ resources: { kinds: ['apps/v1/Deployment.scale'] } }] },
      },
    ];

    const reasons = describeMatchReasons(groupVersionDotSubresourceRules, 'Deployment', identityT);

    expect(reasons[0]).toContain('Rule "check-deployment-scale" matches kind "Deployment"');
  });

  test('treats a wildcard-kind subresource pattern ("*/status") as matching any kind, found via Copilot review', () => {
    // Confirmed against ParseKindSelector: when the first segment is "*" and the second is
    // already all lowercase, the second segment is a subresource name, not a kind, so this
    // parses as (kind: *, subresource: status), not (version: *, kind: status).
    const wildcardSubresourceRules: PolicyRule[] = [
      { name: 'check-any-status', match: { any: [{ resources: { kinds: ['*/status'] } }] } },
    ];

    expect(describeMatchReasons(wildcardSubresourceRules, 'Pod', identityT)[0]).toContain(
      'Rule "check-any-status" matches kind "Pod"'
    );
    expect(describeMatchReasons(wildcardSubresourceRules, 'Deployment', identityT)[0]).toContain(
      'Rule "check-any-status" matches kind "Deployment"'
    );
  });

  test('recognizes a wildcard kind pattern ("Pod*") as a match, found via Copilot review', () => {
    // Confirmed against pkg/utils/match/kind.go CheckKind: it runs the parsed kind segment
    // through ext/wildcard's genuine glob matching, not a literal "*"-only check.
    const wildcardKindRules: PolicyRule[] = [
      { name: 'check-pod-like', match: { any: [{ resources: { kinds: ['Pod*'] } }] } },
    ];

    expect(describeMatchReasons(wildcardKindRules, 'PodTemplate', identityT)[0]).toContain(
      'Rule "check-pod-like" matches kind "PodTemplate"'
    );
    expect(describeMatchReasons(wildcardKindRules, 'Pod', identityT)[0]).toContain(
      'Rule "check-pod-like" matches kind "Pod"'
    );
  });

  test('does not let a wildcard kind pattern falsely match an unrelated kind, found via Copilot review', () => {
    const wildcardKindRules: PolicyRule[] = [
      { name: 'check-pod-like', match: { any: [{ resources: { kinds: ['Pod*'] } }] } },
    ];

    const reasons = describeMatchReasons(wildcardKindRules, 'Deployment', identityT);

    expect(reasons[0]).toContain('No rule in this policy explicitly lists kind "Deployment"');
  });

  test('recognizes a "?" single-character wildcard in a match selector kind pattern, found via Copilot review', () => {
    // Confirmed against ext/wildcard's real Match implementation: "?" matches exactly one
    // character, same operator class as "*", not a literal question mark.
    const questionMarkRules: PolicyRule[] = [
      { name: 'check-pod-like', match: { any: [{ resources: { kinds: ['Po?'] } }] } },
    ];

    expect(describeMatchReasons(questionMarkRules, 'Pod', identityT)[0]).toContain(
      'Rule "check-pod-like" matches kind "Pod"'
    );
    expect(describeMatchReasons(questionMarkRules, 'Pot', identityT)[0]).toContain(
      'Rule "check-pod-like" matches kind "Pot"'
    );
  });

  test('does not let a "?" wildcard match a kind of the wrong length, found via Copilot review', () => {
    const questionMarkRules: PolicyRule[] = [
      { name: 'check-pod-like', match: { any: [{ resources: { kinds: ['Po?'] } }] } },
    ];

    expect(describeMatchReasons(questionMarkRules, 'PodTemplate', identityT)[0]).toContain(
      'No rule in this policy explicitly lists kind "PodTemplate"'
    );
    expect(describeMatchReasons(questionMarkRules, 'Po', identityT)[0]).toContain(
      'No rule in this policy explicitly lists kind "Po"'
    );
  });

  test('recognizes a "?" wildcard in an exclude selector kind pattern, found via Copilot review', () => {
    const questionMarkExcludeRules: PolicyRule[] = [
      {
        name: 'require-labels',
        match: { any: [{ resources: { kinds: ['Pod'] } }] },
        exclude: { any: [{ resources: { kinds: ['Po?'] } }] },
      },
    ];

    const reasons = describeMatchReasons(questionMarkExcludeRules, 'Pod', identityT);

    expect(reasons[1]).toContain('also has an exclude block covering kind "Pod"');
  });

  test('does not freeze on a pathological run of wildcards against a non-matching kind, found via Copilot review', () => {
    // Converting every "*" to ".*" and handing the result to a regex engine lets a pattern like
    // this one trigger combinatorial backtracking on a non-match: the engine tries every way of
    // partitioning the input across the repeated ".*" groups before giving up. A linear matcher
    // settles this in well under a second regardless of how many "*" characters the pattern has.
    const pathologicalRules: PolicyRule[] = [
      {
        name: 'check-pod-like',
        match: { any: [{ resources: { kinds: [`${'*'.repeat(5000)}Pod`] } }] },
      },
    ];

    const start = Date.now();
    const reasons = describeMatchReasons(pathologicalRules, 'HorizontalPodAutoscaler', identityT);
    const elapsedMs = Date.now() - start;

    expect(elapsedMs).toBeLessThan(1000);
    expect(reasons[0]).toContain(
      'No rule in this policy explicitly lists kind "HorizontalPodAutoscaler"'
    );
  });

  test('requires every entry in exclude.all to cover the kind, not just any one of them, found via Copilot review', () => {
    // Mirrors the match.all test above: an all[] block requiring both Pod and Deployment kinds
    // can never be satisfied by any single resource, so it can never actually exclude anything.
    // Flattening exclude.all into the same OR'd list as exclude.any used to report an exclusion
    // for Pod anyway.
    const impossibleExcludeAllRules: PolicyRule[] = [
      {
        name: 'require-labels',
        match: { any: [{ resources: { kinds: ['Pod'] } }] },
        exclude: {
          all: [{ resources: { kinds: ['Pod'] } }, { resources: { kinds: ['Deployment'] } }],
        },
      },
    ];

    const reasons = describeMatchReasons(impossibleExcludeAllRules, 'Pod', identityT);

    expect(reasons).toHaveLength(1);
    expect(reasons[0]).not.toContain('exclude block');
  });

  test('reports an exclusion when every entry in exclude.all genuinely covers the kind, found via Copilot review', () => {
    const satisfiableExcludeAllRules: PolicyRule[] = [
      {
        name: 'require-labels',
        match: { any: [{ resources: { kinds: ['Pod'] } }] },
        exclude: {
          all: [
            { resources: { kinds: ['Pod'], namespaces: ['kube-system'] } },
            { resources: { kinds: ['Pod'], selector: { matchLabels: { tier: 'system' } } } },
          ],
        },
      },
    ];

    const reasons = describeMatchReasons(satisfiableExcludeAllRules, 'Pod', identityT);

    expect(reasons).toHaveLength(2);
    expect(reasons[1]).toContain('exclude block covering kind "Pod"');
  });
});

describe('suggestFix', () => {
  const target = { policy: 'require-app-label', status: 'fail' as const };

  test('points at validate.pattern for a pattern-based rule', () => {
    const rule: PolicyRule = { name: 'r', validate: { pattern: {} } };
    expect(suggestFix(rule, target)).toContain('pattern');
  });

  test('points at validate.cel for a CEL-based rule', () => {
    const rule: PolicyRule = { name: 'r', validate: { cel: {} } };
    expect(suggestFix(rule, { ...target, policy: 'require-team-label' })).toContain(
      'CEL expression'
    );
  });

  test('falls back to a generic message when the rule uses no recognized mechanism', () => {
    const rule: PolicyRule = { name: 'r' };
    expect(suggestFix(rule, target)).toContain('rule "r" on policy "require-app-label"');
  });

  test('never leaks the literal string "undefined" when rule.name is missing', () => {
    // suggestFix is written for the legacy PolicyRule shape. A CEL
    // ValidatingPolicy's validations have no "rules" or "name" at all, see
    // notes/02-policy-impact-map.md, full CEL-aware explanations are
    // deferred to PR-4, but this guards the one part that could otherwise
    // produce broken-looking output today: rule.name being undefined.
    const ruleWithNoName = {} as PolicyRule;
    const result = suggestFix(ruleWithNoName, target);

    expect(result).not.toContain('undefined');
    expect(result).toContain('this rule');
  });

  test('points at deny.conditions for a conditional deny rule, found via Copilot review', () => {
    // Confirmed against kubectl explain (clusterpolicy.spec.rules.validate.deny):
    // conditions is the real field a deny rule is evaluated against, and a deny
    // rule is conditional far more often than it is unconditional.
    const rule: PolicyRule = {
      name: 'deny-privileged',
      validate: {
        deny: {
          conditions: {
            any: [{ key: '{{ request.object.spec.privileged }}', operator: 'Equals', value: true }],
          },
        },
      },
    };

    const result = suggestFix(rule, target);

    expect(result).toContain('deny.conditions');
    expect(result).toContain('rule "deny-privileged"');
    expect(result).not.toContain('outright');
  });

  test('falls back to an outright-deny message when a deny rule has no conditions, found via Copilot review', () => {
    const rule: PolicyRule = { name: 'deny-everything', validate: { deny: {} } };

    const result = suggestFix(rule, target);

    expect(result).toContain('outright');
    expect(result).toContain('match and exclude blocks');
  });
});
