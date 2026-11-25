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
import { afterEach, expect, test, vi } from 'vitest';
import { usePolicyReportSources } from '../hooks/usePolicyReportSources';
import { KyvernoPolicy } from '../resources/kyvernoPolicy';
import { Dashboard } from './Dashboard';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { error: string }) =>
      options ? key.replace('{{error}}', options.error) : key,
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  SectionBox: ({ title, children }: { title: string; children: ReactNode }) => (
    <section>
      {typeof title === 'string' ? <h2>{title}</h2> : title}
      {children}
    </section>
  ),
  SectionHeader: ({ title }: { title: ReactNode }) => <h2>{title}</h2>,
}));

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: () => null,
}));

vi.mock('../config', () => ({ configStore: { useConfig: () => () => ({}) } }));
vi.mock('./PolicyEngineHealth', () => ({ PolicyEngineHealth: () => null }));
vi.mock('../resources/kyvernoPolicy', () => ({
  KyvernoClusterPolicy: { useList: () => [[], null] },
  KyvernoPolicy: { useList: vi.fn() },
}));
vi.mock('../hooks/usePolicyReportSources', () => ({ usePolicyReportSources: vi.fn() }));

const reports = [
  {
    metadata: { name: 'report' },
    summary: { fail: 1 },
    results: [{ policy: 'enforce-labels', result: 'fail' as const }],
  },
];

afterEach(cleanup);

test('shows settled report counts and charts when policy totals are unavailable', () => {
  vi.mocked(KyvernoPolicy.useList).mockReturnValue([
    null,
    { status: 403, message: 'forbidden' },
  ] as ReturnType<typeof KyvernoPolicy.useList>);
  vi.mocked(usePolicyReportSources).mockReturnValue({ reports, loading: false });

  render(<Dashboard />);

  expect(screen.getByRole('alert').textContent).toContain(
    'Failed to load policy totals: forbidden'
  );
  expect(screen.getByText('Total Policies').nextElementSibling?.textContent).toBe('—');
  expect(screen.getByText('Fail', { selector: 'p' }).nextElementSibling?.textContent).toBe('1');
  expect(screen.getByRole('heading', { name: 'Results by Status' })).toBeTruthy();
});

test('shows settled policy totals while waiting for the remaining report data', () => {
  vi.mocked(KyvernoPolicy.useList).mockReturnValue([[], null] as ReturnType<
    typeof KyvernoPolicy.useList
  >);
  vi.mocked(usePolicyReportSources).mockReturnValue({ reports, loading: true });

  render(<Dashboard />);

  expect(screen.getByText('Total Policies').nextElementSibling?.textContent).toBe('0');
  expect(screen.getByText('Fail', { selector: 'p' }).nextElementSibling?.textContent).toBe('...');
  expect(screen.queryByRole('heading', { name: 'Results by Status' })).toBeNull();
});
