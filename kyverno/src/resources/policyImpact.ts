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

import { PolicyRule } from './kyvernoPolicy';
import {
  ClusterPolicyReport,
  PolicyReport,
  PolicyReportInterface,
  PolicyReportResult,
  PolicyResultStatus,
} from './policyReport';

// Minimal shape needed to open a ViolationDrillDown dialog from anywhere in the
// plugin (the Violations view, the Policy Impact panel, or a Map node).
export interface DrillDownTarget {
  policy: string;
  rule?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  message?: string;
  severity?: string;
  status: PolicyResultStatus;
}

export type ImpactedResource = DrillDownTarget & { uid?: string };

export interface PolicyImpactSummary {
  resources: ImpactedResource[];
  byKind: Map<string, ImpactedResource[]>;
  namespaces: Set<string>;
  counts: Record<PolicyResultStatus, number>;
}

// When a resource shows up in more than one report result for the same policy
// (evaluated by more than one rule), the worst status wins for the summary view.
const STATUS_RANK: Record<PolicyResultStatus, number> = {
  error: 4,
  fail: 3,
  warn: 2,
  skip: 1,
  pass: 0,
};

function ingest(
  policyName: string,
  results: PolicyReportResult[],
  reportScope: PolicyReportInterface['scope'],
  reportNamespace: string | undefined,
  byResource: Map<string, ImpactedResource>
) {
  for (const result of results) {
    if (result.policy !== policyName) continue;

    // Background-scan reports put the resource identity on the report's
    // `scope` rather than per-result `resources[]` (Kyverno emits one
    // PolicyReport per scanned resource in that mode), so `resources[]` is
    // the primary source and `scope` is the fallback.
    const res = result.resources?.[0];
    const kind = res?.kind || reportScope?.kind || 'Unknown';
    const name = res?.name || reportScope?.name || '(unscoped)';
    const namespace = res?.namespace || reportScope?.namespace || reportNamespace;
    const uid = res?.uid || reportScope?.uid;
    const key = `${kind}/${namespace || ''}/${name}`;
    const existing = byResource.get(key);

    if (!existing || STATUS_RANK[result.result] > STATUS_RANK[existing.status]) {
      byResource.set(key, {
        policy: policyName,
        kind,
        name,
        namespace,
        uid,
        status: result.result,
        rule: result.rule,
        message: result.message,
        severity: result.severity,
      });
    }
  }
}

/**
 * Builds the set of resources a policy actually touched, grouped by kind, from
 * the live PolicyReport / ClusterPolicyReport results already on the cluster.
 * This reflects what Kyverno evaluated rather than a static re-implementation
 * of its match logic, so it stays correct across selector, CEL, and autogen rules.
 *
 * Kyverno encodes a namespaced policy's identity in report results as
 * `<namespace>/<name>` (see bucketReportResults), cluster policies stay
 * unprefixed. Pass `policyNamespace` for a namespaced Policy so this matches
 * the qualified form, otherwise every result is silently filtered out even
 * when real data exists, `policyName` alone is never enough for a namespaced
 * policy.
 */
export function collectPolicyImpact(
  policyName: string,
  policyReports: PolicyReport[] | null,
  clusterPolicyReports: ClusterPolicyReport[] | null,
  policyNamespace?: string
): PolicyImpactSummary {
  const qualifiedName = policyNamespace ? `${policyNamespace}/${policyName}` : policyName;
  const byResource = new Map<string, ImpactedResource>();

  for (const report of policyReports || []) {
    ingest(
      qualifiedName,
      report.results,
      report.scope,
      report.jsonData.metadata.namespace,
      byResource
    );
  }
  for (const report of clusterPolicyReports || []) {
    ingest(qualifiedName, report.results, report.scope, undefined, byResource);
  }

  const resources = Array.from(byResource.values());
  const byKind = new Map<string, ImpactedResource[]>();
  const namespaces = new Set<string>();
  const counts: Record<PolicyResultStatus, number> = {
    pass: 0,
    fail: 0,
    warn: 0,
    error: 0,
    skip: 0,
  };

  for (const r of resources) {
    const list = byKind.get(r.kind || 'Unknown') || [];
    list.push(r);
    byKind.set(r.kind || 'Unknown', list);
    if (r.namespace) namespaces.add(r.namespace);
    counts[r.status]++;
  }

  return { resources, byKind, namespaces, counts };
}

/**
 * Explains, in plain language, which rule and selector caused a policy to
 * consider a given resource kind. Read directly from the policy spec so the
 * explanation stays accurate even for policies with several rules.
 */
export function describeMatchReasons(rules: PolicyRule[], kind: string): string[] {
  const reasons: string[] = [];

  for (const rule of rules) {
    const selectors = [...(rule.match?.any || []), ...(rule.match?.all || [])];
    for (const selector of selectors) {
      const kinds = selector.resources?.kinds || [];
      if (!kinds.includes(kind)) continue;

      const parts = [`kind "${kind}"`];
      if (selector.resources?.namespaces?.length) {
        parts.push(`namespaces [${selector.resources.namespaces.join(', ')}]`);
      }
      if (selector.resources?.selector) {
        parts.push('a label selector');
      }
      reasons.push(`Rule "${rule.name}" matches ${parts.join(' and ')}.`);
    }
  }

  if (reasons.length > 0) return reasons;
  return [
    `No rule in this policy explicitly lists kind "${kind}" in its match block; it was likely reached through a generated rule, a wildcard selector, or a background scan.`,
  ];
}

/**
 * Heuristic remediation guidance built from the actual failing rule
 * definition. Deliberately conservative: it points at the exact clause that
 * failed rather than guessing at the user's intent.
 */
export function suggestFix(rule: PolicyRule, target: DrillDownTarget): string {
  // rule.name is only guaranteed on the legacy kyverno.io/v1 rule shape this
  // function was written for. A CEL ValidatingPolicy's validations have no
  // "rules" at all, so a caller that hasn't adapted one into a PolicyRule yet
  // would otherwise leak the literal string "undefined" into this text.
  const ruleLabel = rule.name ? `rule "${rule.name}"` : 'this rule';

  if (rule.validate?.pattern) {
    return `This rule enforces the pattern below on ${target.kind || 'the resource'}. Update the manifest so every field matches the pattern, then re-apply it.`;
  }
  if (rule.validate?.anyPattern) {
    return `This rule requires the resource to satisfy at least one of several patterns. Compare the resource against each entry in validate.anyPattern and adjust it to match one of them.`;
  }
  if (rule.validate?.deny) {
    return `This rule denies matching resources outright rather than asking for a change. Check the match and exclude blocks on ${ruleLabel} to see whether this resource should be excluded instead of edited.`;
  }
  if (rule.validate?.cel) {
    return `This rule is enforced with a CEL expression. Review validate.cel.expressions on ${ruleLabel} and adjust the resource so the expression evaluates to true.`;
  }
  if (rule.mutate) {
    return `This is a mutation rule; Kyverno should patch the resource automatically. If the patch did not apply, confirm the rule's match block covers this resource and that mutation was not skipped.`;
  }
  return `Review the message above together with ${ruleLabel} on policy "${target.policy}" to see what condition failed.`;
}
