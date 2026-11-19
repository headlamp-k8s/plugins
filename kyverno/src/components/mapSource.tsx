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

import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';
import {
  effectiveEnforcementAction,
  KyvernoClusterPolicy,
  KyvernoPolicy,
} from '../resources/kyvernoPolicy';
import { apiGroupOf, collectPolicyImpact, PolicyImpactSummary } from '../resources/policyImpact';
import {
  ClusterPolicyReport,
  POLICY_REPORT_SOURCE,
  PolicyReport,
  PolicyReportInterface,
  PolicyReportResult,
} from '../resources/policyReport';
import { PolicyImpactNodeDetails } from './PolicyImpactNodeDetails';

// Per-policy cap on resource nodes written to the Map. Above this, the policy
// node's sidebar panel notes that results were clipped. Without a cap a single
// policy with hundreds of evaluated resources (a cluster-wide label check, for
// example) would flood the Map with synthetic nodes and make it unusable.
const MAX_RESOURCE_NODES_PER_POLICY = 50;

function policyStatusIcon(impact: PolicyImpactSummary, t: (key: string) => string) {
  if (impact.counts.fail + impact.counts.error > 0) {
    return (
      <Icon
        icon="mdi:shield-off"
        width="100%"
        height="100%"
        aria-hidden={false}
        aria-label={t('Fail')}
        style={{ color: 'rgb(211, 47, 47)' }}
      />
    );
  }
  if (impact.counts.warn > 0) {
    return (
      <Icon
        icon="mdi:shield-alert"
        width="100%"
        height="100%"
        aria-hidden={false}
        aria-label={t('Warn')}
        style={{ color: 'rgb(237, 108, 2)' }}
      />
    );
  }
  if (impact.counts.pass > 0) {
    return (
      <Icon
        icon="mdi:shield-check"
        width="100%"
        height="100%"
        aria-hidden={false}
        aria-label={t('Pass')}
        style={{ color: 'rgb(46, 125, 50)' }}
      />
    );
  }
  if (impact.counts.skip > 0) {
    // Resources were evaluated but skipped (e.g. exempted by a PolicyException).
    // Not a failure, but not no-data either: distinct aria-label for screen readers.
    return (
      <Icon
        icon="mdi:shield-outline"
        width="100%"
        height="100%"
        aria-hidden={false}
        aria-label={t('Skip')}
        style={{ color: 'rgb(120, 120, 120)' }}
      />
    );
  }
  // No evaluated resources yet (all counts zero).
  return (
    <Icon
      icon="mdi:shield-outline"
      width="100%"
      height="100%"
      aria-hidden={false}
      aria-label={t('No data')}
      style={{ color: 'rgb(120, 120, 120)' }}
    />
  );
}

/**
 * Hover glance shown when any Kyverno ClusterPolicy or Policy node is hovered
 * in the Map view. Registered globally via registerKubeObjectGlance, so it
 * must check the apiVersion before rendering to avoid acting on a same-named
 * resource from another controller (e.g. NetworkPolicy).
 *
 * Shows only information available on the kubeObject itself (enforcement
 * action, rule count, ready state) so it renders instantly without waiting on
 * any additional data fetch. If the node's pre-computed impact data is
 * available (i.e. it came from kyvernoMapSource) we also show a compact
 * pass/fail ratio.
 */
