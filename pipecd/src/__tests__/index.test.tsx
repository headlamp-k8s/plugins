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
import { describe, expect, it, vi } from 'vitest';

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

  // Custom sidebar icons have to be registered with addIcon and referenced by
  // name, the same way the other plugins in this repository do it.
  it('registers its icon with Iconify before using it', () => {
    expect(vi.mocked(addIcon)).toHaveBeenCalledWith('pipecd:logo', expect.anything());

    const root = vi
      .mocked(registerSidebarEntry)
      .mock.calls.map(call => call[0])
      .find(call => call.name === 'pipecd');

    expect(root?.icon).toBe('pipecd:logo');
  });
});
