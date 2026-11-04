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
import { DeploymentStatusLabel } from '../components/DeploymentStatusLabel';
import type { DeploymentStatus } from '../types/pipecd';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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

const EXPECTED: Record<DeploymentStatus, { label: string; level: string }> = {
  DEPLOYMENT_PENDING: { label: 'Pending', level: '' },
  DEPLOYMENT_PLANNED: { label: 'Planned', level: '' },
  DEPLOYMENT_RUNNING: { label: 'Running', level: 'warning' },
  DEPLOYMENT_ROLLING_BACK: { label: 'Rolling Back', level: 'warning' },
  DEPLOYMENT_SUCCESS: { label: 'Success', level: 'success' },
  DEPLOYMENT_FAILURE: { label: 'Failure', level: 'error' },
  DEPLOYMENT_CANCELLED: { label: 'Cancelled', level: '' },
};

describe('DeploymentStatusLabel', () => {
  it.each(Object.keys(EXPECTED) as DeploymentStatus[])(
    'renders %s with its label and severity',
    status => {
      render(<DeploymentStatusLabel status={status} />);
      const label = screen.getByTestId('status-label');

      expect(label.textContent).toBe(EXPECTED[status].label);
      expect(label.getAttribute('data-status')).toBe(EXPECTED[status].level);
    }
  );

  it('defaults to Pending when status is undefined', () => {
    render(<DeploymentStatusLabel status={undefined} />);

    expect(screen.getByTestId('status-label').textContent).toBe('Pending');
  });
});
