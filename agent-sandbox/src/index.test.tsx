/*
 * Copyright 2026 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import './index';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

type SidebarEntry = { parent?: string; name: string };

const headlamp = vi.hoisted(() => ({
  selected: [] as string[],
  request: vi.fn(),
  refreshSidebar: vi.fn(),
  sidebarFilters: [] as ((entry: SidebarEntry) => SidebarEntry | null)[],
  routes: new Map<string, ComponentType>(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: headlamp.request },
  K8s: { useSelectedClusters: () => headlamp.selected },
  Router: {
    createRouteURL: () =>
      headlamp.selected.length ? `/c/${headlamp.selected.join('+')}/agent-sandbox/sandboxes` : '/',
  },
  Utils: {
    getClusterPrefixedPath: () => '/c/:cluster',
  },
  registerSidebarEntry: headlamp.refreshSidebar,
  registerSidebarEntryFilter: (filter: (entry: SidebarEntry) => SidebarEntry | null) => {
    headlamp.sidebarFilters.push(filter);
  },
  registerRoute: ({ path, component }: { path: string; component: ComponentType }) => {
    headlamp.routes.set(path, component);
  },
  useTranslation: () => ({ t: (key: string) => key, ready: true }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  EmptyContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Loader: () => <div role="progressbar" aria-label="Loading" />,
}));

vi.mock('./pages', () => ({
  SandboxList: () => <div>Sandbox list</div>,
  SandboxDetail: () => <div>Sandbox detail</div>,
  SandboxClaimList: () => <div>Claim list</div>,
  SandboxClaimDetail: () => <div>Claim detail</div>,
  SandboxWarmPoolList: () => <div>WarmPool list</div>,
  SandboxWarmPoolDetail: () => <div>WarmPool detail</div>,
  SandboxTemplateList: () => <div>Template list</div>,
  SandboxTemplateDetail: () => <div>Template detail</div>,
}));

function route(path: string) {
  const component = headlamp.routes.get(`/agent-sandbox/${path}`);
  if (!component) throw new Error(`Missing plugin route: ${path}`);
  return component;
}

function sidebarShows(name: string) {
  return headlamp.sidebarFilters.every(filter =>
    filter({ parent: 'agent-sandbox', name: `agent-sandbox-${name}` })
  );
}

const discoveryPath = '/apis/extensions.agents.x-k8s.io/v1beta1';
const unavailable = 'This extension is unavailable in the selected clusters.';
const discovered = (...names: string[]) => ({ resources: names.map(name => ({ name })) });
const extensionLinks = ['claims', 'warmpools', 'templates'];

beforeEach(() => {
  headlamp.request.mockReset();
  headlamp.refreshSidebar.mockClear();
});
afterEach(cleanup);

it('keeps the core list and detail available when extension discovery returns 404', async () => {
  headlamp.selected = ['core'];
  headlamp.request.mockRejectedValue({ status: 404 });
  const List = route('sandboxes');
  const Detail = route('sandboxes/:namespace/:name');
  const Claim = route('claims/:namespace/:name');

  const { rerender } = render(<List />);
  expect(screen.getByText('Sandbox list')).toBeTruthy();
  await waitFor(() => expect(headlamp.refreshSidebar).toHaveBeenCalledTimes(1));
  expect(headlamp.request).toHaveBeenCalledWith(discoveryPath, { cluster: 'core' }, false);
  expect(sidebarShows('sandboxes')).toBe(true);
  expect(extensionLinks.some(sidebarShows)).toBe(false);

  rerender(<Detail />);
  expect(screen.getByText('Sandbox detail')).toBeTruthy();

  rerender(<Claim />);
  expect(await screen.findByText(unavailable)).toBeTruthy();
  expect(screen.queryByText('Claim detail')).toBeNull();
});

it('shows a newly installed extension when reopening the plugin in the same cluster', async () => {
  headlamp.selected = ['install'];
  headlamp.request.mockRejectedValue({ status: 404 });
  const Sandbox = route('sandboxes');
  const Claim = route('claims');
  const { unmount } = render(<Sandbox />);
  await waitFor(() => expect(headlamp.refreshSidebar).toHaveBeenCalledTimes(1));
  expect(sidebarShows('claims')).toBe(false);
  unmount();

  headlamp.request.mockResolvedValue(discovered('sandboxclaims'));
  render(<Claim />);

  expect(await screen.findByText('Claim list')).toBeTruthy();
  expect(sidebarShows('claims')).toBe(true);
});

it('hides an extension removed while away from the plugin in the same cluster', async () => {
  headlamp.selected = ['remove'];
  headlamp.request.mockResolvedValue(discovered('sandboxclaims'));
  const Claim = route('claims');
  const { unmount } = render(<Claim />);
  expect(await screen.findByText('Claim list')).toBeTruthy();
  expect(sidebarShows('claims')).toBe(true);
  unmount();

  headlamp.request.mockRejectedValue({ status: 404 });
  render(<Claim />);

  expect(screen.queryByText('Claim list')).toBeNull();
  expect(await screen.findByText(unavailable)).toBeTruthy();
  expect(sidebarShows('claims')).toBe(false);
});

it('only exposes the extension kinds served by the cluster', async () => {
  headlamp.selected = ['partial'];
  headlamp.request.mockResolvedValue(discovered('sandboxclaims', 'sandboxtemplates/status'));
  const Claim = route('claims');

  render(<Claim />);
  expect(screen.getByRole('progressbar')).toBeTruthy();
  expect(await screen.findByText('Claim list')).toBeTruthy();
  expect(sidebarShows('claims')).toBe(true);
  expect(sidebarShows('warmpools')).toBe(false);
  expect(sidebarShows('templates')).toBe(false);
});

it('drops extension links and guards a deep link when switching to a core-only cluster', async () => {
  headlamp.selected = ['switch-full'];
  headlamp.request.mockResolvedValue(
    discovered('sandboxclaims', 'sandboxwarmpools', 'sandboxtemplates')
  );
  const Template = route('templates/:namespace/:name');
  const { rerender } = render(<Template />);

  expect(await screen.findByText('Template detail')).toBeTruthy();
  expect(extensionLinks.every(sidebarShows)).toBe(true);

  headlamp.request.mockRejectedValue({ status: 404 });
  headlamp.selected = ['switch-core'];
  rerender(<Template />);
  expect(screen.queryByText('Template detail')).toBeNull();
  expect(sidebarShows('templates')).toBe(false);
  expect(await screen.findByText(unavailable)).toBeTruthy();
});

it('only exposes extension views available in every selected cluster', async () => {
  headlamp.selected = ['group-a', 'group-b'];
  headlamp.request
    .mockResolvedValueOnce(discovered('sandboxclaims', 'sandboxwarmpools'))
    .mockResolvedValueOnce(discovered('sandboxclaims'));
  const Sandbox = route('sandboxes');

  render(<Sandbox />);
  await waitFor(() => expect(headlamp.refreshSidebar).toHaveBeenCalledTimes(1));
  expect(sidebarShows('claims')).toBe(true);
  expect(sidebarShows('warmpools')).toBe(false);

  headlamp.selected = ['group-b', 'group-a'];
  expect(sidebarShows('claims')).toBe(true);
});

it('hides extension links when the selected cluster group changes outside the plugin', async () => {
  headlamp.selected = ['selection-a'];
  headlamp.request.mockResolvedValue(discovered('sandboxclaims'));
  const Claim = route('claims');
  const { unmount } = render(<Claim />);
  expect(await screen.findByText('Claim list')).toBeTruthy();
  expect(sidebarShows('claims')).toBe(true);
  unmount();

  headlamp.selected = ['selection-a', 'selection-b'];
  expect(sidebarShows('claims')).toBe(false);
  expect(sidebarShows('sandboxes')).toBe(true);
});

it('distinguishes discovery failures from absent extensions', async () => {
  headlamp.selected = ['limited'];
  headlamp.request.mockRejectedValue({ status: 403 });
  const Claim = route('claims');

  render(<Claim />);
  expect(await screen.findByText('Could not discover Agent Sandbox extensions.')).toBeTruthy();
  expect(screen.queryByText('Claim list')).toBeNull();
  expect(sidebarShows('claims')).toBe(false);
});
