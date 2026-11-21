/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NodeReadinessExtension from './NodeReadinessExtension';

const { mockUseGet } = vi.hoisted(() => ({
  mockUseGet: vi.fn(),
}));

vi.mock('../../resources', () => ({
  NodeReadinessEvaluation: {
    useGet: mockUseGet,
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: React.forwardRef(({ children, url, routeName, params, ...rest }: any, ref: any) => (
    <a
      ref={ref}
      href={url}
      data-routename={routeName}
      data-params={JSON.stringify(params)}
      {...rest}
    >
      {children}
    </a>
  )),
  StatusLabel: ({ children, status }: any) => (
    <span data-testid="status-label" data-status={status}>
      {children}
    </span>
  ),
  SectionBox: ({ title, children }: any) => (
    <div data-testid={`section-${title}`}>
      <h3>{title}</h3>
      {children}
    </div>
  ),
  SimpleTable: ({ columns, data }: any) => (
    <table data-testid="simple-table">
      <tbody>
        {data.map((item: any, idx: number) => (
          <tr key={idx}>
            {columns.map((col: any, colIdx: number) => (
              <td key={colIdx}>{col.getter(item)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe('NodeReadinessExtension component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('silently returns null when node is null or undefined', () => {
    const { container } = render(<NodeReadinessExtension node={null} />);
    expect(container.firstChild).toBeNull();
    expect(mockUseGet).not.toHaveBeenCalled();
  });

  it('silently returns null when NRE returns 404 Not Found (unmanaged node)', () => {
    mockUseGet.mockReturnValue([null, { status: 404 }]);

    const mockNode = {
      metadata: { name: 'unmanaged-node-1' },
      getName: () => 'unmanaged-node-1',
    };

    const { container } = render(<NodeReadinessExtension node={mockNode} />);
    expect(container.firstChild).toBeNull();
    expect(mockUseGet).toHaveBeenCalledWith('unmanaged-node-1');
  });

  it('silently returns null when NRE returns 403 Forbidden', () => {
    mockUseGet.mockReturnValue([null, { status: 403 }]);

    const mockNode = {
      metadata: { name: 'node-forbidden' },
    };

    const { container } = render(<NodeReadinessExtension node={mockNode} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders readiness lifecycle section for an Available node', () => {
    mockUseGet.mockReturnValue([
      {
        state: 'Available',
        status: {
          state: 'Available',
          rules: [
            {
              ruleName: 'rule-cni',
              ruleStatus: 'Satisfied',
              taintStatus: 'Absent',
              enforcementMode: 'continuous',
            },
          ],
        },
        rules: [
          {
            ruleName: 'rule-cni',
            ruleStatus: 'Satisfied',
            taintStatus: 'Absent',
            enforcementMode: 'continuous',
          },
        ],
      },
      null,
    ]);

    const mockNode = {
      metadata: { name: 'worker-node-01' },
      getName: () => 'worker-node-01',
    };

    render(<NodeReadinessExtension node={mockNode} />);

    expect(screen.getByTestId('section-Node Readiness Lifecycle')).toBeInTheDocument();
    expect(screen.getByText('State:')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('OK (1/1)')).toBeInTheDocument();
    expect(screen.getByText('Active Taints:')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
    const viewLink = screen.getByText('View Full Evaluation');
    expect(viewLink).toBeInTheDocument();
    expect(viewLink.closest('a')).toHaveAttribute('data-routename', 'nrc-evaluation-details');
    expect(viewLink.closest('a')).toHaveAttribute(
      'data-params',
      JSON.stringify({ name: 'worker-node-01' })
    );
    expect(screen.getByText('rule-cni')).toBeInTheDocument();
    expect(screen.getByText('Satisfied')).toBeInTheDocument();
  });

  it('renders active NRC taints banner and unsatisfied rules for a NotAvailable node', () => {
    mockUseGet.mockReturnValue([
      {
        state: 'NotAvailable',
        status: {
          state: 'NotAvailable',
          rules: [
            {
              ruleName: 'rule-gpu',
              ruleStatus: 'Unsatisfied',
              taintStatus: 'Present',
              taintKey: 'example.com/gpu-unready',
              taintEffect: 'NoSchedule',
              enforcementMode: 'continuous',
              message: 'GPU driver missing',
            },
          ],
        },
        rules: [
          {
            ruleName: 'rule-gpu',
            ruleStatus: 'Unsatisfied',
            taintStatus: 'Present',
            taintKey: 'example.com/gpu-unready',
            taintEffect: 'NoSchedule',
            enforcementMode: 'continuous',
            message: 'GPU driver missing',
          },
        ],
      },
      null,
    ]);

    const mockNode = {
      metadata: { name: 'worker-node-02' },
      getName: () => 'worker-node-02',
    };

    render(<NodeReadinessExtension node={mockNode} />);

    expect(screen.getAllByText('example.com/gpu-unready:NoSchedule').length).toBeGreaterThanOrEqual(
      1
    );
    expect(screen.getByText('NotAvailable')).toBeInTheDocument();
    expect(screen.getByText('Not Ready (1/1)')).toBeInTheDocument();
    expect(screen.getByText('GPU driver missing')).toBeInTheDocument();
  });

  it('renders loading skeleton while evaluation is fetching to prevent CLS', () => {
    mockUseGet.mockReturnValue([null, null]);

    const mockNode = {
      metadata: { name: 'loading-node' },
    };

    render(<NodeReadinessExtension node={mockNode} />);

    expect(screen.getByTestId('section-Node Readiness Lifecycle')).toBeInTheDocument();
    expect(screen.getByTestId('node-readiness-skeleton')).toBeInTheDocument();
  });
});
