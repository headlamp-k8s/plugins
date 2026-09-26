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

import { MatchSelectorEntry, PolicyRule } from './kyvernoPolicy';
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
  apiVersion?: string;
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
    // the primary source and the whole `scope` object is the fallback, used
    // only when there are no resources[] entries at all. A result can
    // reference more than one resource, so every entry gets its own map
    // slot. Individual fields are never borrowed from `scope` for a genuine
    // resources[] entry, `scope` describes the report's own subject, not
    // necessarily the resource in this specific entry, borrowing its uid (or
    // any other field) would attribute one resource's identity to another.
    // When there is truly no identity at all (no resources[], no scope),
    // iterate zero times rather than fabricate a placeholder resource.
    const resourceRefs =
      result.resources && result.resources.length > 0
        ? result.resources
        : reportScope
          ? [reportScope]
          : [];

    for (const res of resourceRefs) {
      const kind = res?.kind || 'Unknown';
      const name = res?.name || '(unscoped)';
      const namespace = res?.namespace || reportNamespace;
      const uid = res?.uid;
      const apiVersion = res?.apiVersion;
      // Prefer the UID when it's available. The name-based key alone can
      // collide for distinct objects that share kind, namespace, and name,
      // for example the same name used by two different API groups, so the
      // fallback also folds in apiVersion.
      const key = uid || `${apiVersion || ''}/${kind}/${namespace || ''}/${name}`;
      const existing = byResource.get(key);

      if (!existing || STATUS_RANK[result.result] > STATUS_RANK[existing.status]) {
        byResource.set(key, {
          policy: policyName,
          kind,
          apiVersion,
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

function selectorMentionsKind(selector: MatchSelectorEntry, kind: string): boolean {
  const kinds = selector.resources?.kinds || [];
  // Kyverno match kinds support "*" as a wildcard for every kind, an
  // exact-membership check alone would reject a kind matched this way.
  return kinds.includes(kind) || kinds.includes('*');
}

function describeConstraints(selectors: MatchSelectorEntry[], kind: string): string {
  const parts = [`kind "${kind}"`];
  const namespaces = selectors.flatMap(s => s.resources?.namespaces || []);
  if (namespaces.length > 0) {
    parts.push(`namespaces [${namespaces.join(', ')}]`);
  }
  if (selectors.some(s => s.resources?.selector)) {
    parts.push('a label selector');
  }
  if (selectors.some(s => s.resources?.namespaceSelector)) {
    parts.push('a namespace label selector');
  }
  return parts.join(' and ');
}

/**
 * Explains, in plain language, which rule and selector caused a policy to
 * consider a given resource kind. Read directly from the policy spec so the
 * explanation stays accurate even for policies with several rules.
 */
export function describeMatchReasons(rules: PolicyRule[], kind: string): string[] {
  // An empty or missing rules array is also how a policy type this function
  // was not written for (a CEL ValidatingPolicy has no rules[] at all, only
  // validations[]) reaches here, that is not the same as "rules exist but
  // none of them matched", so it needs its own honest message rather than
  // implying provenance this function has no basis to claim.
  if (!rules || rules.length === 0) {
    return [
      `This policy's rules could not be read in a format this explanation understands; provenance for kind "${kind}" is unknown.`,
    ];
  }

  const reasons: string[] = [];

  for (const rule of rules) {
    const ruleReasons: string[] = [];

    // match.any is OR, any single entry matching is sufficient on its own.
    for (const selector of rule.match?.any || []) {
      if (!selectorMentionsKind(selector, kind)) continue;
      ruleReasons.push(`Rule "${rule.name}" matches ${describeConstraints([selector], kind)}.`);
    }

    // match.all is AND, every entry has to hold at once, so the kind check
    // has to pass for all of them together, concatenating any and all into
    // one OR'd list (the previous approach) would report a match whenever a
    // single all[] entry happened to name this kind, even when another entry
    // in the same all[] block restricts it to a different kind entirely,
    // something no single resource could ever satisfy.
    const allSelectors = rule.match?.all || [];
    if (allSelectors.length > 0 && allSelectors.every(s => selectorMentionsKind(s, kind))) {
      ruleReasons.push(`Rule "${rule.name}" matches ${describeConstraints(allSelectors, kind)}.`);
    }

    // exclude overrides a positive match at runtime for a resource it also
    // covers. This function only has a kind, not a full resource, so it
    // cannot know for certain whether a given resource would actually be
    // excluded, but staying silent about an exclude block that plausibly
    // covers this kind would let the reason above overstate certainty.
    if (ruleReasons.length > 0 && rule.exclude) {
      const excludeSelectors = [...(rule.exclude.any || []), ...(rule.exclude.all || [])];
      if (excludeSelectors.some(s => selectorMentionsKind(s, kind))) {
        ruleReasons.push(
          `Rule "${rule.name}" also has an exclude block covering kind "${kind}"; a specific resource matching it would not actually be affected by this rule.`
        );
      }
    }

    reasons.push(...ruleReasons);
  }

  if (reasons.length > 0) return reasons;
  return [
    `No rule in this policy explicitly lists kind "${kind}" in its match block; it was likely reached through a generated rule or a background scan.`,
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
