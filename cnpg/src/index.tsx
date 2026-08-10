/*
 * Copyright 2026 The Kubernetes Authors
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

import { addIcon } from '@iconify/react';
import {
  registerRoute,
  registerSidebarEntry,
  registerSidebarEntryFilter,
  Utils,
} from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { isCnpgInstalled } from './checks/isCnpgInstalled';
import { ClusterDetail } from './components/clusters/ClusterDetail';
import { ClustersList } from './components/clusters/ClustersList';
import { registerInsightsProvider } from './insights/registry';
import { rulesProvider } from './insights/rules';

// Phase 1 ships exactly one insights provider: the deterministic rules engine.
// It is registered here, at plugin load, rather than imported by the panel, so
// that adding a provider later is a registration and not a change to the UI.
registerInsightsProvider(rulesProvider);

// Neutral database glyph: the PostgreSQL elephant is a trademarked mark and is
// deliberately not reproduced here.
addIcon('custom:cnpg', {
  body: `<path fill="currentColor" d="M12 2C7.58 2 4 3.79 4 6v12c0 2.21 3.58 4 8 4s8-1.79 8-4V6c0-2.21-3.58-4-8-4m0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2s-6-1.5-6-2s2.13-2 6-2M6 8.61c1.46.86 3.61 1.39 6 1.39s4.54-.53 6-1.39V12c0 .5-2.13 2-6 2s-6-1.5-6-2zm0 6c1.46.86 3.61 1.39 6 1.39s4.54-.53 6-1.39V18c0 .5-2.13 2-6 2s-6-1.5-6-2z"/>`,
  width: 24,
  height: 24,
});

// The sidebar entry must be absent on clusters without CloudNativePG, so the
// plugin adds zero noise for non-CNPG users. The check is asynchronous, so
// results are cached per cluster and the filter re-runs as Headlamp re-renders
// the sidebar.
const installedByCluster: Record<string, boolean> = {};
const lastCheckedAt: Record<string, number> = {};
const inFlight: Record<string, boolean> = {};
const CHECK_TTL_MS = 30 * 1000;

async function refreshInstalledCheck(cluster: string) {
  const now = Date.now();
  const isFresh = now - (lastCheckedAt[cluster] ?? 0) < CHECK_TTL_MS;
  if (inFlight[cluster] || isFresh) {
    return;
  }

  inFlight[cluster] = true;
  try {
    installedByCluster[cluster] = await isCnpgInstalled(cluster);
    lastCheckedAt[cluster] = Date.now();
  } finally {
    inFlight[cluster] = false;
  }
}

registerSidebarEntryFilter(entry => {
  if (entry.name !== 'cnpg' && entry.parent !== 'cnpg') {
    return entry;
  }

  const cluster = Utils.getCluster() ?? '';
  void refreshInstalledCheck(cluster);

  // Hide only on a definite negative. While the check is pending the entry is
  // shown, so a slow API server does not make the plugin look broken.
  if (installedByCluster[cluster] === false) {
    return null;
  }

  return entry;
});

registerSidebarEntry({
  parent: null,
  name: 'cnpg',
  label: 'CloudNativePG',
  icon: 'custom:cnpg',
  url: '/cnpg/clusters',
});

registerSidebarEntry({
  parent: 'cnpg',
  name: 'cnpg-clusters',
  label: 'Clusters',
  url: '/cnpg/clusters',
});

registerRoute({
  path: '/cnpg/clusters',
  sidebar: 'cnpg-clusters',
  name: 'cnpg-clusters',
  exact: true,
  component: () => <ClustersList />,
});

registerRoute({
  path: '/cnpg/clusters/:namespace/:name',
  sidebar: 'cnpg-clusters',
  name: 'cnpg-cluster-details',
  exact: true,
  component: () => <ClusterDetail />,
});
