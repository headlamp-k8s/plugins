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

// Top-level sidebar entry
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

registerSidebarEntry({
  name: 'ClusterPolicies',
  url: '/kyverno/clusterpolicies',
  parent: 'KyvernoPolicies',
  label: 'Cluster Policies',
});

registerRoute({
  path: '/kyverno/clusterpolicies',
  sidebar: 'ClusterPolicies',
  name: 'ClusterPolicies',
  component: () => <ClusterPolicyList />,
});

registerSidebarEntry({
  name: 'Policies',
  url: '/kyverno/policies',
  parent: 'KyvernoPolicies',
  label: 'Policies',
});

registerRoute({
  path: '/kyverno/policies',
  sidebar: 'Policies',
  name: 'Policies',
  component: () => <PolicyList />,
});

registerSidebarEntry({
  name: 'ValidatingPolicies',
  url: '/kyverno/validatingpolicies',
  parent: 'KyvernoPolicies',
  label: 'Validating Policies',
});

registerRoute({
  path: '/kyverno/validatingpolicies',
  sidebar: 'ValidatingPolicies',
  name: 'ValidatingPolicies',
  component: () => <ValidatingPolicyList />,
});

registerSidebarEntry({
  name: 'MutatingPolicies',
  url: '/kyverno/mutatingpolicies',
  parent: 'KyvernoPolicies',
  label: 'Mutating Policies',
});

registerRoute({
  path: '/kyverno/mutatingpolicies',
  sidebar: 'MutatingPolicies',
  name: 'MutatingPolicies',
  component: () => <MutatingPolicyList />,
});

registerSidebarEntry({
  name: 'GeneratingPolicies',
  url: '/kyverno/generatingpolicies',
  parent: 'KyvernoPolicies',
  label: 'Generating Policies',
});

registerRoute({
  path: '/kyverno/generatingpolicies',
  sidebar: 'GeneratingPolicies',
  name: 'GeneratingPolicies',
  component: () => <GeneratingPolicyList />,
});

registerSidebarEntry({
  name: 'DeletingPolicies',
  url: '/kyverno/deletingpolicies',
  parent: 'KyvernoPolicies',
  label: 'Deleting Policies',
});

registerRoute({
  path: '/kyverno/deletingpolicies',
  sidebar: 'DeletingPolicies',
  name: 'DeletingPolicies',
  component: () => <DeletingPolicyList />,
});

registerSidebarEntry({
  name: 'ImageValidatingPolicies',
  url: '/kyverno/imagevalidatingpolicies',
  parent: 'KyvernoPolicies',
  label: 'Image Validating Policies',
});

registerRoute({
  path: '/kyverno/imagevalidatingpolicies',
  sidebar: 'ImageValidatingPolicies',
  name: 'ImageValidatingPolicies',
  component: () => <ImageValidatingPolicyList />,
});

registerSidebarEntry({
  name: 'ClusterCleanupPolicies',
  url: '/kyverno/clustercleanuppolicies',
  parent: 'KyvernoPolicies',
  label: 'Cluster Cleanup Policies',
});

registerRoute({
  path: '/kyverno/clustercleanuppolicies',
  sidebar: 'ClusterCleanupPolicies',
  name: 'ClusterCleanupPolicies',
  component: () => <ClusterCleanupPolicyList />,
});

registerSidebarEntry({
  name: 'CleanupPolicies',
  url: '/kyverno/cleanuppolicies',
  parent: 'KyvernoPolicies',
  label: 'Cleanup Policies',
});

registerRoute({
  path: '/kyverno/cleanuppolicies',
  sidebar: 'CleanupPolicies',
  name: 'CleanupPolicies',
  component: () => <CleanupPolicyList />,
});

// --- Reports group ---
registerSidebarEntry({
  name: 'KyvernoReports',
  url: '/kyverno/policyreports',
  parent: 'Kyverno',
  label: 'Reports',
});

registerSidebarEntry({
  name: 'PolicyReports',
  url: '/kyverno/policyreports',
  parent: 'KyvernoReports',
  label: 'Policy Reports',
});

registerRoute({
  path: '/kyverno/policyreports',
  sidebar: 'PolicyReports',
  name: 'PolicyReports',
  component: () => <PolicyReportList />,
});

registerSidebarEntry({
  name: 'ClusterPolicyReports',
  url: '/kyverno/clusterpolicyreports',
  parent: 'KyvernoReports',
  label: 'Cluster Policy Reports',
});

registerRoute({
  path: '/kyverno/clusterpolicyreports',
  sidebar: 'ClusterPolicyReports',
  name: 'ClusterPolicyReports',
  component: () => <ClusterPolicyReportList />,
});

// --- Violations ---
registerSidebarEntry({
  name: 'KyvernoViolations',
  url: '/kyverno/violations',
  parent: 'Kyverno',
  label: 'Violations',
});

registerRoute({
  path: '/kyverno/violations',
  sidebar: 'KyvernoViolations',
  name: 'KyvernoViolations',
  component: () => <ViolationsView />,
});
