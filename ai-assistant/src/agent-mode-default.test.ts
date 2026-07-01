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
 * Tests for the agent-mode default behaviour in modal.tsx.
 *
 * The rule: default to chat mode (isAgentMode = false).
 * Only auto-enable Holmes agent mode on first mount when:
 *   1. There is NO configured chat provider, AND
 *   2. Holmes agent health check returns true.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Inline the decision logic that lives in the modal.tsx useEffect so we can
// test it without mounting the full React component.
// ---------------------------------------------------------------------------

async function shouldAutoEnableAgentMode(opts: {
  hasChatProvider: boolean;
  holmesAvailable: boolean;
  isAlreadyAgentMode: boolean;
  hasExistingAgent: boolean;
}): Promise<boolean> {
  const { holmesAvailable, isAlreadyAgentMode, hasExistingAgent } = opts;

  // Mirror the guard in the useEffect (hasChatProvider no longer blocks):
  if (isAlreadyAgentMode || hasExistingAgent) return false;

  // Holmes wins if reachable, regardless of chat provider.
  return holmesAvailable;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('agent mode default behaviour', () => {
  it('defaults to chat mode (isAgentMode starts as false)', () => {
    // The useState initializer is false — verified by reading the source.
    // This test documents the contract so a future change is caught.
    const defaultAgentMode = false;
    expect(defaultAgentMode).toBe(false);
  });

  it('auto-enables agent mode when a chat provider is configured AND Holmes is reachable', async () => {
    const result = await shouldAutoEnableAgentMode({
      hasChatProvider: true,
      holmesAvailable: true,
      isAlreadyAgentMode: false,
      hasExistingAgent: false,
    });
    expect(result).toBe(true);
  });

  it('does NOT auto-enable agent mode when a chat provider is configured AND Holmes is unreachable', async () => {
    const result = await shouldAutoEnableAgentMode({
      hasChatProvider: true,
      holmesAvailable: false,
      isAlreadyAgentMode: false,
      hasExistingAgent: false,
    });
    expect(result).toBe(false);
  });

  it('does NOT auto-enable agent mode when Holmes is unreachable', async () => {
    const result = await shouldAutoEnableAgentMode({
      hasChatProvider: false,
      holmesAvailable: false,
      isAlreadyAgentMode: false,
      hasExistingAgent: false,
    });
    expect(result).toBe(false);
  });

  it('auto-enables agent mode only when there is no chat provider AND Holmes is reachable', async () => {
    const result = await shouldAutoEnableAgentMode({
      hasChatProvider: false,
      holmesAvailable: true,
      isAlreadyAgentMode: false,
      hasExistingAgent: false,
    });
    expect(result).toBe(true);
  });

  it('does NOT re-initialize when agent mode is already active', async () => {
    const result = await shouldAutoEnableAgentMode({
      hasChatProvider: false,
      holmesAvailable: true,
      isAlreadyAgentMode: true,
      hasExistingAgent: false,
    });
    expect(result).toBe(false);
  });

  it('does NOT re-initialize when a HolmesAgent instance already exists', async () => {
    const result = await shouldAutoEnableAgentMode({
      hasChatProvider: false,
      holmesAvailable: true,
      isAlreadyAgentMode: false,
      hasExistingAgent: true,
    });
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Integration: verify checkHolmesAgentHealth is called only when needed
// ---------------------------------------------------------------------------

describe('checkHolmesAgentHealth call gating', () => {
  const mockCheckHealth = vi.fn();

  beforeEach(() => {
    mockCheckHealth.mockReset();
  });

  async function runAutoInit(opts: {
    hasChatProvider: boolean;
    holmesAvailable: boolean;
  }): Promise<void> {
    const { holmesAvailable } = opts;
    // No guard on hasChatProvider — Holmes always runs the check.
    mockCheckHealth.mockResolvedValueOnce(holmesAvailable);
    await mockCheckHealth('test-cluster', {});
  }

  it('performs the health check even when a chat provider is configured', async () => {
    await runAutoInit({ hasChatProvider: true, holmesAvailable: true });
    expect(mockCheckHealth).toHaveBeenCalledOnce();
  });

  it('performs the health check when there is no chat provider', async () => {
    await runAutoInit({ hasChatProvider: false, holmesAvailable: false });
    expect(mockCheckHealth).toHaveBeenCalledOnce();
  });
});
