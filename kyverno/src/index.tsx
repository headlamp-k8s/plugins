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

import {
  registerAppBarAction,
  registerPluginSettings,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import {
  DeletingPolicyList,
  GeneratingPolicyList,
  MutatingPolicyList,
  NamespacedDeletingPolicyList,
  NamespacedGeneratingPolicyList,
  NamespacedMutatingPolicyList,
  NamespacedValidatingPolicyList,
  ValidatingPolicyList,
} from './components/CELPolicyList';
import { CleanupPolicyList, ClusterCleanupPolicyList } from './components/CleanupPolicyList';
import { ClusterPolicyList } from './components/ClusterPolicyList';
import { ClusterPolicyReportList } from './components/ClusterPolicyReportList';
import { ComplianceBadge } from './components/ComplianceBadge';
import { CRDGroup, CRDGuard } from './components/CRDGuard';
import { Dashboard } from './components/Dashboard';
import {
  ImageValidatingPolicyList,
  NamespacedImageValidatingPolicyList,
} from './components/ImageValidatingPolicyList';
import { KyvernoReportList } from './components/KyvernoReportList';
import { PolicyExceptionList } from './components/PolicyExceptionList';
import { PolicyList } from './components/PolicyList';
import { PolicyReportList } from './components/PolicyReportList';
import { Settings } from './components/Settings';
import { ViolationsView } from './components/ViolationsView';
import { registerKyvernoIcon } from './kyvernoIcon';
import { ClusterEphemeralReport, EphemeralReport } from './resources/kyvernoReports';

registerKyvernoIcon();
registerPluginSettings('@headlamp-k8s/kyverno', Settings, true);

interface KyvernoPageOptions {
  /** Sidebar entry id; also reused as the route name. */
  name: string;
  /** Sidebar parent id. Pass '' for a top-level entry. */
  parent: string;
  /** Sidebar label. */
  label: string;
  /** Route path. */
  path: string;
  /** Sidebar URL — defaults to `path` when omitted. */
  url?: string;
  /** Match the path exactly (react-router `exact`). */
  exact?: boolean;
  /** Iconify icon name; only meaningful for top-level entries. */
  icon?: string;
  /** Component to render for the route. */
  component: () => JSX.Element;
  /** Required Kyverno CRD group — wraps the component in CRDGuard. */
  requires?: CRDGroup;
  /** Specific policies.kyverno.io/v1 resource name additionally required (see CRDGuard). */
  requiresResource?: string;
  /** Kind label and minimum version interpolated into CRDGuard's own translated message. */
  requiresResourceLabel?: string;
  requiresResourceVersion?: string;
}

// Centralises the sidebar + route pair that every Kyverno page needs so each
// call site stays one block. `requires` makes CRDGuard wrapping a single field
// instead of a per-call-site `<CRDGuard>` block.
export function registerKyvernoPage({
  name,
  parent,
  label,
  path,
  url,
  exact,
  icon,
  component,
  requires,
  requiresResource,
  requiresResourceLabel,
  requiresResourceVersion,
}: KyvernoPageOptions) {
  registerSidebarEntry({ name, url: url ?? path, parent, label, icon });
  const wrapped = requires
    ? () => (
        <CRDGuard
          requires={requires}
          requiresResource={requiresResource}
          requiresResourceLabel={requiresResourceLabel}
          requiresResourceVersion={requiresResourceVersion}
        >
          {component()}
        </CRDGuard>
      )
    : component;
  registerRoute({ path, sidebar: name, name, exact, component: wrapped });
}

registerSidebarEntry({
  name: 'Kyverno',
  url: '/kyverno',
  icon: 'kyverno:logo',
  parent: '',
  label: 'Kyverno',
});

// --- Dashboard ---
registerKyvernoPage({
  name: 'KyvernoOverview',
  parent: 'Kyverno',
  label: 'Overview',
  path: '/kyverno',
  exact: true,
  requires: 'legacy',
  component: () => <Dashboard />,
});

// --- Policies group ---
registerSidebarEntry({
  name: 'KyvernoPolicies',
  url: '/kyverno/clusterpolicies',
  parent: 'Kyverno',
  label: 'Policies',
});

registerKyvernoPage({
  name: 'ClusterPolicies',
  parent: 'KyvernoPolicies',
  label: 'Cluster Policies',
  path: '/kyverno/clusterpolicies',
  requires: 'legacy',
  component: () => <ClusterPolicyList />,
});

registerKyvernoPage({
  name: 'Policies',
  parent: 'KyvernoPolicies',
  label: 'Policies',
  path: '/kyverno/policies',
  requires: 'legacy',
  component: () => <PolicyList />,
});

registerKyvernoPage({
  name: 'ValidatingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Validating Policies',
  path: '/kyverno/validatingpolicies',
  requires: 'cel',
  component: () => <ValidatingPolicyList />,
});

registerKyvernoPage({
  name: 'MutatingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Mutating Policies',
  path: '/kyverno/mutatingpolicies',
  requires: 'cel',
  component: () => <MutatingPolicyList />,
});

registerKyvernoPage({
  name: 'GeneratingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Generating Policies',
  path: '/kyverno/generatingpolicies',
  requires: 'cel',
  component: () => <GeneratingPolicyList />,
});

registerKyvernoPage({
  name: 'DeletingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Deleting Policies',
  path: '/kyverno/deletingpolicies',
  requires: 'cel',
  component: () => <DeletingPolicyList />,
});

registerKyvernoPage({
  name: 'ImageValidatingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Image Validating Policies',
  path: '/kyverno/imagevalidatingpolicies',
  requires: 'cel',
  component: () => <ImageValidatingPolicyList />,
});

registerKyvernoPage({
  name: 'NamespacedValidatingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Namespaced Validating Policies',
  path: '/kyverno/namespacedvalidatingpolicies',
  requires: 'cel',
  requiresResource: 'namespacedvalidatingpolicies',
  requiresResourceLabel: 'NamespacedValidatingPolicy',
  requiresResourceVersion: '1.17',
  component: () => <NamespacedValidatingPolicyList />,
});

registerKyvernoPage({
  name: 'NamespacedMutatingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Namespaced Mutating Policies',
  path: '/kyverno/namespacedmutatingpolicies',
  requires: 'cel',
  requiresResource: 'namespacedmutatingpolicies',
  requiresResourceLabel: 'NamespacedMutatingPolicy',
  requiresResourceVersion: '1.17',
  component: () => <NamespacedMutatingPolicyList />,
});

registerKyvernoPage({
  name: 'NamespacedGeneratingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Namespaced Generating Policies',
  path: '/kyverno/namespacedgeneratingpolicies',
  requires: 'cel',
  requiresResource: 'namespacedgeneratingpolicies',
  requiresResourceLabel: 'NamespacedGeneratingPolicy',
  requiresResourceVersion: '1.17',
  component: () => <NamespacedGeneratingPolicyList />,
});

registerKyvernoPage({
  name: 'NamespacedDeletingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Namespaced Deleting Policies',
  path: '/kyverno/namespaceddeletingpolicies',
  requires: 'cel',
  requiresResource: 'namespaceddeletingpolicies',
  requiresResourceLabel: 'NamespacedDeletingPolicy',
  requiresResourceVersion: '1.17',
  component: () => <NamespacedDeletingPolicyList />,
});

registerKyvernoPage({
  name: 'NamespacedImageValidatingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Namespaced Image Validating Policies',
  path: '/kyverno/namespacedimagevalidatingpolicies',
  requires: 'cel',
  requiresResource: 'namespacedimagevalidatingpolicies',
  requiresResourceLabel: 'NamespacedImageValidatingPolicy',
  requiresResourceVersion: '1.17',
  component: () => <NamespacedImageValidatingPolicyList />,
});

registerKyvernoPage({
  name: 'ClusterCleanupPolicies',
  parent: 'KyvernoPolicies',
  label: 'Cluster Cleanup Policies',
  path: '/kyverno/clustercleanuppolicies',
  requires: 'cleanup',
  component: () => <ClusterCleanupPolicyList />,
});

registerKyvernoPage({
  name: 'CleanupPolicies',
  parent: 'KyvernoPolicies',
  label: 'Cleanup Policies',
  path: '/kyverno/cleanuppolicies',
  requires: 'cleanup',
  component: () => <CleanupPolicyList />,
});

// --- Reports group ---
registerSidebarEntry({
  name: 'KyvernoReports',
  url: '/kyverno/policyreports',
  parent: 'Kyverno',
  label: 'Reports',
});

registerKyvernoPage({
  name: 'PolicyReports',
  parent: 'KyvernoReports',
  label: 'Policy Reports',
  path: '/kyverno/policyreports',
  requires: 'reports',
  component: () => <PolicyReportList />,
});

registerKyvernoPage({
  name: 'ClusterPolicyReports',
  parent: 'KyvernoReports',
  label: 'Cluster Policy Reports',
  path: '/kyverno/clusterpolicyreports',
  requires: 'reports',
  component: () => <ClusterPolicyReportList />,
});

registerKyvernoPage({
  name: 'EphemeralReports',
  parent: 'KyvernoReports',
  label: 'Ephemeral Reports',
  path: '/kyverno/ephemeralreports',
  requires: 'ephemeralReports',
  component: () => (
    <KyvernoReportList
      titleKey="Ephemeral Reports"
      resourceClass={EphemeralReport}
      activityIdPrefix="kyverno-ephrpt"
    />
  ),
});

registerKyvernoPage({
  name: 'ClusterEphemeralReports',
  parent: 'KyvernoReports',
  label: 'Cluster Ephemeral Reports',
  path: '/kyverno/clusterephemeralreports',
  requires: 'ephemeralReports',
  component: () => (
    <KyvernoReportList
      titleKey="Cluster Ephemeral Reports"
      resourceClass={ClusterEphemeralReport}
      activityIdPrefix="kyverno-cephrpt"
    />
  ),
});

// --- Violations ---
registerKyvernoPage({
  name: 'KyvernoViolations',
  parent: 'Kyverno',
  label: 'Violations',
  path: '/kyverno/violations',
  requires: 'reports',
  component: () => <ViolationsView />,
});

// --- Exceptions ---
registerKyvernoPage({
  name: 'KyvernoExceptions',
  parent: 'Kyverno',
  label: 'Exceptions',
  path: '/kyverno/exceptions',
  requires: 'exceptions',
  component: () => <PolicyExceptionList />,
});

// --- App Bar ---
registerAppBarAction(ComplianceBadge);
