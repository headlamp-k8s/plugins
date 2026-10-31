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

import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KyvernoCRDStatus } from '../hooks/useKyvernoCRDs';
import { ComplianceBadge } from './ComplianceBadge';

const { useCluster, useKyvernoCRDs } = vi.hoisted(() => ({
  useCluster: vi.fn(),
  useKyvernoCRDs: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: { useCluster },
  useTranslation: () => ({ t: (message: string) => message }),
}));

vi.mock('@iconify/react', () => ({ Icon: () => <span /> }));

vi.mock('@mui/material', () => ({
  Badge: ({ children }: { children: ReactNode }) => <>{children}</>,
  Box: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  IconButton: ({ children }: { children: ReactNode }) => <button>{children}</button>,
  Link: ({ children }: { children: ReactNode }) => <button>{children}</button>,
  Menu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../hooks/useKyvernoCRDs', () => ({ useKyvernoCRDs }));

vi.mock('../resources/policyReport', () => ({
  ClusterPolicyReport: { useList: () => ({ items: [] }) },
  PolicyReport: { useList: () => ({ items: [] }) },
}));

vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: vi.fn() }) }));

function status(overrides: Partial<KyvernoCRDStatus>): KyvernoCRDStatus {
  return {
    legacy: true,
    cel: true,
    cleanup: true,
    reports: true,
    exceptions: true,
    ephemeralReports: true,
    celResources: new Set(['validatingpolicies']),
    loading: false,
    ...overrides,
  };
}

describe('ComplianceBadge', () => {
  beforeEach(() => {
    useCluster.mockReturnValue('test-cluster');
    useKyvernoCRDs.mockReset();
  });

  it('renders when CRD discovery is indeterminate', () => {
    useKyvernoCRDs.mockReturnValue(status({ legacy: undefined, reports: undefined }));

    render(<ComplianceBadge />);

    expect(screen.getAllByText('Kyverno Compliance')).not.toHaveLength(0);
  });

  it('hides only when the engine or reports are confirmed absent', () => {
    useKyvernoCRDs.mockReturnValue(status({ legacy: false, cel: false }));

    const { container } = render(<ComplianceBadge />);

    expect(container.innerHTML).toBe('');
  });
});
