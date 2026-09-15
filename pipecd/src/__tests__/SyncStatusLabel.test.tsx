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

import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SyncStatusLabel } from '../components/SyncStatusLabel';
import type { SyncStatus } from '../types/pipecd';

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  StatusLabel: ({ status, children }: { status: string; children: ReactNode }) => (
    <span data-testid="status-label" data-status={status}>
      {children}
    </span>
  ),
}));

afterEach(() => {
  cleanup();
});

const EXPECTED: Record<SyncStatus, { label: string; level: string }> = {
  UNKNOWN: { label: 'Unknown', level: '' },
  SYNCED: { label: 'Synced', level: 'success' },
  DEPLOYING: { label: 'Deploying', level: 'warning' },
  OUT_OF_SYNC: { label: 'Out of Sync', level: 'warning' },
  INVALID_CONFIG: { label: 'Invalid Config', level: 'error' },
};

describe('SyncStatusLabel', () => {
  it.each(Object.keys(EXPECTED) as SyncStatus[])(
    'renders %s with its label and severity',
    status => {
      render(<SyncStatusLabel status={status} />);
      const label = screen.getByTestId('status-label');

      expect(label.textContent).toBe(EXPECTED[status].label);
      expect(label.getAttribute('data-status')).toBe(EXPECTED[status].level);
    }
  );

  it('defaults to Unknown when status is undefined', () => {
    render(<SyncStatusLabel status={undefined} />);

    expect(screen.getByTestId('status-label').textContent).toBe('Unknown');
  });
});
