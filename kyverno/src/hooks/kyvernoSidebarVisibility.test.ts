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

import { describe, expect, it } from 'vitest';
import { shouldHideSidebarEntry } from './kyvernoSidebarVisibility';
import { KyvernoCRDStatus } from './useKyvernoCRDs';

function status(overrides: Partial<KyvernoCRDStatus>): KyvernoCRDStatus {
  return {
    legacy: false,
    cel: false,
    cleanup: false,
    reports: false,
    exceptions: false,
    kyvernoV2Reports: false,
    ephemeralReports: false,
    loading: false,
    ...overrides,
  };
}

describe('shouldHideSidebarEntry', () => {
  it('stays visible when the cluster has not been probed yet', () => {
    expect(shouldHideSidebarEntry(undefined, 'cleanup')).toBe(false);
  });

  it('stays visible while the probe is still in flight, even if the group is false', () => {
    expect(shouldHideSidebarEntry(status({ loading: true, cleanup: false }), 'cleanup')).toBe(
      false
    );
  });

  it('hides once the probe resolved and the required group is absent', () => {
    expect(shouldHideSidebarEntry(status({ cleanup: false }), 'cleanup')).toBe(true);
  });

  it('stays visible once the probe resolved and the required group is present', () => {
    expect(shouldHideSidebarEntry(status({ cleanup: true }), 'cleanup')).toBe(false);
  });

  it('checks the specific group asked for, not any other group on the same status', () => {
    const s = status({ legacy: true, cleanup: false });
    expect(shouldHideSidebarEntry(s, 'legacy')).toBe(false);
    expect(shouldHideSidebarEntry(s, 'cleanup')).toBe(true);
  });
});
