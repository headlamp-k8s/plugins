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

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const registerHeadlampEventCallback = vi.fn();
const setEvent = vi.fn();
const useGlobalState = vi.fn(() => ({ event: null, setEvent }));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerHeadlampEventCallback: (callback: unknown) => registerHeadlampEventCallback(callback),
}));

vi.mock('../../pluginState', () => ({
  useGlobalState,
}));

/** Renders the handler and returns the callback it registered. */
async function getEventCallback() {
  const { default: HeadlampEventHandler } = await import('./HeadlampEventHandler');
  render(<HeadlampEventHandler />);
  await waitFor(() => expect(registerHeadlampEventCallback).toHaveBeenCalledTimes(1));
  return registerHeadlampEventCallback.mock.calls.at(-1)![0] as (event: {
    type: string;
    data?: unknown;
  }) => void;
}

const project = { id: 'my-project', namespaces: ['dev'], clusters: ['minikube'] };

describe('HeadlampEventHandler', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    useGlobalState.mockImplementation(() => ({ event: null, setEvent }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores the project list from the project list view event', async () => {
    const callback = await getEventCallback();

    callback({ type: 'headlamp.project-list-view', data: { projects: [project] } });

    expect(setEvent).toHaveBeenCalledWith({
      type: 'headlamp.project-list-view',
      title: 'Projects',
      projects: [project],
    });
  });

  it('keeps one active callback through StrictMode rerenders and removes it on unmount', async () => {
    const { default: HeadlampEventHandler } = await import('./HeadlampEventHandler');
    const { rerender, unmount } = render(
      <React.StrictMode>
        <HeadlampEventHandler />
      </React.StrictMode>
    );
    await waitFor(() => expect(registerHeadlampEventCallback).toHaveBeenCalledTimes(1));
    const callback = registerHeadlampEventCallback.mock.calls[0][0] as (event: {
      type: string;
      data?: unknown;
    }) => void;

    rerender(
      <React.StrictMode>
        <HeadlampEventHandler />
      </React.StrictMode>
    );
    callback({ type: 'headlamp.project-list-view', data: { projects: [project] } });

    expect(registerHeadlampEventCallback).toHaveBeenCalledTimes(1);
    expect(setEvent).toHaveBeenCalledTimes(1);

    unmount();
    setEvent.mockClear();
    callback({ type: 'headlamp.project-list-view', data: { projects: [project] } });

    expect(setEvent).not.toHaveBeenCalled();
  });

  it('dispatches to a snapshot when a subscriber unmounts another subscriber', async () => {
    const firstSetEvent = vi.fn();
    const secondSetEvent = vi.fn();
    useGlobalState
      .mockReturnValueOnce({ event: null, setEvent: firstSetEvent })
      .mockReturnValueOnce({ event: null, setEvent: secondSetEvent });
    const { default: HeadlampEventHandler } = await import('./HeadlampEventHandler');
    render(<HeadlampEventHandler />);
    const secondHandler = render(<HeadlampEventHandler />);
    await waitFor(() => expect(registerHeadlampEventCallback).toHaveBeenCalledTimes(1));
    firstSetEvent.mockImplementation(() => secondHandler.unmount());
    const callback = registerHeadlampEventCallback.mock.calls[0][0] as (event: {
      type: string;
      data?: unknown;
    }) => void;

    callback({ type: 'headlamp.project-list-view', data: { projects: [project] } });

    expect(firstSetEvent).toHaveBeenCalledTimes(1);
    expect(secondSetEvent).toHaveBeenCalledTimes(1);
  });

  it('continues dispatching when a subscriber throws', async () => {
    const error = new Error('subscriber failed');
    const firstSetEvent = vi.fn(() => {
      throw error;
    });
    const secondSetEvent = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    useGlobalState
      .mockReturnValueOnce({ event: null, setEvent: firstSetEvent })
      .mockReturnValueOnce({ event: null, setEvent: secondSetEvent });
    const { default: HeadlampEventHandler } = await import('./HeadlampEventHandler');
    render(<HeadlampEventHandler />);
    render(<HeadlampEventHandler />);
    await waitFor(() => expect(registerHeadlampEventCallback).toHaveBeenCalledTimes(1));
    const callback = registerHeadlampEventCallback.mock.calls[0][0] as (event: {
      type: string;
      data?: unknown;
    }) => void;

    callback({ type: 'headlamp.project-list-view', data: { projects: [project] } });

    expect(secondSetEvent).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith('Failed to handle Headlamp event:', error);
  });

  it('defaults to an empty project list when none are provided', async () => {
    const callback = await getEventCallback();

    callback({ type: 'headlamp.project-list-view', data: {} });

    expect(setEvent).toHaveBeenCalledWith(expect.objectContaining({ projects: [] }));
  });

  it('stores the project and its resources from the project details view event', async () => {
    const callback = await getEventCallback();
    const resources = [{ kind: 'Pod', metadata: { name: 'api' } }];

    callback({ type: 'headlamp.project-details-view', data: { project, resources } });

    expect(setEvent).toHaveBeenCalledWith({
      type: 'headlamp.project-details-view',
      title: 'Project: my-project',
      project,
      resources,
    });
  });

  it('tracks the selected and previous tab on tab change', async () => {
    const callback = await getEventCallback();

    callback({
      type: 'headlamp.project-details-tab-change',
      data: {
        project,
        tab: { id: 'workloads', label: 'Workloads' },
        previousTab: { id: 'overview', label: 'Overview' },
        resources: [],
      },
    });

    expect(setEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'headlamp.project-details-tab-change',
        projectTab: 'Workloads',
        previousProjectTab: 'Overview',
      })
    );
  });

  it('falls back to the tab id when the label is not a string', async () => {
    const callback = await getEventCallback();

    callback({
      type: 'headlamp.project-details-tab-change',
      data: {
        project,
        tab: { id: 'workloads', label: React.createElement('span', null, 'Workloads') },
        previousTab: { id: 'overview' },
        resources: [],
      },
    });

    expect(setEvent).toHaveBeenCalledWith(
      expect.objectContaining({ projectTab: 'workloads', previousProjectTab: 'overview' })
    );
  });

  it('records project creation and deletion', async () => {
    const callback = await getEventCallback();

    callback({ type: 'headlamp.create-project', data: { project, status: 'CONFIRMED' } });
    expect(setEvent).toHaveBeenCalledWith({
      type: 'headlamp.create-project',
      title: 'Project: my-project',
      project,
    });

    callback({
      type: 'headlamp.delete-project',
      data: { project, deleteNamespaces: true, status: 'CONFIRMED' },
    });
    expect(setEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'headlamp.delete-project', deleteNamespaces: true })
    );
  });

  it('ignores unrelated events', async () => {
    const callback = await getEventCallback();

    callback({ type: 'headlamp.plugins-loaded', data: {} });

    expect(setEvent).not.toHaveBeenCalled();
  });
});
