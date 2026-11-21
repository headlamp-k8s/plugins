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

import { addIcon } from '@iconify/react';
import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationDetail } from '../components/ApplicationDetail';
import { ApplicationList } from '../components/ApplicationList';
import { DeploymentDetail } from '../components/DeploymentDetail';
import { Overview } from '../components/Overview';
import { SettingsPage } from '../components/SettingsPage';

vi.mock('@iconify/react', () => ({
  addIcon: vi.fn(),
  Icon: () => null,
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerRoute: vi.fn(),
  registerSidebarEntry: vi.fn(),
}));

// Importing the entry point is what performs the registrations.
import '../index';

function sidebarEntryNames(): string[] {
  return vi.mocked(registerSidebarEntry).mock.calls.map(call => call[0].name);
}

function sidebarEntry(name: string) {
  return vi
    .mocked(registerSidebarEntry)
    .mock.calls.map(call => call[0])
    .find(entry => entry.name === name);
}

function route(path: string) {
  return vi
    .mocked(registerRoute)
    .mock.calls.map(call => call[0])
    .find(r => r.path === path);
}

function routePaths(): string[] {
  return vi.mocked(registerRoute).mock.calls.map(call => call[0].path);
}

describe('plugin registration', () => {
  it('registers the PipeCD sidebar section', () => {
    expect(sidebarEntryNames()).toContain('pipecd');
  });

  it('registers an Applications entry under it', () => {
    const entry = vi
      .mocked(registerSidebarEntry)
      .mock.calls.map(call => call[0])
      .find(call => call.name === 'pipecd-applications');

    expect(entry?.parent).toBe('pipecd');
  });

  it('registers the applications route', () => {
    expect(routePaths()).toContain('/pipecd/applications');
  });

  it('registers an Overview entry and route, and opens it from the section', () => {
    const entries = vi.mocked(registerSidebarEntry).mock.calls.map(call => call[0]);

    expect(entries.find(e => e.name === 'pipecd-overview')?.parent).toBe('pipecd');
    expect(entries.find(e => e.name === 'pipecd')?.url).toBe('/pipecd/overview');
    expect(routePaths()).toContain('/pipecd/overview');
  });

  // Custom sidebar icons have to be registered with addIcon and referenced by
  // name, the same way the other plugins in this repository do it.
  it('registers its icon with Iconify before using it', () => {
    expect(vi.mocked(addIcon)).toHaveBeenCalledWith('pipecd:logo', expect.anything());

    const root = vi
      .mocked(registerSidebarEntry)
      .mock.calls.map(call => call[0])
      .find(call => call.name === 'pipecd');

    expect(root?.icon).toBe('pipecd:logo');

    // Checking both calls happened is not enough: the entry would still point at
    // an unregistered name if the two were ever reordered. Compare the call
    // order so that reordering fails the test.
    expect(vi.mocked(addIcon).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(registerSidebarEntry).mock.invocationCallOrder[0]
    );
  });

  it('adds PipeCD as a top-level entry in the cluster sidebar', () => {
    const root = sidebarEntry('pipecd');

    expect(root?.parent).toBeNull();
    expect(root?.sidebar).toBe('IN-CLUSTER');
  });

  it.each([
    ['pipecd-overview', '/pipecd/overview'],
    ['pipecd-applications', '/pipecd/applications'],
    ['pipecd-settings', '/pipecd/settings'],
  ])('nests %s under PipeCD, pointing at %s', (name, url) => {
    const entry = sidebarEntry(name);

    expect(entry?.parent).toBe('pipecd');
    expect(entry?.url).toBe(url);
    expect(entry?.sidebar).toBe('IN-CLUSTER');
  });

  // Each sidebar entry must point at a registered route, or clicking it lands
  // on Headlamp's not-found page.
  it('registers a route for every sidebar link', () => {
    const urls = vi.mocked(registerSidebarEntry).mock.calls.map(call => call[0].url);

    for (const url of urls) {
      expect(route(url as string)).toBeDefined();
    }
  });

  it.each([
    ['/pipecd/overview', 'pipecd-overview', Overview],
    ['/pipecd/applications', 'pipecd-applications', ApplicationList],
    ['/pipecd/settings', 'pipecd-settings', SettingsPage],
    ['/pipecd/applications/:id', 'pipecd-applications', ApplicationDetail],
    ['/pipecd/deployments/:id', 'pipecd-applications', DeploymentDetail],
  ])('routes %s to its page and highlights %s', (path, sidebar, page) => {
    const r = route(path);

    expect(r?.sidebar).toBe(sidebar);
    expect(r?.exact).toBe(true);
    expect((r?.component as () => ReactElement)().type).toBe(page);
  });

  it('keeps every route behind authentication', () => {
    for (const call of vi.mocked(registerRoute).mock.calls) {
      expect(call[0].noAuthRequired).toBe(false);
    }
  });

  it('gives every route a unique name', () => {
    const names = vi.mocked(registerRoute).mock.calls.map(call => call[0].name);

    expect(new Set(names).size).toBe(names.length);
  });
});
