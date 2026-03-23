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
import { ClusterPolicyReportDetail } from './components/ClusterPolicyReportDetail';
import { ClusterPolicyReportList } from './components/ClusterPolicyReportList';
import { PolicyReportDetail } from './components/PolicyReportDetail';
import { PolicyReportList } from './components/PolicyReportList';

// Top-level sidebar entry
registerSidebarEntry({
  name: 'Kyverno',
  url: '/kyverno/policyreports',
  icon: 'mdi:shield-check',
  parent: '',
  label: 'Kyverno',
});

// Policy Reports (namespaced)
registerSidebarEntry({
  name: 'PolicyReports',
  url: '/kyverno/policyreports',
  parent: 'Kyverno',
  label: 'Policy Reports',
});

registerRoute({
  path: '/kyverno/policyreports',
  sidebar: 'PolicyReports',
  name: 'PolicyReports',
  component: () => <PolicyReportList />,
});

registerRoute({
  path: '/kyverno/policyreports/:namespace/:name',
  sidebar: 'PolicyReports',
  name: 'PolicyReport',
  component: () => <PolicyReportDetail />,
});

// Cluster Policy Reports (cluster-scoped)
registerSidebarEntry({
  name: 'ClusterPolicyReports',
  url: '/kyverno/clusterpolicyreports',
  parent: 'Kyverno',
  label: 'Cluster Policy Reports',
});

registerRoute({
  path: '/kyverno/clusterpolicyreports',
  sidebar: 'ClusterPolicyReports',
  name: 'ClusterPolicyReports',
  component: () => <ClusterPolicyReportList />,
});

registerRoute({
  path: '/kyverno/clusterpolicyreports/:name',
  sidebar: 'ClusterPolicyReports',
  name: 'ClusterPolicyReport',
  component: () => <ClusterPolicyReportDetail />,
});
