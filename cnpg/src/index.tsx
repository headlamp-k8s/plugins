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

import {
  registerRoute,
  registerSidebarEntry,
  registerSidebarEntryFilter,
  Utils,
} from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { InstalledVerdict } from './checks/discoveryVerdict';
import { isCnpgInstalled } from './checks/isCnpgInstalled';
import { ClusterDetail } from './components/clusters/ClusterDetail';
import { ClustersList } from './components/clusters/ClustersList';
import { registerInsightsProvider } from './insights/registry';
import { rulesProvider } from './insights/rules';

// Phase 1 ships exactly one insights provider: the deterministic rules engine.
// It is registered here, at plugin load, rather than imported by the panel, so
// that adding a provider later is a registration and not a change to the UI.
registerInsightsProvider(rulesProvider);

// The sidebar entry must be absent on clusters without CloudNativePG, so the
// plugin adds zero noise for non-CNPG users. The check is asynchronous, so
// results are cached per cluster and the filter re-runs as Headlamp re-renders
// the sidebar. A check that could not be answered caches as null and is retried
// once the TTL expires, so a blip costs a visible entry rather than a hidden one.
const installedByCluster: Record<string, InstalledVerdict> = {};
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
  } catch {
    // isCnpgInstalled handles its own failures, so reaching here means something
    // unforeseen. The verdict stays whatever it was — null on a first run, which
    // shows the entry — because a thrown error is not evidence of absence.
    installedByCluster[cluster] = installedByCluster[cluster] ?? null;
  } finally {
    // Stamped in `finally`, so a failed check backs off for the TTL like a
    // successful one. Stamping only on success lets a persistently failing
    // cluster re-fire the request on every sidebar render.
    lastCheckedAt[cluster] = Date.now();
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
  // A neutral database glyph from the icon set Headlamp already bundles. The
  // PostgreSQL elephant is a trademarked mark and is deliberately not used.
  icon: 'mdi:database-outline',
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
