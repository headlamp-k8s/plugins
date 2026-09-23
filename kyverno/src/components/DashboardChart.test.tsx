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

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  SectionBox: ({ title, children }: { title: ReactNode; children: ReactNode }) => (
    <section>
      {title}
      {children}
    </section>
  ),
  SectionHeader: ({ title }: { title: ReactNode }) => <h2>{title}</h2>,
}));

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div data-testid="responsive-container">
        {Children.map(children, child =>
          isValidElement(child) ? cloneElement(child, { width: 400, height: 300 } as never) : child
        )}
      </div>
    ),
  };
});

import { AccessibleNamespaceChart, AccessiblePieChart, ChartDataTable } from './DashboardChart';

afterEach(() => {
  cleanup();
});

const statusData = [
  { name: 'Pass', value: 5, color: '#4caf50' },
  { name: 'Fail', value: 2, color: '#f44336' },
  { name: 'Warn', value: 1, color: '#ff9800' },
  { name: 'Error', value: 1, color: '#d32f2f' },
];

const severityData = [
  { name: 'Critical', value: 1, color: '#b71c1c' },
  { name: 'High', value: 3, color: '#d32f2f' },
  { name: 'Medium', value: 3, color: '#ff9800' },
  { name: 'Low', value: 2, color: '#2196f3' },
];

const namespaceData = [
  { name: 'production', pass: 2, failAndError: 2 },
  { name: 'staging', pass: 3, failAndError: 1 },
];

function getChartSurface(container: HTMLElement) {
  const surface = container.querySelector<SVGSVGElement>('svg.recharts-surface');
  expect(surface).not.toBeNull();
  return surface!;
}

function rowValues(name: string) {
  const header = screen.getByRole('rowheader', { name });
  const row = header.closest('tr');
  expect(row).not.toBeNull();
  return within(row!)
    .getAllByRole('cell')
    .map(cell => cell.textContent);
}

describe('ChartDataTable', () => {
  test('exposes captioned rows with exact values', () => {
    render(
      <ChartDataTable
        caption="Compliance by Namespace (Top 10)"
        columns={['Namespace', 'Pass', 'Fail/Error']}
        rows={[
          ['production', 2, 2],
          ['staging', 3, 1],
        ]}
      />
    );

    expect(screen.getByRole('table', { name: 'Compliance by Namespace (Top 10)' })).toBeTruthy();
    expect(rowValues('production')).toEqual(['2', '2']);
    expect(rowValues('staging')).toEqual(['3', '1']);
  });
});

