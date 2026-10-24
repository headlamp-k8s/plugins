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
  PolicyReportSource,
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

// A resource's apiVersion is "group/version" (or just "version" for the unnamed core group,
// e.g. "v1"), and the same live object can be reported under more than one served version of
// the same group, e.g. an HPA as "autoscaling/v1" from one rule and "autoscaling/v2" from
// another. Only the group actually identifies which API this resource belongs to; the version
// is a serialization detail, not part of the resource's identity. Used below for the fallback
// key so UID-less references to the same resource reconcile across versions instead of
// splitting into separate rows, while still keeping genuinely different groups apart.
function apiGroupOf(apiVersion: string | undefined): string {
  if (!apiVersion) return '';
  const slashIndex = apiVersion.indexOf('/');
  return slashIndex === -1 ? '' : apiVersion.slice(0, slashIndex);
}

function ingest(
  policyName: string,
  policySource: PolicyReportSource,
  results: PolicyReportResult[],
  reportScope: PolicyReportInterface['scope'],
  reportNamespace: string | undefined,
  byResource: Map<string, ImpactedResource>,
  nameKeyToUid: Map<string, string>
) {
  for (const result of results) {
    // PolicyReport / ClusterPolicyReport is the community wgpolicyk8s.io CRD,
    // not exclusive to Kyverno, and Kubernetes itself permits a legacy
    // ClusterPolicy and a CEL ValidatingPolicy (or any other Kyverno engine)
    // to share a bare name. Matching on `policy` alone would attribute one
    // policy's resources and statuses to an unrelated one that happens to
    // share its name; `source` is what actually identifies which engine
    // produced a given result (see POLICY_REPORT_SOURCE in policyReport.ts).
    if (result.policy !== policyName || result.source !== policySource) continue;

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
      // The name-based key alone can collide for distinct objects that share
      // kind, namespace, and name, for example the same name used by two
      // different API groups, so it also folds in the API group. The group
      // only, not the full apiVersion: two references to the identical
      // resource can carry different served versions of the same group
      // (see apiGroupOf above), and those have to reconcile to one entry,
      // not split into two just because they named different versions.
      const nameKey = `${apiGroupOf(apiVersion)}/${kind}/${namespace || ''}/${name}`;

      let key: string;
      if (uid) {
        key = uid;
        // First time this exact resource's UID shows up: remember it so a
        // UID-less reference for the same name-key, arriving in either
        // input order, resolves to this same slot instead of staying a
        // separate duplicate. A name-key that already maps to a different
        // UID is left alone, that's a genuine conflict (two distinct
        // objects that happen to share kind/namespace/name), not the same
        // resource reported two ways, so each keeps its own UID-keyed entry.
        if (!nameKeyToUid.has(nameKey)) {
          nameKeyToUid.set(nameKey, uid);
          const orphan = byResource.get(nameKey);
          if (orphan) {
            byResource.delete(nameKey);
            const uidEntry = byResource.get(key);
            // The UID-keyed slot can already hold an entry from an earlier reference to this
            // same resource under a different apiVersion. Overwriting it unconditionally would
            // silently discard whichever of the two actually has the worse status, the exact
            // guarantee this map exists to preserve. Keep whichever of the two ranks worse.
            if (!uidEntry || STATUS_RANK[orphan.status] > STATUS_RANK[uidEntry.status]) {
              byResource.set(key, orphan);
            }
          }
        }
      } else {
        // No UID on this reference: resolve to a UID we've already seen for
        // this exact name-key so it merges instead of duplicating. Falls
        // back to the name-key itself when no UID has been seen for it yet.
        key = nameKeyToUid.get(nameKey) || nameKey;
      }

      const existing = byResource.get(key);
      // Once a UID becomes known for this slot, keep carrying it even when
      // the winning status below comes from a UID-less reference, losing it
      // would make a later UID-less reference for the same resource miss
      // the nameKeyToUid redirect above and duplicate it again.
      const resolvedUid = uid || existing?.uid;

      if (!existing || STATUS_RANK[result.result] > STATUS_RANK[existing.status]) {
        byResource.set(key, {
          policy: policyName,
          kind,
          apiVersion,
          name,
          namespace,
          uid: resolvedUid,
          status: result.result,
          rule: result.rule,
          message: result.message,
          severity: result.severity,
        });
      } else if (resolvedUid && !existing.uid) {
        existing.uid = resolvedUid;
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
 *
 * `policySource` is required, not optional: a bare policy name is not a safe
 * identity key on its own (see the comment in `ingest`), so every caller has
 * to say which engine's results it actually wants, using the constants in
 * POLICY_REPORT_SOURCE (policyReport.ts).
 */
export function collectPolicyImpact(
  policyName: string,
  policySource: PolicyReportSource,
  policyReports: PolicyReport[] | null,
  clusterPolicyReports: ClusterPolicyReport[] | null,
  policyNamespace?: string
): PolicyImpactSummary {
  const qualifiedName = policyNamespace ? `${policyNamespace}/${policyName}` : policyName;
  const byResource = new Map<string, ImpactedResource>();
  // Shared across every report processed below, not reset per report: a UID-less reference to
  // the same resource can land in a different PolicyReport than the one that first carried its
  // UID (e.g. one rule's result versus another's), so the redirect has to survive across calls.
  const nameKeyToUid = new Map<string, string>();

  for (const report of policyReports || []) {
    ingest(
      qualifiedName,
      policySource,
      report.results,
      report.scope,
      report.jsonData.metadata.namespace,
      byResource,
      nameKeyToUid
    );
  }
  for (const report of clusterPolicyReports || []) {
    ingest(
      qualifiedName,
      policySource,
      report.results,
      report.scope,
      undefined,
      byResource,
      nameKeyToUid
    );
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

// Matches a real Kubernetes API version segment (v1, v2, v1alpha1, v1beta2, ...) or a wildcard
// standing in for one, confirmed against Kyverno's own versionRegex in pkg/utils/kube/kind.go.
// Used below only where the real ParseKindSelector itself consults it: to disambiguate the
// 2-segment and 3-segment forms, never as a general "find the version anywhere" scan. A version
// segment that does not actually match this regex, like a wildcarded "v*", is still a perfectly
// valid version in Kyverno's own parser, it just isn't the thing this regex is asked about for
// those two forms, see the case-3 comment below.
const K8S_VERSION_SEGMENT = /^(v\d+((alpha|beta)\d*)?|\*)$/;

// Kyverno kind patterns can be a bare kind ("Pod"), version-qualified ("v1/Pod"),
// group+version-qualified ("apps/v1/Deployment"), and any of those forms can also carry a
// subresource, joined to the kind with a dot rather than a slash ("Pod.status",
// "apps/v1/Deployment.scale"). This is a direct, segment-count-based port of Kyverno's real
// ParseKindSelector (pkg/utils/kube/kind.go), returning only the kind component (its third
// return value). An earlier version of this function instead scanned for "whatever segment
// looks like a version", which breaks whenever a wildcard group ("*/v1/Pod.status") or a
// version Kyverno accepts positionally but this regex would not recognize on its own
// ("apps/v*/Deployment") appears, since positional, not pattern-based, is what the real parser
// actually does once the segment count disambiguates the form. Report results only ever carry
// the bare kind, never a qualified pattern, so only the kind is extracted here.
function normalizeKindPattern(pattern: string): string {
  const slashSegments = pattern.split('/');
  const last = slashSegments[slashSegments.length - 1];
  const dotIndex = last.indexOf('.');
  const parts =
    dotIndex === -1
      ? slashSegments
      : [...slashSegments.slice(0, -1), last.slice(0, dotIndex), last.slice(dotIndex + 1)];

  switch (parts.length) {
    case 1:
      // Bare kind, nothing to disambiguate.
      return parts[0];
    case 2:
      // "*/*": wildcard kind, wildcard subresource.
      if (parts[0] === '*' && parts[1] === '*') return '*';
      // "*/status": a lowercase second segment reads as a subresource name by convention, so
      // this is wildcard kind + subresource, not version "*" paired with kind "status".
      if (parts[0] === '*' && parts[1] === parts[1].toLowerCase()) return '*';
      // "v1/Pod": version + kind.
      if (K8S_VERSION_SEGMENT.test(parts[0])) return parts[1];
      // "Pod.status" or "Pod/status": kind + subresource, the only remaining 2-segment form.
      return parts[0];
    case 3:
      // "v1/Pod.status" (version/kind/subresource after the dot-split above) only when the
      // first segment itself looks like a real version; otherwise this is group/version/kind
      // with no subresource ("apps/v1/Deployment"), kind is the third segment regardless of
      // whether the middle one matches K8S_VERSION_SEGMENT, "apps/v*/Deployment" is still a
      // valid group/version/kind triple in Kyverno's own parser even though "v*" itself is not
      // recognized by the version regex.
      return K8S_VERSION_SEGMENT.test(parts[0]) ? parts[1] : parts[2];
    case 4:
      // "apps/v1/Deployment.scale" (group/version/kind/subresource after the dot-split) or
      // "*/v1/Pod.status" (wildcard group/version/kind/subresource): kind is always third.
      return parts[2];
    default:
      // More segments than any real Kyverno kind selector form produces; no kind to extract.
      return '';
  }
}

// Kyverno's own kind matcher (pkg/utils/match/kind.go CheckKind, confirmed against the real
// source) runs the parsed kind segment through its ext/wildcard package's genuine glob matching,
// not a literal-character check: "*" matches zero or more runes, and "?" matches exactly one
// rune (confirmed against ext/wildcard/match.go), so "Pod*" matches any kind starting with
// "Pod" and "P?d" matches "Pod". Both are translated into their regex equivalents here; every
// other character, including any that are themselves regex-special, is escaped literally.
function kindPatternMatches(pattern: string, kind: string): boolean {
  if (pattern === '*') return true;
  let regexSource = '';
  for (const ch of pattern) {
    if (ch === '*') regexSource += '.*';
    else if (ch === '?') regexSource += '.';
    else regexSource += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${regexSource}$`).test(kind);
}

function selectorMentionsKind(selector: MatchSelectorEntry, kind: string): boolean {
  const kinds = selector.resources?.kinds;
  // Confirmed against Kyverno's own checkResourceDescription (pkg/utils/match/match.go): the kind
  // check only runs at all when len(conditionBlock.Kinds) > 0. An omitted or empty kinds list
  // imposes no kind restriction, it matches every kind, not none, the way a plain `kinds.some(...)`
  // over an empty array would otherwise conclude for a selector that only constrains namespaces,
  // labels, or names.
  if (!kinds || kinds.length === 0) return true;
  return kinds.some(pattern => kindPatternMatches(normalizeKindPattern(pattern), kind));
}

function describeConstraints(selectors: MatchSelectorEntry[], kind: string): string {
  const parts = [`kind "${kind}"`];
  // More than one selector here only ever means a match.all/exclude.all block (every entry
  // already confirmed to hold at once by the caller), so each entry's own namespaces list is a
  // separate AND-ed constraint, not an alternative. Flattening them into one bracketed list the
  // way a single selector's namespaces are listed below would read as "any of these", losing
  // exactly the "all must hold" guarantee match.all/exclude.all makes, e.g. namespaces
  // ["team-*"] and ["*-prod"] from two different all[] entries both have to match, "team-dev"
  // satisfies only the first and still would not qualify.
  const namespaceGroups = selectors
    .map(s => s.resources?.namespaces)
    .filter((ns): ns is string[] => !!ns && ns.length > 0);
  if (namespaceGroups.length === 1) {
    parts.push(`namespaces [${namespaceGroups[0].join(', ')}]`);
  } else if (namespaceGroups.length > 1) {
    parts.push(
      `namespaces matching all of ${namespaceGroups.map(ns => `[${ns.join(', ')}]`).join(' and ')}`
    );
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
    // The deprecated direct match.resources form is one more implicit OR
    // branch alongside it (same ResourceDescription shape as a single any/all
    // entry, see MatchSelector), so it's folded into the same any-style loop
    // rather than needing its own separate check.
    const anySelectors = rule.match?.resources
      ? [...(rule.match.any || []), { resources: rule.match.resources }]
      : rule.match?.any || [];
    for (const selector of anySelectors) {
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
    //
    // Same any/all/direct distinction as the positive match logic above, for the same reason:
    // exclude.all is AND, so flattening it into one OR'd list with exclude.any (as this used to
    // do) would report an exclusion whenever a single all[] entry happened to name this kind, even
    // when an all: [Pod, Deployment] block, impossible for any single resource to satisfy, could
    // never actually exclude anything.
    if (ruleReasons.length > 0 && rule.exclude) {
      const excludeAny = rule.exclude.any || [];
      const excludeAll = rule.exclude.all || [];
      const excludeDirect = rule.exclude.resources ? [{ resources: rule.exclude.resources }] : [];
      const excludeMentionsKind =
        excludeAny.some(s => selectorMentionsKind(s, kind)) ||
        (excludeAll.length > 0 && excludeAll.every(s => selectorMentionsKind(s, kind))) ||
        excludeDirect.some(s => selectorMentionsKind(s, kind));
      if (excludeMentionsKind) {
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
    return `This rule enforces the pattern below on ${
      target.kind || 'the resource'
    }. Update the manifest so every field matches the pattern, then re-apply it.`;
  }
  if (rule.validate?.anyPattern) {
    return `This rule requires the resource to satisfy at least one of several patterns. Compare the resource against each entry in validate.anyPattern and adjust it to match one of them.`;
  }
  if (rule.validate?.deny) {
    // deny.conditions (any/all, confirmed against the real CRD schema) is what
    // actually decides whether a given matched resource gets denied, a deny rule
    // is conditional far more often than not, and commonly references editable
    // resource fields. Pointing straight at match/exclude here would tell users
    // to change the policy's scope when the real fix is usually to change the
    // resource so the conditions no longer hold; reserve match/exclude for a
    // resource that is genuinely meant to be out of scope entirely.
    const deny = rule.validate.deny as { conditions?: unknown };
    if (deny.conditions) {
      return `This rule denies matching resources when validate.deny.conditions on ${ruleLabel} evaluates to true. Review those conditions and adjust the resource so they evaluate to false; only use the match and exclude blocks if this resource should be out of scope entirely.`;
    }
    return `This rule denies every matching resource outright, with no conditions attached. Check the match and exclude blocks on ${ruleLabel} to see whether this resource should be excluded instead.`;
  }
  if (rule.validate?.cel) {
    return `This rule is enforced with a CEL expression. Review validate.cel.expressions on ${ruleLabel} and adjust the resource so the expression evaluates to true.`;
  }
  if (rule.mutate) {
    return `This is a mutation rule; Kyverno should patch the resource automatically. If the patch did not apply, confirm the rule's match block covers this resource and that mutation was not skipped.`;
  }
  return `Review the message above together with ${ruleLabel} on policy "${target.policy}" to see what condition failed.`;
}
