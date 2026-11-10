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
import { KyvernoClusterPolicy, KyvernoPolicy } from '../resources/kyvernoPolicy';
import { apiGroupOf, collectPolicyImpact, PolicyImpactSummary } from '../resources/policyImpact';
import { ClusterPolicyReport, POLICY_REPORT_SOURCE, PolicyReport } from '../resources/policyReport';
import { PolicyImpactNodeDetails } from './PolicyImpactNodeDetails';

// Per-policy cap on resource nodes written to the Map. Above this, the policy
// node's sidebar panel notes that results were clipped. Without a cap a single
// policy with hundreds of evaluated resources (a cluster-wide label check, for
// example) would flood the Map with synthetic nodes and make it unusable.
const MAX_RESOURCE_NODES_PER_POLICY = 50;

function policyStatusIcon(impact: PolicyImpactSummary) {
  if (impact.counts.fail + impact.counts.error > 0) {
    return (
      <Icon
        icon="mdi:shield-off"
        width="100%"
        height="100%"
        aria-label="failing"
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
        aria-label="warning"
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
        aria-label="passing"
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
        aria-label="skip"
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
      aria-label="no data"
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

  const action: string = policy?.spec?.validationFailureAction ?? 'Audit';
  const ruleCount: number = (policy?.spec?.rules ?? []).length;
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
    // Tuple-style useList (same as Dashboard.tsx) for KubeObject subclasses.
    const [clusterPolicies, clusterPoliciesErr] = KyvernoClusterPolicy.useList();
    const [policies, policiesErr] = KyvernoPolicy.useList();
    // Object-style useList for PolicyReport/ClusterPolicyReport (same as
    // ViolationsView.tsx, Dashboard.tsx, ComplianceBadge.tsx).
    const { items: policyReports } = PolicyReport.useList();
    const { items: clusterPolicyReports } = ClusterPolicyReport.useList();

    return useMemo(() => {
      // Return null only while both policy lists are genuinely loading (no data
      // AND no error). An error response resolves the query to null items; if we
      // treated that as "still loading" the Map source would spin indefinitely on
      // clusters where RBAC denies the policy list.
      if (clusterPolicies === null && policies === null && !clusterPoliciesErr && !policiesErr)
        return null;

      const nodes: any[] = [];
      const edges: any[] = [];
      // Keyed by the resource's UID (when present) or a stable name-based key,
      // shared across all policies so the same physical resource (Pod "foo")
      // appears once with one or more incoming edges rather than once per policy.
      const resourceNodeMap = new Map<string, any>();

      const allPolicies: Array<{ obj: KyvernoClusterPolicy | KyvernoPolicy; ns?: string }> = [
        ...(clusterPolicies ?? []).map(p => ({ obj: p, ns: undefined as string | undefined })),
        ...(policies ?? []).map(p => ({ obj: p, ns: p.metadata.namespace })),
      ];

      for (const { obj: policy, ns } of allPolicies) {
        const policyUid = policy.metadata.uid;
        if (!policyUid) continue;

        const impact = collectPolicyImpact(
          policy.metadata.name,
          POLICY_REPORT_SOURCE.legacy,
          policyReports,
          clusterPolicyReports,
          ns
        );

        nodes.push({
          id: policyUid,
          kubeObject: policy,
          weight: 2000,
          icon: policyStatusIcon(impact),
          data: {
            impact,
            // Signals to PolicyImpactNodeDetails that resources were clipped.
            clipped: impact.resources.length > MAX_RESOURCE_NODES_PER_POLICY,
          },
          detailsComponent: PolicyImpactNodeDetails,
        });

        const resourceSlice = impact.resources.slice(0, MAX_RESOURCE_NODES_PER_POLICY);
        for (const res of resourceSlice) {
          // UID when the report includes it (background-scan mode); otherwise
          // a stable key from kind/namespace/name, consistent with
          // collectPolicyImpact's own dedup key so the same resource hit by two
          // policies resolves to a single node in the Map.
          // Uses the same apiGroupOf helper as collectPolicyImpact so the fallback key
          // is computed identically in both places: group only (not full apiVersion),
          // so two references to the same resource that carry different served versions
          // of the same API group still resolve to a single node.
          const resourceId =
            res.uid ??
            `kyverno-res-${apiGroupOf(res.apiVersion)}/${res.kind ?? 'Unknown'}/${
              res.namespace ?? ''
            }/${res.name}`;

          if (!resourceNodeMap.has(resourceId)) {
            const subtitle = res.namespace
              ? `${res.kind ?? 'Unknown'} · ${res.namespace}`
              : res.kind ?? 'Unknown';
            resourceNodeMap.set(resourceId, {
              id: resourceId,
              label: res.name,
              subtitle,
              // No kubeObject here: the resource may no longer exist (deleted
              // after the report was written) or we simply don't have the live
              // object. Showing it as a synthetic node is the honest choice.
            });
          }

          edges.push({
            id: `${policyUid}-${resourceId}`,
            source: policyUid,
            target: resourceId,
          });
        }
      }

      nodes.push(...resourceNodeMap.values());

      return { nodes, edges };
    }, [
      clusterPolicies,
      clusterPoliciesErr,
      policies,
      policiesErr,
      policyReports,
      clusterPolicyReports,
    ]);
  },
};