export function KyvernoPolicyGlance({ node }: { node: any }) {
  const { t } = useTranslation();
  const policy = node.kubeObject;

  const apiVersion: string | undefined = policy?.jsonData?.apiVersion ?? policy?.apiVersion;
  if (apiVersion !== 'kyverno.io/v1') return null;

  const kind: string | undefined = policy?.kind ?? policy?.jsonData?.kind;
  if (kind !== 'ClusterPolicy' && kind !== 'Policy') return null;

  const spec = policy?.jsonData?.spec ?? policy?.spec;
  const action = effectiveEnforcementAction(spec);
  const ruleCount: number = (spec?.rules ?? []).length;
  const impact = node.data?.impact;

  return (
    <Box sx={{ p: 0.5, minWidth: 140 }}>
      <Typography variant="caption" display="block">
        {t('Enforcement')}: {action}
      </Typography>
      <Typography variant="caption" display="block">
        {t('{{count}} rules', { count: ruleCount })}
      </Typography>
      {impact && (
        <Typography variant="caption" display="block">
          {impact.counts.pass}/{impact.resources.length} {t('passing')}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Headlamp Map view source for Kyverno policies.
 *
 * Registers ClusterPolicy and Policy objects as nodes in the general-purpose
 * cluster graph, each connected by edges to the resources Kyverno actually
 * evaluated against it (read from PolicyReport/ClusterPolicyReport data via
 * collectPolicyImpact, not a re-implementation of Kyverno's match engine).
 *
 * Nodes are color-coded by worst-status: red (fail/error), yellow (warn),
 * green (pass-only), grey (no reports yet).
 *
 * Resource nodes for the same physical Kubernetes object are deduplicated by
 * UID across all policies so that a resource evaluated by multiple policies
 * appears once with multiple incoming edges, one per policy.
 *
 * Scoped to POLICY_REPORT_SOURCE.legacy (kyverno.io/v1 ClusterPolicy/Policy).
 * CEL ValidatingPolicy/MutatingPolicy etc. are omitted for now: they use a
 * different spec shape and need separate calls to describeCELMatchReasons,
 * which is a straightforward extension but one best done with a live CEL
 * cluster to verify before shipping.
 */
export const kyvernoMapSource = {
  id: 'kyverno',
  label: 'Kyverno',
  icon: <Icon icon="kyverno:logo" width="100%" height="100%" />,

  useData() {
    const [clusterPolicies, clusterPoliciesErr] = KyvernoClusterPolicy.useList();
    const [policies, policiesErr] = KyvernoPolicy.useList();
    const { items: policyReports, errors: prErrors } = PolicyReport.useList();
    const { items: clusterPolicyReports, errors: cprErrors } = ClusterPolicyReport.useList();
    const { t } = useTranslation();

    return useMemo(() => {
      // Return null only while both policy lists are genuinely loading (no data
      // AND no error). An error response resolves the query to null items; if we
      // treated that as "still loading" the Map source would spin indefinitely on
      // clusters where RBAC denies the policy list.
      if (clusterPolicies === null && policies === null && !clusterPoliciesErr && !policiesErr)
        return null;
      // Also hold while report lists are loading so the first render never flashes
      // "0/0 passing" or "No evaluated resources yet." before reports arrive.
      // Once either report query errors, we proceed and surface the error.
      if ((policyReports === null || clusterPolicyReports === null) && !prErrors && !cprErrors)
        return null;

      // Surface the first report-fetch error so the sidebar can show it instead
      // of silently presenting an empty "No evaluated resources yet." (finding 3).
      const reportError =
        prErrors?.find(Boolean)?.message ?? cprErrors?.find(Boolean)?.message ?? undefined;

      const nodes: any[] = [];
      const edges: any[] = [];
      // Keyed by resource UID or stable name-based key so the same physical
      // resource appears once with multiple incoming edges, one per policy.
      const resourceNodeMap = new Map<string, any>();

      // In multi-cluster mode Headlamp attaches a .cluster property to every
      // KubeObject; fall back to '' for single-cluster where it is absent.
      const clusterOf = (obj: any): string => obj?.cluster ?? '';

      const allPolicies: Array<{
        obj: KyvernoClusterPolicy | KyvernoPolicy;
        ns?: string;
        cluster: string;
      }> = [
        ...(clusterPolicies ?? []).map(p => ({
          obj: p,
          ns: undefined as string | undefined,
          cluster: clusterOf(p),
        })),
        ...(policies ?? []).map(p => ({
          obj: p,
          ns: p.metadata.namespace,
          cluster: clusterOf(p),
        })),
      ];

      // Pre-bucket report results by cluster + qualified policy name.
      // Key format: "<cluster>::<qualifiedName>" where qualifiedName matches
      // what Kyverno writes into result.policy (namespace/name or bare name).
      // Buckets store pre-filtered fragments (not whole reports) to avoid the
      // O(policies × total results) quadratic scan when a report covers many policies.
      // Results are grouped in a single pass per report (O(N)) rather than
      // re-filtering per policy name (O(N×M)). The cast is safe: collectPolicyImpact
      // only reads .results, .scope, and .jsonData.metadata.namespace.
      type ReportFragment = {
        results: PolicyReportResult[];
        scope: PolicyReportInterface['scope'];
        jsonData: { metadata: { namespace?: string } };
      };
      const prByPolicy = new Map<string, ReportFragment[]>();
      const cprByPolicy = new Map<string, ReportFragment[]>();
      for (const report of policyReports ?? []) {
        const cluster = clusterOf(report);
        const grouped = new Map<string, PolicyReportResult[]>();
        for (const result of report.results) {
          const list = grouped.get(result.policy) ?? [];
          list.push(result);
          grouped.set(result.policy, list);
        }
        for (const [name, results] of grouped) {
          const key = `${cluster}::${name}`;
          const bucket = prByPolicy.get(key) ?? [];
          bucket.push({
            results,
            scope: report.scope,
            jsonData: { metadata: { namespace: report.jsonData.metadata.namespace } },
          });
          prByPolicy.set(key, bucket);
        }
      }
      for (const report of clusterPolicyReports ?? []) {
        const cluster = clusterOf(report);
        const grouped = new Map<string, PolicyReportResult[]>();
        for (const result of report.results) {
          const list = grouped.get(result.policy) ?? [];
          list.push(result);
          grouped.set(result.policy, list);
        }
        for (const [name, results] of grouped) {
          const key = `${cluster}::${name}`;
          const bucket = cprByPolicy.get(key) ?? [];
          bucket.push({
            results,
            scope: report.scope,
            jsonData: { metadata: { namespace: undefined } },
          });
          cprByPolicy.set(key, bucket);
        }
      }

      // Pre-compute all policy impacts so we can build a cross-policy UID map
      // before emitting any graph nodes (finding 5).
      const policyImpacts = allPolicies
        .filter(({ obj: policy }) => !!policy.metadata.uid)
        .map(({ obj: policy, ns, cluster }) => {
          const qualifiedName = ns ? `${ns}/${policy.metadata.name}` : policy.metadata.name;
          const bucketKey = `${cluster}::${qualifiedName}`;
          return {
            policy,
            cluster,
            impact: collectPolicyImpact(
              policy.metadata.name,
              POLICY_REPORT_SOURCE.legacy,
              (prByPolicy.get(bucketKey) ?? []) as unknown as PolicyReport[],
              (cprByPolicy.get(bucketKey) ?? []) as unknown as ClusterPolicyReport[],
              ns
            ),
          };
        });

      // Sort each policy's resources worst-status-first so the 50-node cap and
      // the sidebar's top-5 list both prioritize failures over passing resources.
      const statusPriority = { error: 4, fail: 3, warn: 2, skip: 1, pass: 0 } as const;
      for (const { impact } of policyImpacts) {
        impact.resources.sort((a, b) => statusPriority[b.status] - statusPriority[a.status]);
      }

      // Build a cross-policy nameKey → UID map so the same physical resource
      // resolves to one node even when different policies' reports mix UID-carrying
      // and UID-less references for the same object. Keys are cluster-scoped so
      // same-named resources from different clusters stay separate.
      const crossPolicyUids = new Map<string, string>();
      for (const { impact, cluster } of policyImpacts) {
        for (const res of impact.resources) {
          if (res.uid) {
            const nameKey = `${cluster}::kyverno-res-${apiGroupOf(res.apiVersion)}/${
              res.kind ?? 'Unknown'
            }/${res.namespace ?? ''}/${res.name}`;
            if (!crossPolicyUids.has(nameKey)) crossPolicyUids.set(nameKey, res.uid);
          }
        }
      }

      for (const { policy, cluster, impact } of policyImpacts) {
        const policyUid = policy.metadata.uid!;

        nodes.push({
          id: policyUid,
          kubeObject: policy,
          weight: 2000,
          icon: policyStatusIcon(impact, t),
          status:
            impact.counts.fail + impact.counts.error > 0
              ? 'error'
              : impact.counts.warn > 0
              ? 'warning'
              : 'success',
          data: {
            impact,
            clipped: impact.resources.length > MAX_RESOURCE_NODES_PER_POLICY,
            reportError,
          },
          detailsComponent: PolicyImpactNodeDetails,
        });

        const resourceSlice = impact.resources.slice(0, MAX_RESOURCE_NODES_PER_POLICY);
        for (const res of resourceSlice) {
          // Uses apiGroupOf (same as collectPolicyImpact) so the fallback key is
          // computed identically in both places. Keys are cluster-scoped so
          // resources from different clusters never share a node.
          const nameKey = `${cluster}::kyverno-res-${apiGroupOf(res.apiVersion)}/${
            res.kind ?? 'Unknown'
          }/${res.namespace ?? ''}/${res.name}`;
          // UIDs are UUID v4 and globally unique in practice; use them bare to
          // let policyNodeIds dedup work without adding a cluster prefix.
          const resourceId = res.uid ?? crossPolicyUids.get(nameKey) ?? nameKey;

          if (!resourceNodeMap.has(resourceId)) {
            const subtitle = res.namespace
              ? `${res.kind ?? 'Unknown'} · ${res.namespace}`
              : res.kind ?? 'Unknown';
            resourceNodeMap.set(resourceId, {
              id: resourceId,
              label: res.name,
              subtitle,
            });
          }

          edges.push({
            id: `${policyUid}-${resourceId}`,
            source: policyUid,
            target: resourceId,
          });
        }
      }

      // Filter out synthetic resource nodes whose IDs match a policy node: when a
      // policy evaluates another Policy/ClusterPolicy, its UID appears in both the
      // policy node list (with icon and details) and the resourceNodeMap (label-only).
      // Keep the richer policy node and drop the duplicate label-only entry.
      const policyNodeIds = new Set(policyImpacts.map(({ policy }) => policy.metadata.uid));
      nodes.push(...Array.from(resourceNodeMap.values()).filter(n => !policyNodeIds.has(n.id)));

      return { nodes, edges };
    }, [
      clusterPolicies,
      clusterPoliciesErr,
      policies,
      policiesErr,
      policyReports,
      prErrors,
      clusterPolicyReports,
      cprErrors,
      t,
    ]);
  },
};
