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

import { render } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

/**
 * Render counter, incremented by the SimpleTable mock below.
 *
 * The guard throw is load-bearing: without it a regression makes React loop
 * indefinitely and the test run hangs rather than failing. Throwing converts
 * the hang into a readable failure.
 */
let renderCount = 0;
const RENDER_LIMIT = 300;

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  SectionBox: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SimpleTable: ({ data }: { data: { nameLabel: string }[] }) => {
    renderCount++;
    if (renderCount > RENDER_LIMIT) {
      throw new Error(`Render loop detected: SimpleTable rendered ${renderCount} times`);
    }
    return <div data-testid="traffic-table">{data.map(row => row.nameLabel).join(',')}</div>;
  },
}));

vi.mock('../../../../common/notifications/useNotify', () => ({
  useNotify: () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }),
}));

// The real hooks throw outside their providers. isEditMode: false is the default
// state and the only one in which the reset effect runs.
vi.mock('../../hooks/useKServiceEditMode', () => ({
  useKServiceEditMode: () => ({ isEditMode: false, setIsEditMode: vi.fn() }),
}));

// canPatchKService: true makes isReadOnly depend solely on isEditMode, which is the
// exact configuration that regressed.
vi.mock('../../permissions/KServicePermissionsProvider', () => ({
  useKServicePermissions: () => ({ canPatchKService: true, isLoading: false }),
}));

import TrafficSplittingSection from './TrafficSplittingSection';

function makeKService() {
  return {
    metadata: { name: 'hello', namespace: 'default' },
    cluster: 'c1',
    spec: { traffic: [{ latestRevision: true, percent: 100 }] },
    status: { latestReadyRevisionName: 'hello-00001', traffic: [] },
    patch: vi.fn(),
  };
}

function makeRevisions() {
  return [
    {
      metadata: {
        name: 'hello-00001',
        namespace: 'default',
        creationTimestamp: '2025-01-01T00:00:00Z',
      },
      status: { conditions: [{ type: 'Ready', status: 'True' }] },
    },
  ];
}

describe('TrafficSplittingSection', () => {
  beforeEach(() => {
    renderCount = 0;
  });

  /**
   * Regression: the reset effect used to list `resetSection` in its dependency array.
   * That function is redeclared every render, so the effect re-ran after every render,
   * and the state it writes (notably setPendingTagInputs({})) always had a fresh
   * identity, so React never bailed out. Every user opening a KService detail page —
   * isEditMode defaults to false — hit an unbounded re-render loop.
   */
  it('settles after mount in view mode instead of re-rendering forever', () => {
    render(
      <TrafficSplittingSection
        cluster="c1"
        kservice={makeKService() as never}
        revisions={makeRevisions() as never}
      />
    );

    // Settles at 2: initial render plus the one legitimate state write from the
    // mount-time reset. Asserting a small bound rather than an exact count leaves
    // headroom without hiding a regression.
    expect(renderCount).toBeLessThan(5);
  });

  /**
   * Guards against "fixing" the loop by deleting the effect: without it the section
   * never seeds its state from the KService and the total renders as 0%.
   */
  it('seeds traffic state from the KService on mount', () => {
    const { getByTestId, getByText } = render(
      <TrafficSplittingSection
        cluster="c1"
        kservice={makeKService() as never}
        revisions={makeRevisions() as never}
      />
    );

    expect(getByTestId('traffic-table').textContent).toBe('Latest Ready Revision,hello-00001');
    expect(getByText('Total: 100% (must equal 100%)')).toBeTruthy();
  });
});
