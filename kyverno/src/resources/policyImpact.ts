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
            // same resource under a different apiVersion (see the three-reference regression
            // test below). Overwriting it unconditionally would silently discard whichever of
            // the two actually has the worse status, the exact guarantee this map exists to
            // preserve. Keep whichever of the two ranks worse.
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
  // Shared across both report kinds so a resource reported with a UID in one
  // and without one in the other (or vice versa) still reconciles into a
  // single entry, see the comment in `ingest`.
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
// standing in for one, used below to find the kind inside a qualified pattern regardless of how
// many other segments (group, subresource) surround it. The "*" alternative is confirmed against
// Kyverno's own versionRegex in pkg/utils/kube/kind.go: it matches a literal "*" explicitly, so a
// pattern like "*/Pod" means "any version, kind Pod", not a version-less bare pattern whose first
// segment happens to be "*". The alpha/beta suffix requires at least one digit ("\d+", not "\d*"),
// matching Kyverno's own versionRegex exactly: without it, a group name that merely starts with
// "alpha"/"beta" (e.g. the API group "v1alpha" in a group-qualified pattern like
// "v1alpha/v1/Widget") gets misread as a version segment, and the 3-segment case below picks
// segments[1] ("v1") as the kind instead of the real kind in segments[2] ("Widget").
const K8S_VERSION_SEGMENT = /^(v\d+((alpha|beta)\d+)?|\*)$/;

// Faithful port of Kyverno's real ParseKindSelector (pkg/utils/kube/kind.go, confirmed against
// the Go source), which this plugin only needs the kind out of. It first splits the pattern on
// "/", then splits only the LAST resulting segment on "." too, a kind pattern can carry a
// dot-qualified subresource ("Pod.status") as well as a slash-qualified one ("Pod/status"), both
// mean the same thing to Kyverno. It then walks the segment count exactly as Kyverno does. A
// 2-segment "x/y" pattern is ambiguous between "version/kind" and "kind/subresource": Kyverno
// breaks the tie by checking whether y is a real version, or (when x is "*") whether y is already
// all lowercase, which is what a subresource name looks like and a kind name never does, so
// "*/status" means "wildcard kind, status subresource", not "version *, kind status".
function normalizeKindPattern(pattern: string): string {
  let segments = pattern.split('/');
  const lastIndex = segments.length - 1;
  segments = [...segments.slice(0, lastIndex), ...segments[lastIndex].split('.')];

  switch (segments.length) {
    case 1:
      // Bare kind.
      return segments[0];
    case 2: {
      const [first, second] = segments;
      if (first === '*' && second === '*') {
        // "*/*": every resource and subresource.
        return '*';
      }
      if (first === '*' && second === second.toLowerCase()) {
        // "*/subresource": an all-lowercase second segment is a subresource
        // name, never a kind, so the kind here is the wildcard itself.
        return '*';
      }
      if (K8S_VERSION_SEGMENT.test(first)) {
        // "version/kind" (including the wildcard-version form "*/Kind").
        return second;
      }
      // "kind/subresource".
      return first;
    }
    case 3:
      // "version/kind/subresource" when the first segment is a real version,
      // otherwise "group/version/kind".
      return K8S_VERSION_SEGMENT.test(segments[0]) ? segments[1] : segments[2];
    case 4:
      // "group/version/kind/subresource".
      return segments[2];
    default:
      return '';
  }
}

