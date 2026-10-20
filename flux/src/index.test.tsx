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

import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.hoisted runs before module-level mocks are installed, so all mock
// references used inside `vi.mock` factories must be declared here.
const mocks = vi.hoisted(() => ({
  registerRoute: vi.fn(),
  registerSidebarEntry: vi.fn(),
  registerSidebarEntryFilter: vi.fn(),
  registerMapSource: vi.fn(),
  registerPluginSettings: vi.fn(),
  registerKindIcon: vi.fn(),
  registerFluxHeaderActionsProcessor: vi.fn(),
  registerHelmRelease: vi.fn(),
  addIcon: vi.fn(),
  getCluster: vi.fn(() => 'cluster-a'),
  ensureChecked: vi.fn(),
  // mutable from tests; default is 'unknown'.
  probeStatus: { current: 'unknown' as 'unknown' | 'installed' | 'absent' | 'error' },
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerRoute: mocks.registerRoute,
  registerSidebarEntry: mocks.registerSidebarEntry,
  registerSidebarEntryFilter: mocks.registerSidebarEntryFilter,
  registerMapSource: mocks.registerMapSource,
  registerPluginSettings: mocks.registerPluginSettings,
  registerKindIcon: mocks.registerKindIcon,
  addIcon: mocks.addIcon,
  Utils: { getCluster: mocks.getCluster },
}));

vi.mock('./checkFluxInstalled', () => ({
  checkFluxInstalled: mocks.ensureChecked,
  getFluxInstallStatus: () => mocks.probeStatus.current,
}));

vi.mock('./actions/headerActionsProcessor', () => ({
  registerFluxHeaderActionsProcessor: mocks.registerFluxHeaderActionsProcessor,
}));

vi.mock('./helm-releases/HelmReleaseSingle', () => ({
  registerHelmRelease: mocks.registerHelmRelease,
  FluxHelmReleaseDetailView: () => null,
}));

vi.mock('@iconify/react', () => ({
  addIcon: mocks.addIcon,
  Icon: () => null,
}));

// Component imports below are referenced by the route registrations; we only
// assert on the registration calls, so a thin stub is enough.
vi.mock('./flagger/canaries', () => ({ default: () => null }));
vi.mock('./flagger/canarydetails', () => ({ default: () => null }));
vi.mock('./helm-releases/HelmReleaseList', () => ({ HelmReleases: () => null }));
vi.mock('./image-automation/ImageAutomationList', () => ({ ImageAutomation: () => null }));
vi.mock('./image-automation/ImageAutomationSingle', () => ({
  FluxImageAutomationDetailView: () => null,
}));
vi.mock('./kustomizations/KustomizationList', () => ({ Kustomizations: () => null }));
vi.mock('./kustomizations/KustomizationSingle', () => ({
  FluxKustomizationDetailView: () => null,
}));
vi.mock('./mapView', () => ({ fluxSource: {} }));
vi.mock('./notifications/NotificationList', () => ({ Notifications: () => null }));
vi.mock('./notifications/NotificationSingle', () => ({ Notification: () => null }));
vi.mock('./overview', () => ({ FluxOverview: () => null }));
vi.mock('./runtime/RuntimeList', () => ({ FluxRunTime: () => null }));
vi.mock('./settings', () => ({ FluxSettings: () => null }));
vi.mock('./sources/SourceList', () => ({ FluxSources: () => null }));
vi.mock('./sources/SourceSingle', () => ({ FluxSourceDetailView: () => null }));
vi.mock('./terraforms/TerraformList', () => ({ TerraformList: () => null }));
vi.mock('./terraforms/TerraformSingle', () => ({ TerraformDetailView: () => null }));

// Static import triggers the module's top-level registration calls. vi.mock
// is hoisted above this so all mocks are ready when the module runs.
import './index';

function getSidebarFilter() {
  const call = mocks.registerSidebarEntryFilter.mock.calls[0];
  if (!call) {
    throw new Error('registerSidebarEntryFilter was not called');
  }
  return call[0] as (entry: {
    parent?: string;
    name: string;
  }) => { parent?: string; name: string } | null | undefined;
}

beforeEach(() => {
  mocks.probeStatus.current = 'unknown';
  mocks.ensureChecked.mockClear();
  mocks.getCluster.mockClear();
  mocks.getCluster.mockImplementation(() => 'cluster-a');
});

// Note: do NOT call vi.clearAllMocks() here. `import './index'` runs at
// module load time, which is when all `registerSidebarEntry` and
// `registerRoute` calls happen. Clearing them in afterEach would erase
// the evidence those smoke tests rely on.

