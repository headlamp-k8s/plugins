/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RuleList from './RuleList';

const { mockResourceListViewProps, mockUseList } = vi.hoisted(() => ({
  mockResourceListViewProps: vi.fn(),
  mockUseList: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: vi.fn().mockReturnValue(
    class MockCRD {
      static useList(...args: any[]) {
        return mockUseList(...args);
      }
    }
  ),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children, routeName, params }: any) => (
    <a href={`#${routeName}`} data-routename={routeName} data-params={JSON.stringify(params)}>
      {children}
    </a>
  ),
  StatusLabel: ({ children, status }: any) => (
    <span data-testid="status-label" data-status={status}>
      {children}
    </span>
  ),
  SectionBox: ({ title, children }: any) => (
    <div data-testid="section-box">
      <h2>{title}</h2>
      {children}
    </div>
  ),
  CreateResourceButton: () => <button data-testid="create-resource-button">Create</button>,
  ResourceListView: (props: any) => {
    mockResourceListViewProps(props);
    return (
      <div data-testid="resource-list-view">
        <h1>{props.title}</h1>
      </div>
    );
  },
}));

describe('RuleList component', () => {
  beforeEach(() => {
    mockUseList.mockReturnValue([[], null]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders ResourceListView with correct title and id', () => {
    render(<RuleList />);

    expect(screen.getByTestId('resource-list-view')).toBeInTheDocument();
    expect(screen.getByText('Node Readiness Rules')).toBeInTheDocument();

    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    expect(lastCall).toBeDefined();
    expect(lastCall.title).toBe('Node Readiness Rules');
    expect(lastCall.id).toBe('nrc-readiness-rules');
    expect(lastCall.resourceClass).toBeDefined();
  });

  it('uses rule.getName() for the name column value and render', () => {
    render(<RuleList />);
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    const nameColumn = lastCall.columns.find((c: any) => c.id === 'name');

    const mockRule = {
      getName: vi.fn().mockReturnValue('my-custom-rule'),
      isDryRun: false,
    } as any;

    expect(nameColumn.getValue(mockRule)).toBe('my-custom-rule');
    expect(mockRule.getName).toHaveBeenCalled();

    const { container } = render(nameColumn.render(mockRule));
    expect(container).toHaveTextContent('my-custom-rule');

    const link = container.querySelector('a');
    expect(link?.getAttribute('data-routename')).toBe('nrc-rule-details');
    expect(link?.getAttribute('data-params')).toBe('{"name":"my-custom-rule"}');
  });

  it('renders a color-neutral Dry Run chip when isDryRun is true', () => {
    render(<RuleList />);
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    const nameColumn = lastCall.columns.find((c: any) => c.id === 'name');

    const mockRule = {
      getName: vi.fn().mockReturnValue('dry-run-rule'),
      isDryRun: true,
    } as any;

    const { container } = render(nameColumn.render(mockRule));
    expect(container).toHaveTextContent('Dry Run');
    const chip = container.querySelector('.MuiChip-colorDefault');
    expect(chip).toBeInTheDocument();
  });

  it('provides a CreateResourceButton in headerProps.titleSideActions', () => {
    render(<RuleList />);
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    expect(lastCall.headerProps?.titleSideActions).toBeDefined();
    expect(lastCall.headerProps.titleSideActions.length).toBeGreaterThan(0);

    const { container } = render(<div>{lastCall.headerProps.titleSideActions}</div>);
    expect(container.querySelector('[data-testid="create-resource-button"]')).toBeInTheDocument();
  });

  it('renders the satisfied nodes column with X/Y ratio and handles dry-run', () => {
    render(<RuleList />);
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];
    const satisfiedColumn = lastCall.columns.find((c: any) => c.id === 'satisfied');
    expect(satisfiedColumn).toBeDefined();

    const mockLiveRule = {
      isDryRun: false,
      status: {
        nodeEvaluations: [
          { nodeName: 'node-1', taintStatus: 'Absent' },
          { nodeName: 'node-2', taintStatus: 'Present' },
        ],
        failedNodes: [],
      },
    } as any;

    expect(satisfiedColumn.getValue(mockLiveRule)).toBe(1);
    expect(satisfiedColumn.sort).toBeDefined();
    const { container } = render(satisfiedColumn.render(mockLiveRule));
    expect(container).toHaveTextContent('1 / 2');

    const mockDryRunRule = {
      isDryRun: true,
      status: {
        dryRunResults: { affectedNodes: 3, taintsToAdd: 1 },
      },
    } as any;

    expect(satisfiedColumn.getValue(mockDryRunRule)).toBe(0);
    const { container: dryContainer } = render(satisfiedColumn.render(mockDryRunRule));
    expect(dryContainer).toHaveTextContent('N/A');

    // Verify sortBySatisfied sorts numerically: 1 (mockLiveRule) > 0 (mockDryRunRule)
    expect(satisfiedColumn.sort(mockLiveRule, mockDryRunRule)).toBeGreaterThan(0);

    const mockPendingDryRun = {
      isDryRun: true,
      status: {},
    } as any;
    expect(satisfiedColumn.getValue(mockPendingDryRun)).toBe(0);
    const { container: pendingContainer } = render(satisfiedColumn.render(mockPendingDryRun));
    expect(pendingContainer).toHaveTextContent('N/A');

    const mockPendingLive = {
      isDryRun: false,
      status: {},
    } as any;
    expect(satisfiedColumn.getValue(mockPendingLive)).toBe(0);
    const { container: livePendingContainer } = render(satisfiedColumn.render(mockPendingLive));
    expect(livePendingContainer).toHaveTextContent('-');
  });

  it('configures filterVariant and filterSelectOptions on status and enforcement columns', () => {
    render(<RuleList />);
    const lastCall = mockResourceListViewProps.mock.calls.at(-1)?.[0];

    const statusCol = lastCall.columns.find((c: any) => c.id === 'status');
    expect(statusCol.filterVariant).toBe('multi-select');
    expect(statusCol.filterSelectOptions).toBeDefined();
    expect(statusCol.filterSelectOptions.some((o: any) => o.value === 'OK')).toBe(true);

    const enforcementCol = lastCall.columns.find((c: any) => c.id === 'enforcement');
    expect(enforcementCol.filterVariant).toBe('multi-select');
    expect(enforcementCol.filterSelectOptions).toBeDefined();
    expect(enforcementCol.filterSelectOptions.some((o: any) => o.value === 'continuous')).toBe(
      true
    );
    expect(enforcementCol.getValue({ enforcementMode: 'continuous' } as any)).toBe('continuous');
    expect(enforcementCol.getValue({ enforcementMode: 'bootstrap-only' } as any)).toBe(
      'bootstrap-only'
    );
  });
});