// Kyverno's own kind matcher (pkg/utils/match/kind.go CheckKind) runs the parsed kind segment
// through its ext/wildcard package (ext/wildcard/match.go, confirmed against the real source):
// a single-backtrack, two-pointer glob matcher, not a regex engine. "*" matches zero or more
// characters and "?" matches exactly one. This is a direct port of that algorithm rather than a
// translation into a regex, since naively turning every "*" into ".*" hands the pattern to the
// native regex engine's own backtracking, and a pathological pattern (many "*" characters
// against a long non-matching kind, e.g. "****************Pod" against
// "HorizontalPodAutoscaler") can make that backtracking combinatorial and freeze this
// synchronous render. This port is linear in the length of `kind`: each `*` is backtracked to
// at most once, and every backtrack advances the position it resumes from, so there is no
// equivalent blowup to guard against.
function kindPatternMatches(pattern: string, kind: string): boolean {
  if (pattern === '') return kind === '';
  if (pattern === '*') return true;

  const p = Array.from(pattern);
  const s = Array.from(kind);
  let pIdx = 0;
  let sIdx = 0;
  let starIdx = -1; // index in p of the last '*' seen, or -1
  let sTmpIdx = 0; // s index to resume from after that '*'

  while (sIdx < s.length) {
    if (pIdx < p.length && p[pIdx] === '*') {
      starIdx = pIdx;
      sTmpIdx = sIdx;
      pIdx++; // '*' provisionally consumes zero characters
    } else if (pIdx < p.length && (p[pIdx] === '?' || p[pIdx] === s[sIdx])) {
      sIdx++;
      pIdx++;
    } else if (starIdx !== -1) {
      pIdx = starIdx + 1; // backtrack: let the last '*' consume one more character
      sTmpIdx++;
      sIdx = sTmpIdx;
    } else {
      return false;
    }
  }

  // Consume any trailing '*' in the pattern.
  while (pIdx < p.length && p[pIdx] === '*') {
    pIdx++;
  }
  return pIdx === p.length;
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

// Matches react-i18next's TFunction call shape closely enough for this module's purposes,
// without taking a direct dependency on i18next's own types: every caller (useTranslation()'s
// `t`, and the identity translator tests use) satisfies this.
type Translator = (key: string, options?: Record<string, unknown>) => string;

function describeConstraints(selectors: MatchSelectorEntry[], kind: string, t: Translator): string {
  const parts = [t('kind "{{kind}}"', { kind })];
  // Flattening every selector's namespaces into one list describes their union, but for a
  // match.all block (every selector has to hold at once) the real constraint is their
  // intersection: a selector allowing [dev, prod] alongside one allowing [prod] only ever
  // admits prod, not "dev, prod, prod". Keeping each selector's own list separate preserves
  // that "and" relationship instead of implying any one of the listed namespaces would do.
  for (const selector of selectors) {
    const namespaces = selector.resources?.namespaces || [];
    if (namespaces.length > 0) {
      parts.push(t('namespaces [{{namespaces}}]', { namespaces: namespaces.join(', ') }));
    }
    // Same per-selector intersection reasoning as namespaces above applies to name patterns: a
    // match.all entry restricting names to ['database-*'] alongside another constraining kind
    // only is still an AND, so omitting it here described the policy's scope as broader than it
    // actually is, exactly the kind of resource a user would wrongly read as unaffected. Kyverno
    // supports both the plural `names` (a pattern list) and the singular `name` (one exact name)
    // on the same ResourceDescription, confirmed against the real CRD schema, so both are folded
    // into the same constraint instead of only reading the plural form.
    const names = selector.resources?.names || [];
    const allNames = selector.resources?.name ? [selector.resources.name, ...names] : names;
    if (allNames.length > 0) {
      parts.push(t('names [{{names}}]', { names: allNames.join(', ') }));
    }
    // Same per-selector intersection reasoning again: resources.annotations is a real match
    // restriction on Kyverno's ResourceDescription, distinct from `selector` (a label selector on
    // metadata.labels) below. Omitting it described a rule restricted to, say,
    // annotations: { team: 'platform' } as matching every Pod rather than just the ones carrying
    // that annotation.
    const annotations = Object.entries(selector.resources?.annotations || {});
    if (annotations.length > 0) {
      parts.push(
        t('annotations [{{annotations}}]', {
          annotations: annotations.map(([key, value]) => `${key}=${value}`).join(', '),
        })
      );
    }
    // resources.operations is an admission-only constraint on which request verbs (CREATE, UPDATE,
    // DELETE, CONNECT) the rule fires for. Omitting it described a rule restricted to CREATE-only
    // as if it applied to every operation, overstating scope for read-heavy workloads.
    const operations = selector.resources?.operations || [];
    if (operations.length > 0) {
      parts.push(t('operations [{{operations}}]', { operations: operations.join(', ') }));
    }
    // subjects, roles, and clusterRoles are admission-request constraints that restrict which
    // user, group, or service account (subjects), or which bound role (roles/clusterRoles), has
    // to be making the request for the rule to fire. A match.all entry combining a Pod kind
    // selector with subjects: [{kind: User, name: alice}] only applies when alice makes the
    // request, not to any Pod operation. Omitting these made such a rule appear unrestricted by
    // user and overstated its scope.
    const subjects = selector.subjects || [];
    if (subjects.length > 0) {
      const subjectLabels = subjects.map(s =>
        s.kind ? `${s.name ?? ''} (${s.kind})`.trim() : s.name ?? ''
      );
      parts.push(t('subjects [{{subjects}}]', { subjects: subjectLabels.join(', ') }));
    }
    const rawRoles = selector.roles;
    const roles = Array.isArray(rawRoles) ? (rawRoles as string[]) : [];
    if (roles.length > 0) {
      parts.push(t('roles [{{roles}}]', { roles: roles.join(', ') }));
    }
    const rawClusterRoles = selector.clusterRoles;
    const clusterRoles = Array.isArray(rawClusterRoles) ? (rawClusterRoles as string[]) : [];
    if (clusterRoles.length > 0) {
      parts.push(t('cluster roles [{{clusterRoles}}]', { clusterRoles: clusterRoles.join(', ') }));
    }
  }
  if (selectors.some(s => s.resources?.selector)) {
    parts.push(t('a label selector'));
  }
  if (selectors.some(s => s.resources?.namespaceSelector)) {
    parts.push(t('a namespace label selector'));
  }
  return parts.join(` ${t('and')} `);
}

/**
 * Explains, in plain language, which rule and selector caused a policy to
 * consider a given resource kind. Read directly from the policy spec so the
 * explanation stays accurate even for policies with several rules. `t` is
 * threaded through (rather than called internally via useTranslation()) so this
 * stays a plain function callable from a test or from anywhere else that already
 * has a translator in scope, instead of a hook of its own.
 */
export function describeMatchReasons(rules: PolicyRule[], kind: string, t: Translator): string[] {
  // An empty or missing rules array is also how a policy type this function
  // was not written for (a CEL ValidatingPolicy has no rules[] at all, only
  // validations[]) reaches here, that is not the same as "rules exist but
  // none of them matched", so it needs its own honest message rather than
  // implying provenance this function has no basis to claim.
  if (!rules || rules.length === 0) {
    return [
      t(
        'This policy\'s rules could not be read in a format this explanation understands; provenance for kind "{{kind}}" is unknown.',
        { kind }
      ),
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
      ruleReasons.push(
        t('Rule "{{rule}}" matches {{constraints}}.', {
          rule: rule.name,
          constraints: describeConstraints([selector], kind, t),
        })
      );
    }

    // match.all is AND, every entry has to hold at once, so the kind check
    // has to pass for all of them together, concatenating any and all into
    // one OR'd list (the previous approach) would report a match whenever a
    // single all[] entry happened to name this kind, even when another entry
    // in the same all[] block restricts it to a different kind entirely,
    // something no single resource could ever satisfy.
    const allSelectors = rule.match?.all || [];
    if (allSelectors.length > 0 && allSelectors.every(s => selectorMentionsKind(s, kind))) {
      ruleReasons.push(
        t('Rule "{{rule}}" matches {{constraints}}.', {
          rule: rule.name,
          constraints: describeConstraints(allSelectors, kind, t),
        })
      );
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
          t(
            'Rule "{{rule}}" also has an exclude block covering kind "{{kind}}"; a specific resource matching it would not actually be affected by this rule.',
            { rule: rule.name, kind }
          )
        );
      }
    }

    reasons.push(...ruleReasons);
  }

  if (reasons.length > 0) return reasons;
  return [
    t(
      'No rule in this policy explicitly lists kind "{{kind}}" in its match block; it was likely reached through a generated rule or a background scan.',
      { kind }
    ),
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
