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
import { ClusterPolicyReport, PolicyReport } from './policyReport';

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
  class PolicyReport extends PolicyReportBase { }
  class ClusterPolicyReport extends PolicyReportBase { }
  return { PolicyReport, ClusterPolicyReport };
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
        },
      ]),
    ];

    const impact = collectPolicyImpact('require-app-label', reports, []);

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
          source: 'KyvernoValidatingPolicy',
        },
      ]),
      report('team-checkout', goodTeamPod, [
        {
          policy: 'require-team-label',
          result: 'pass',
          message: 'success',
          source: 'KyvernoValidatingPolicy',
        },
      ]),
    ];

    const impact = collectPolicyImpact('require-team-label', reports, []);

    expect(impact.counts).toEqual({ pass: 1, fail: 1, warn: 0, error: 0, skip: 0 });
    expect(impact.namespaces).toEqual(new Set(['team-checkout']));
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
        },
      ]),
    ];

    const withoutNamespace = collectPolicyImpact('require-cost-center-label', reports, []);
    expect(withoutNamespace.resources).toEqual([]);

    const withNamespace = collectPolicyImpact(
      'require-cost-center-label',
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
    const policyReports = [report('team-checkout', badPod, [{ policy: 'p', result: 'fail' }])];
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
        results: [{ policy: 'p', result: 'fail' }],
      } as any),
    ];

    const impact = collectPolicyImpact('p', policyReports, clusterReports);

    expect(Array.from(impact.byKind.keys()).sort()).toEqual(['Deployment', 'Pod']);
    expect(impact.byKind.get('Deployment')).toHaveLength(1);
    expect(impact.byKind.get('Pod')).toHaveLength(1);
  });

  test('returns an empty summary for a policy with zero results, not an error', () => {
    const reports = [report('team-checkout', badPod, [{ policy: 'require-app-label', result: 'fail' }])];

    const impact = collectPolicyImpact('a-policy-nothing-matches', reports, []);

    expect(impact.resources).toEqual([]);
    expect(impact.byKind.size).toBe(0);
    expect(impact.namespaces.size).toBe(0);
    expect(impact.counts).toEqual({ pass: 0, fail: 0, warn: 0, error: 0, skip: 0 });
  });

  test('handles null report lists the same as empty ones, useList() returns null while loading', () => {
    const impact = collectPolicyImpact('any-policy', null, null);

    expect(impact.resources).toEqual([]);
  });

  test('keeps the worst status when a resource appears more than once for the same policy', () => {
    // Not reproduced live: on the current Kyverno version a resource gets exactly
    // one report entry per policy (see notes/02-policy-impact-map.md), so this
    // exercises collectPolicyImpact's documented dedup contract defensively,
    // in case a version or mode produces more than one result per resource.
    const reports = [
      report('team-checkout', badPod, [
        { policy: 'p', rule: 'r1', result: 'pass' },
        { policy: 'p', rule: 'r2', result: 'fail' },
      ]),
    ];

    const impact = collectPolicyImpact('p', reports, []);

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
          resources: [{ kind: 'Pod', name: 'from-resources-array', namespace: 'team-checkout' }],
        },
      ],
    } as any);

    const impact = collectPolicyImpact('p', [withResourcesArray], []);

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
          resources: [
            { kind: 'Pod', name: 'first', namespace: 'team-checkout', uid: 'uid-first' },
            { kind: 'Pod', name: 'second', namespace: 'team-checkout', uid: 'uid-second' },
          ],
        },
      ],
    } as any);

    const impact = collectPolicyImpact('p', [multiResourceReport], []);

    expect(impact.resources.map(r => r.name).sort()).toEqual(['first', 'second']);
  });

  test('prefers the UID over the name-based key so same-named resources from different API groups do not collapse, found via Copilot review', () => {
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
          resources: [{ kind: 'Widget', name: 'shared-name', namespace: 'team-checkout', uid: 'widget-a' }],
        },
        {
          policy: 'p',
          result: 'pass',
          resources: [{ kind: 'Widget', name: 'shared-name', namespace: 'team-checkout', uid: 'widget-b' }],
        },
      ],
    } as any);

    const impact = collectPolicyImpact('p', [crossGroupReport], []);

    expect(impact.resources).toHaveLength(2);
    expect(impact.resources.map(r => r.uid).sort()).toEqual(['widget-a', 'widget-b']);
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
    const reasons = describeMatchReasons(rules, 'Pod');

    expect(reasons).toEqual([
      'Rule "check-pods" matches kind "Pod" and namespaces [team-checkout].',
    ]);
  });

  test('admits when no rule explicitly matches the kind, autogen or background scan territory', () => {
    const reasons = describeMatchReasons(rules, 'Deployment');

    expect(reasons[0]).toContain('No rule in this policy explicitly lists kind "Deployment"');
  });

  test('recognizes a wildcard kind as an explicit match, found via Copilot review', () => {
    const wildcardRules: PolicyRule[] = [
      { name: 'check-everything', match: { any: [{ resources: { kinds: ['*'] } }] } },
    ];

    const reasons = describeMatchReasons(wildcardRules, 'Deployment');

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

    const reasons = describeMatchReasons(namespaceSelectorRules, 'Pod');

    expect(reasons[0]).toContain('a namespace label selector');
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
});
