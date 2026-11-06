/*
 * Copyright 2026 The Kubernetes Authors
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
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePolicyCounts } from '../hooks/usePolicyCounts';
import { ClusterPolicyReport, PolicyReport } from '../resources/policyReport';
import { Dashboard } from './Dashboard';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  SectionBox: ({ title, children }: { title?: string; children?: ReactNode }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

// config.ts builds a ConfigStore from the Headlamp SDK when it is imported, and
// PolicyEngineHealth pulls in the Prometheus hooks; neither matters to the cards tested here.
vi.mock('../config', () => ({ configStore: { useConfig: () => () => ({}) } }));
vi.mock('./PolicyEngineHealth', () => ({ PolicyEngineHealth: () => null }));

vi.mock('../hooks/usePolicyCounts', () => ({ usePolicyCounts: vi.fn() }));

// The report classes extend KubeObject, which doesn't resolve under vitest (see
// policyImpact.test.ts), so only their useList is stood in for.
vi.mock('../resources/policyReport', () => ({
  PolicyReport: { useList: vi.fn() },
  ClusterPolicyReport: { useList: vi.fn() },
}));

/** The value on the metric card with the given title. */
function cardValue(title: string) {
  return screen.getByText(title).nextElementSibling?.textContent;
}

function mockReportLists(items: unknown[] | null) {
  vi.mocked(PolicyReport.useList).mockReturnValue({ items } as any);
  vi.mocked(ClusterPolicyReport.useList).mockReturnValue({ items } as any);
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the policy counts while the report lists are still loading', () => {
    // A failing report list, e.g. on a CEL-only cluster without the PolicyReport CRDs, stays
    // null while React Query retries it.
    vi.mocked(usePolicyCounts).mockReturnValue({ total: 6, enforce: 0, audit: 3, loading: false });
    mockReportLists(null);

    render(<Dashboard />);

    expect(cardValue('Total Policies')).toBe('6');
    expect(cardValue('Enforce')).toBe('0');
    expect(cardValue('Audit')).toBe('3');
    expect(cardValue('Compliance')).toBe('...');
    expect(screen.queryByText('No reports yet')).toBeNull();
  });

  it('shows compliance and the empty state while the policy counts are still loading', () => {
    vi.mocked(usePolicyCounts).mockReturnValue({ total: 0, enforce: 0, audit: 0, loading: true });
    mockReportLists([]);

    render(<Dashboard />);

    expect(cardValue('Total Policies')).toBe('...');
    expect(cardValue('Enforce')).toBe('...');
    expect(cardValue('Audit')).toBe('...');
    expect(cardValue('Compliance')).toBe('—');
    expect(screen.getByText('No reports yet')).toBeTruthy();
  });
});