describe('AccessiblePieChart', () => {
  test('names the chart from the visible heading and exposes exact status counts', () => {
    const { container } = render(
      <AccessiblePieChart
        headingId="kyverno-results-by-status-heading"
        title="Results by Status"
        description="Donut chart of policy evaluation results grouped by status."
        data={statusData}
        viewDataLabel="View data"
        nameColumnHeader="Status"
        valueColumnHeader="Count"
      />
    );

    const heading = document.getElementById('kyverno-results-by-status-heading');
    expect(heading?.textContent).toBe('Results by Status');

    const svg = getChartSurface(container);
    expect(svg.querySelector('title')?.textContent).toBe('Results by Status');
    expect(svg.querySelector('desc')?.textContent).toBe(
      'Donut chart of policy evaluation results grouped by status.'
    );
    expect(svg.getAttribute('aria-labelledby')).toBe('kyverno-results-by-status-heading');
    expect(svg.getAttribute('aria-describedby')).toBe('kyverno-results-by-status-heading-desc');
    expect(svg.getAttribute('tabindex')).toBe('0');

    expect(rowValues('Pass')).toEqual(['5']);
    expect(rowValues('Fail')).toEqual(['2']);
    expect(rowValues('Warn')).toEqual(['1']);
    expect(rowValues('Error')).toEqual(['1']);
  });

  test('names the severity chart and keeps slice labels out of the accessibility tree', () => {
    const { container } = render(
      <AccessiblePieChart
        headingId="kyverno-results-by-severity-heading"
        title="Results by Severity"
        description="Donut chart of policy evaluation results grouped by severity."
        data={severityData}
        viewDataLabel="View data"
        nameColumnHeader="Severity"
        valueColumnHeader="Count"
      />
    );

    const svg = getChartSurface(container);
    expect(svg.querySelector('title')?.textContent).toBe('Results by Severity');
    expect(svg.getAttribute('aria-labelledby')).toBe('kyverno-results-by-severity-heading');

    const labels = container.querySelectorAll('text[aria-hidden="true"]');
    expect(labels.length).toBeGreaterThan(0);

    expect(rowValues('Critical')).toEqual(['1']);
    expect(rowValues('High')).toEqual(['3']);
    expect(rowValues('Medium')).toEqual(['3']);
    expect(rowValues('Low')).toEqual(['2']);
  });

  test('moves keyboard focus into the chart without using the unlabeled pie group', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AccessiblePieChart
        headingId="kyverno-results-by-status-heading"
        title="Results by Status"
        description="Donut chart of policy evaluation results grouped by status."
        data={statusData}
        viewDataLabel="View data"
        nameColumnHeader="Status"
        valueColumnHeader="Count"
      />
    );

    const svg = getChartSurface(container);
    const unlabeledPieGroup = container.querySelector<SVGGElement>('g.recharts-pie');
    expect(unlabeledPieGroup?.getAttribute('tabindex')).toBe('-1');

    svg.focus();
    expect(document.activeElement).toBe(svg);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(svg);
  });
});

describe('AccessibleNamespaceChart', () => {
  test('connects the heading to the chart and exposes pass and fail values per namespace', () => {
    const { container } = render(
      <AccessibleNamespaceChart
        headingId="kyverno-compliance-by-namespace-heading"
        title="Compliance by Namespace (Top 10)"
        description="Stacked bar chart of pass and fail or error counts."
        data={namespaceData}
        viewDataLabel="View data"
        namespaceColumnHeader="Namespace"
        passLabel="Pass"
        failErrorLabel="Fail/Error"
        passColor="#4caf50"
        failColor="#f44336"
      />
    );

    const heading = document.getElementById('kyverno-compliance-by-namespace-heading');
    expect(heading?.textContent).toBe('Compliance by Namespace (Top 10)');

    const svg = getChartSurface(container);
    expect(svg.querySelector('title')?.textContent).toBe('Compliance by Namespace (Top 10)');
    expect(svg.querySelector('desc')?.textContent).not.toBe('');
    expect(svg.getAttribute('aria-labelledby')).toBe('kyverno-compliance-by-namespace-heading');
    expect(svg.getAttribute('tabindex')).toBe('0');
    expect(svg.getAttribute('role')).toBe('application');

    expect(rowValues('production')).toEqual(['2', '2']);
    expect(rowValues('staging')).toEqual(['3', '1']);
  });

  test('keyboard focus lands on the named chart and arrow keys reveal the current namespace values', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AccessibleNamespaceChart
        headingId="kyverno-compliance-by-namespace-heading"
        title="Compliance by Namespace (Top 10)"
        description="Stacked bar chart of pass and fail or error counts."
        data={namespaceData}
        viewDataLabel="View data"
        namespaceColumnHeader="Namespace"
        passLabel="Pass"
        failErrorLabel="Fail/Error"
        passColor="#4caf50"
        failColor="#f44336"
      />
    );

    const svg = getChartSurface(container);
    svg.focus();
    expect(document.activeElement).toBe(svg);

    await user.keyboard('{ArrowRight}');

    const tooltip = container.querySelector('.recharts-default-tooltip, .recharts-tooltip-wrapper');
    expect(tooltip).toBeTruthy();
    expect(tooltip?.textContent).toMatch(/production|staging/);
    expect(tooltip?.textContent).toMatch(/Pass/);
    expect(tooltip?.textContent).toMatch(/Fail\/Error/);
  });
});
