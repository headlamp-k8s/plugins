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

// Top-level sidebar entry (no route — child entries handle routing).
registerSidebarEntry({
  name: 'Kyverno',
  url: '/kyverno/policyreports',
  icon: 'mdi:shield-check',
  parent: '',
  label: 'Kyverno',
});

registerKyvernoPage({
  name: 'PolicyReports',
  parent: 'Kyverno',
  label: 'Policy Reports',
  path: '/kyverno/policyreports',
  component: () => <PolicyReportList />,
});

registerRoute({
  path: '/kyverno/policyreports/:namespace/:name',
  sidebar: 'PolicyReports',
  name: 'PolicyReport',
  component: () => <PolicyReportDetail />,
});

registerKyvernoPage({
  name: 'ClusterPolicyReports',
  parent: 'Kyverno',
  label: 'Cluster Policy Reports',
  path: '/kyverno/clusterpolicyreports',
  component: () => <ClusterPolicyReportList />,
});

registerRoute({
  path: '/kyverno/clusterpolicyreports/:name',
  sidebar: 'ClusterPolicyReports',
  name: 'ClusterPolicyReport',
  component: () => <ClusterPolicyReportDetail />,
});
