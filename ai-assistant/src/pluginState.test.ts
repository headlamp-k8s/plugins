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

/**
 * Regression tests for: "the AI panel opens automatically without clicking it".
 *
 * Root cause: pluginState.tsx was initialising isUIPanelOpen from the stored
 * config (`conf?.isUIPanelOpen ?? false`), and setIsUIPanelOpen was persisting
 * the state back to pluginStore. So if the user had the panel open when they
 * last visited, it would auto-open on the next page load and immediately start
 * a diagnosis cycle visible to the user.
 *
 * Fix: isUIPanelOpen always starts as false (the useState initialiser no longer
 * reads from conf) and setIsUIPanelOpen no longer writes to pluginStore.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks for pluginState.tsx dependencies
// ---------------------------------------------------------------------------

const mockStoreUpdate = vi.fn();
const mockStoreData: Record<string, unknown> = {};

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ConfigStore: class {
    get() {
      return mockStoreData;
    }
    update(patch: Record<string, unknown>) {
      mockStoreUpdate(patch);
    }
    useConfig() {
      return () => mockStoreData;
    }
  },
}));

vi.mock('@headlamp-k8s/ai-common/tools/catalog/discoverTools', () => ({
  getAllAvailableToolsIncludingMCP: async () => [],
  initializeToolsState: async () => [],
}));

vi.mock('@headlamp-k8s/ai-common/providers/savedConfigs', () => ({}));
vi.mock('@headlamp-k8s/ai-ui/components/settings/DeveloperSettings', () => ({}));
vi.mock('@headlamp-k8s/ai-ui/components/settings/MCPSettings', () => ({}));

vi.mock('use-between', () => ({
  useBetween: (fn: () => unknown) => fn(),
}));

// Import AFTER mocks are declared
const { useGlobalState } = await import('./pluginState');

describe('isUIPanelOpen — always starts closed', () => {
  beforeEach(() => {
    mockStoreUpdate.mockClear();
  });

  it('is false on first render when store has no isUIPanelOpen field', async () => {
    delete mockStoreData.isUIPanelOpen;
    const { result } = renderHook(() => useGlobalState());
    await waitFor(() => expect(result.current.toolsInitialized).toBe(true));
    expect(result.current.isUIPanelOpen).toBe(false);
  });

  it('is false even when store has isUIPanelOpen: true', async () => {
    // Regression: previously conf?.isUIPanelOpen ?? false would return true here,
    // causing the panel to auto-open on page load.
    mockStoreData.isUIPanelOpen = true;
    const { result } = renderHook(() => useGlobalState());
    await waitFor(() => expect(result.current.toolsInitialized).toBe(true));
    expect(result.current.isUIPanelOpen).toBe(false);
  });
});

describe('setIsUIPanelOpen — does not persist to store', () => {
  beforeEach(() => {
    mockStoreUpdate.mockClear();
    delete mockStoreData.isUIPanelOpen;
  });

  it('does not call pluginStore.update when panel is opened', async () => {
    const { result } = renderHook(() => useGlobalState());
    await waitFor(() => expect(result.current.toolsInitialized).toBe(true));

    act(() => {
      result.current.setIsUIPanelOpen(true);
    });

    // Regression: previously this would call pluginStore.update({ isUIPanelOpen: true }),
    // causing the panel to auto-open on the next page load.
    const updateCallsWithPanelState = mockStoreUpdate.mock.calls.filter(([patch]) =>
      Object.prototype.hasOwnProperty.call(patch, 'isUIPanelOpen')
    );
    expect(updateCallsWithPanelState).toHaveLength(0);
  });

  it('updates React state when panel is opened', async () => {
    const { result } = renderHook(() => useGlobalState());
    await waitFor(() => expect(result.current.toolsInitialized).toBe(true));

    act(() => {
      result.current.setIsUIPanelOpen(true);
    });

    expect(result.current.isUIPanelOpen).toBe(true);
  });
});
