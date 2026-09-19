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

// Hoisted test state: survives vi.mock factory hoisting and is accessible
// in both the mock body and test assertions.
const testState = vi.hoisted(() => ({
  tableRenderCount: 0,
  latestData: [] as Array<{ id?: string; percent?: number }>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children }: any) => children,
  SectionBox: ({ children }: any) => children,
  SimpleTable: ({ data }: any) => {
    testState.tableRenderCount += 1;
    testState.latestData = data;

    if (testState.tableRenderCount > 20) {
      throw new Error('TrafficSplittingSection render loop detected');
    }

    return null;
  },
}));

vi.mock('../../hooks/useKServiceEditMode', () => ({
  useKServiceEditMode: () => ({ isEditMode: false, setIsEditMode: () => {} }),
}));

vi.mock('../../permissions/KServicePermissionsProvider', () => ({
  useKServicePermissions: () => ({ canPatchKService: true, isLoading: false }),
}));

vi.mock('../../../../common/notifications/useNotify', () => ({
  useNotify: () => ({ notifySuccess: () => {}, notifyError: () => {} }),
}));

import TrafficSplittingSection from './TrafficSplittingSection';

// Minimal KService fixture.
function makeKService(): any {
  return {
    metadata: { name: 'hello', namespace: 'default', creationTimestamp: '2025-01-01T00:00:00Z' },
    spec: {
      traffic: [{ revisionName: 'hello-00001', percent: 100 }],
    },
    status: {
      traffic: [{ revisionName: 'hello-00001', percent: 100 }],
      latestReadyRevisionName: 'hello-00001',
      conditions: [{ type: 'Ready', status: 'True' }],
    },
    patch: vi.fn().mockResolvedValue({}),
  };
}

function makeRevisions(): any[] {
  return [
    {
      metadata: { name: 'hello-00001', creationTimestamp: '2025-01-01T00:00:00Z' },
      status: {
        conditions: [{ type: 'Ready', status: 'True', reason: 'Ready' }],
      },
    },
  ];
}

describe('TrafficSplittingSection', () => {
  beforeEach(() => {
    testState.tableRenderCount = 0;
    testState.latestData = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('settles in read-only mode without repeatedly resetting traffic state', () => {
    expect(() =>
      render(
        <TrafficSplittingSection
          cluster="test-cluster"
          kservice={makeKService()}
          revisions={makeRevisions()}
        />
      )
    ).not.toThrow();

    // The component rendered at least once and stayed below the loop guard.
    expect(testState.tableRenderCount).toBeGreaterThan(0);
    expect(testState.tableRenderCount).toBeLessThanOrEqual(20);

    // The component settled with the expected initialized traffic data.
    expect(testState.latestData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'hello-00001',
        }),
      ])
    );
  });
});
