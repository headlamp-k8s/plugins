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

import { registerAppBarAction, registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import {
  DeletingPolicyList,
  GeneratingPolicyList,
  MutatingPolicyList,
  ValidatingPolicyList,
} from './components/CELPolicyList';
import { CleanupPolicyList, ClusterCleanupPolicyList } from './components/CleanupPolicyList';
import { ClusterPolicyList } from './components/ClusterPolicyList';
import { ClusterPolicyReportList } from './components/ClusterPolicyReportList';
import { ComplianceBadge } from './components/ComplianceBadge';
import { CRDGuard } from './components/CRDGuard';
import { Dashboard } from './components/Dashboard';
import { ImageValidatingPolicyList } from './components/ImageValidatingPolicyList';
import { PolicyExceptionList } from './components/PolicyExceptionList';
import { PolicyList } from './components/PolicyList';
import { PolicyReportList } from './components/PolicyReportList';
import { ViolationsView } from './components/ViolationsView';
import { registerKyvernoIcon } from './kyvernoIcon';

registerKyvernoIcon();

// Top-level sidebar entry
registerSidebarEntry({
  name: 'Kyverno',
  url: '/kyverno',
  icon: 'kyverno:logo',
  parent: '',
  label: 'Kyverno',
});

// --- Dashboard ---
registerSidebarEntry({
  name: 'KyvernoOverview',
  url: '/kyverno',
  parent: 'Kyverno',
  label: 'Overview',
});

registerRoute({
  path: '/kyverno',
  sidebar: 'KyvernoOverview',
  name: 'KyvernoOverview',
  exact: true,
  component: () => (
    <CRDGuard requires="legacy">
      <Dashboard />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="legacy">
      <ClusterPolicyList />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="legacy">
      <PolicyList />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="cel">
      <ValidatingPolicyList />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="cel">
      <MutatingPolicyList />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="cel">
      <GeneratingPolicyList />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="cel">
      <DeletingPolicyList />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="cel">
      <ImageValidatingPolicyList />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="cleanup">
      <ClusterCleanupPolicyList />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="cleanup">
      <CleanupPolicyList />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="reports">
      <PolicyReportList />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="reports">
      <ClusterPolicyReportList />
    </CRDGuard>
  ),
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
  component: () => (
    <CRDGuard requires="reports">
      <ViolationsView />
    </CRDGuard>
  ),
});

// --- Exceptions ---
registerSidebarEntry({
  name: 'KyvernoExceptions',
  url: '/kyverno/exceptions',
  parent: 'Kyverno',
  label: 'Exceptions',
});

registerRoute({
  path: '/kyverno/exceptions',
  sidebar: 'KyvernoExceptions',
  name: 'KyvernoExceptions',
  component: () => (
    <CRDGuard requires="exceptions">
      <PolicyExceptionList />
    </CRDGuard>
  ),
});

// --- App Bar ---
registerAppBarAction(ComplianceBadge);
