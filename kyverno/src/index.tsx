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

import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import {
  DeletingPolicyList,
  GeneratingPolicyList,
  MutatingPolicyList,
  ValidatingPolicyList,
} from './components/CELPolicyList';
import { CleanupPolicyList, ClusterCleanupPolicyList } from './components/CleanupPolicyList';
import { ClusterPolicyList } from './components/ClusterPolicyList';
import { ClusterPolicyReportList } from './components/ClusterPolicyReportList';
import { ImageValidatingPolicyList } from './components/ImageValidatingPolicyList';
import { PolicyList } from './components/PolicyList';
import { PolicyReportList } from './components/PolicyReportList';
import { ViolationsView } from './components/ViolationsView';

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
}

// Centralises the sidebar + route pair that every Kyverno page needs so each
// call site can stay one block. Later commits add an optional CRD-guard wrap
// at the call site; the helper itself stays presentation-agnostic.
export function registerKyvernoPage({
  name,
  parent,
  label,
  path,
  url,
  exact,
  icon,
  component,
}: KyvernoPageOptions) {
  registerSidebarEntry({ name, url: url ?? path, parent, label, icon });
  registerRoute({ path, sidebar: name, name, exact, component });
}

registerSidebarEntry({
  name: 'Kyverno',
  url: '/kyverno/clusterpolicies',
  icon: 'mdi:shield-check',
  parent: '',
  label: 'Kyverno',
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
  component: () => <ClusterPolicyList />,
});

registerKyvernoPage({
  name: 'Policies',
  parent: 'KyvernoPolicies',
  label: 'Policies',
  path: '/kyverno/policies',
  component: () => <PolicyList />,
});

registerKyvernoPage({
  name: 'ValidatingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Validating Policies',
  path: '/kyverno/validatingpolicies',
  component: () => <ValidatingPolicyList />,
});

registerKyvernoPage({
  name: 'MutatingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Mutating Policies',
  path: '/kyverno/mutatingpolicies',
  component: () => <MutatingPolicyList />,
});

registerKyvernoPage({
  name: 'GeneratingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Generating Policies',
  path: '/kyverno/generatingpolicies',
  component: () => <GeneratingPolicyList />,
});

registerKyvernoPage({
  name: 'DeletingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Deleting Policies',
  path: '/kyverno/deletingpolicies',
  component: () => <DeletingPolicyList />,
});

registerKyvernoPage({
  name: 'ImageValidatingPolicies',
  parent: 'KyvernoPolicies',
  label: 'Image Validating Policies',
  path: '/kyverno/imagevalidatingpolicies',
  component: () => <ImageValidatingPolicyList />,
});

registerKyvernoPage({
  name: 'ClusterCleanupPolicies',
  parent: 'KyvernoPolicies',
  label: 'Cluster Cleanup Policies',
  path: '/kyverno/clustercleanuppolicies',
  component: () => <ClusterCleanupPolicyList />,
});

registerKyvernoPage({
  name: 'CleanupPolicies',
  parent: 'KyvernoPolicies',
  label: 'Cleanup Policies',
  path: '/kyverno/cleanuppolicies',
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
  component: () => <PolicyReportList />,
});

registerKyvernoPage({
  name: 'ClusterPolicyReports',
  parent: 'KyvernoReports',
  label: 'Cluster Policy Reports',
  path: '/kyverno/clusterpolicyreports',
  component: () => <ClusterPolicyReportList />,
});

// --- Violations ---
registerKyvernoPage({
  name: 'KyvernoViolations',
  parent: 'Kyverno',
  label: 'Violations',
  path: '/kyverno/violations',
  component: () => <ViolationsView />,
});