describe('flux plugin sidebar filter (issue #972)', () => {
  it('registers a sidebar filter', () => {
    expect(mocks.registerSidebarEntryFilter).toHaveBeenCalledWith(expect.any(Function));
  });

  it("passes through entries that are not children of 'flux'", () => {
    const filter = getSidebarFilter();
    const entry = { name: 'workloads', parent: 'cluster-menu' };
    expect(filter(entry)).toEqual(entry);
  });

  it("always shows the 'flux' and 'overview' parent entries regardless of probe status", () => {
    const filter = getSidebarFilter();
    const fluxEntry = { name: 'flux', parent: null };
    const overviewEntry = { name: 'overview', parent: 'flux' };
    for (const status of ['unknown', 'installed', 'absent', 'error'] as const) {
      mocks.probeStatus.current = status;
      expect(filter(fluxEntry)).toEqual(fluxEntry);
      expect(filter(overviewEntry)).toEqual(overviewEntry);
    }
  });

  it("hides Flux child entries when the probe confirms Flux is 'absent'", () => {
    mocks.probeStatus.current = 'absent';
    const filter = getSidebarFilter();
    const entry = { name: 'kustomizations', parent: 'flux' };
    expect(filter(entry)).toBeNull();
  });

  // Regression test for issue #972: previously, the probe error callback
  // set the cache to `false`, which the sidebar filter interpreted as
  // "absent" and hid Flux children.
  it("keeps Flux child entries visible when the probe has not completed yet ('unknown')", () => {
    mocks.probeStatus.current = 'unknown';
    const filter = getSidebarFilter();
    const entry = { name: 'kustomizations', parent: 'flux' };
    expect(filter(entry)).toEqual(entry);
  });

  it("keeps Flux child entries visible when Flux is 'installed'", () => {
    mocks.probeStatus.current = 'installed';
    const filter = getSidebarFilter();
    const entry = { name: 'helmreleases', parent: 'flux' };
    expect(filter(entry)).toEqual(entry);
  });

  // The actual fix for issue #972: a failed probe must NOT hide the entries.
  it("keeps Flux child entries visible when the probe errored ('error') — issue #972", () => {
    mocks.probeStatus.current = 'error';
    const filter = getSidebarFilter();
    const entry = { name: 'sources', parent: 'flux' };
    expect(filter(entry)).toEqual(entry);
  });

  it('triggers a probe each time the filter runs for a Flux child entry', () => {
    mocks.probeStatus.current = 'unknown';
    const filter = getSidebarFilter();
    filter({ name: 'sources', parent: 'flux' });
    filter({ name: 'helmreleases', parent: 'flux' });
    expect(mocks.ensureChecked).toHaveBeenCalled();
  });

  it('does not trigger a probe for non-Flux-parent or always-visible entries', () => {
    mocks.probeStatus.current = 'unknown';
    const filter = getSidebarFilter();
    filter({ name: 'workloads', parent: 'cluster-menu' });
    filter({ name: 'flux', parent: null });
    filter({ name: 'overview', parent: 'flux' });
    expect(mocks.ensureChecked).not.toHaveBeenCalled();
  });

  it('passes the current cluster from Utils.getCluster() to the probe', () => {
    mocks.probeStatus.current = 'unknown';
    mocks.getCluster.mockImplementation(() => 'cluster-b');
    const filter = getSidebarFilter();
    filter({ name: 'sources', parent: 'flux' });
    expect(mocks.ensureChecked).toHaveBeenCalledWith('cluster-b');
  });
});

describe('flux plugin registration smoke tests', () => {
  it('registers the top-level Flux sidebar entry', () => {
    expect(mocks.registerSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'flux', label: 'Flux', parent: null })
    );
  });

  it('registers core Flux routes', () => {
    const registeredPaths = mocks.registerRoute.mock.calls.map(
      c => (c[0] as { path: string }).path
    );
    expect(registeredPaths).toContain('/flux/overview');
    expect(registeredPaths).toContain('/flux/kustomizations');
    expect(registeredPaths).toContain('/flux/sources');
  });

  it('registers the Flux icon for plugin settings and the Flux map source', () => {
    expect(mocks.addIcon).toHaveBeenCalledWith(
      'simple-icons:flux',
      expect.objectContaining({ width: 24, height: 24 })
    );
    expect(mocks.registerMapSource).toHaveBeenCalled();
    expect(mocks.registerPluginSettings).toHaveBeenCalledWith(
      '@headlamp-k8s/flux',
      expect.anything(),
      false
    );
    expect(mocks.registerFluxHeaderActionsProcessor).toHaveBeenCalled();
    expect(mocks.registerHelmRelease).toHaveBeenCalled();
  });
});
