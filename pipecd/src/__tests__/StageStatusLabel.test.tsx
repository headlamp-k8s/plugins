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
import { StageStatusLabel } from '../components/StageStatusLabel';
import type { StageStatus } from '../types/pipecd';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? '')),
  }),
}));

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

const EXPECTED: Record<StageStatus, { label: string; level: string }> = {
  STAGE_NOT_STARTED_YET: { label: 'Not Started', level: '' },
  STAGE_RUNNING: { label: 'Running', level: 'warning' },
  STAGE_SUCCESS: { label: 'Success', level: 'success' },
  STAGE_FAILURE: { label: 'Failure', level: 'error' },
  STAGE_CANCELLED: { label: 'Cancelled', level: '' },
  STAGE_SKIPPED: { label: 'Skipped', level: '' },
  STAGE_EXITED: { label: 'Exited', level: '' },
};

describe('StageStatusLabel', () => {
  it.each(Object.keys(EXPECTED) as StageStatus[])(
    'renders %s with its label and severity',
    status => {
      render(<StageStatusLabel status={status} />);
      const label = screen.getByTestId('status-label');

      expect(label.textContent).toBe(EXPECTED[status].label);
      expect(label.getAttribute('data-status')).toBe(EXPECTED[status].level);
    }
  );

  it('defaults to Not Started when status is undefined', () => {
    render(<StageStatusLabel status={undefined} />);

    expect(screen.getByTestId('status-label').textContent).toBe('Not Started');
  });
});
