/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ControllerHealthResult } from '../../utils/controllerHealth';
import StatusHeader from './StatusHeader';

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  StatusLabel: ({ status, children }: any) => (
    <span data-testid={`status-label-${status}`}>{children}</span>
  ),
}));

describe('StatusHeader', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders API available status and rule count on explore button', () => {
    const onExploreMock = vi.fn();
    render(
      <StatusHeader
        totalRules={5}
        controllerHealth={{ status: 'forbidden' }}
        onExploreRules={onExploreMock}
      />
    );

    expect(screen.getByText('API Status:')).toBeInTheDocument();
    expect(screen.getByText('API Available')).toBeInTheDocument();
    expect(screen.getByText('readiness.node.x-k8s.io/v1alpha1')).toBeInTheDocument();

    const btn = screen.getByText('Explore All Rules (5)');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onExploreMock).toHaveBeenCalledTimes(1);
  });

  describe('controllerHealth prop', () => {
    it('renders Active (Leader) badge when status is active-leader', () => {
      const health: ControllerHealthResult = {
        active: true,
        reason: 'Active (Leader: nrc-pod-1)',
        status: 'active-leader',
        badgeLabel: 'Active (Leader)',
        badgeStatus: 'success',
        tooltip: 'Leader: nrc-pod-1 • Renewed 5s ago',
      };

      render(<StatusHeader totalRules={0} controllerHealth={health} onExploreRules={vi.fn()} />);

      expect(screen.getByText('Controller:')).toBeInTheDocument();
      expect(screen.getByText('Active (Leader)')).toBeInTheDocument();
      expect(screen.getAllByTestId('status-label-success')[1]).toHaveTextContent('Active (Leader)');
    });

    it('renders Active badge when status is active-deployment', () => {
      const health: ControllerHealthResult = {
        active: true,
        reason: 'Lease access restricted by RBAC; verified via ready deployment replicas',
        status: 'active-deployment',
        badgeLabel: 'Active',
        badgeStatus: 'success',
        tooltip: 'Deployment nrc-manager ready (1 replica)',
      };

      render(<StatusHeader totalRules={0} controllerHealth={health} onExploreRules={vi.fn()} />);

      expect(screen.getByText('Controller:')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getAllByTestId('status-label-success')[1]).toHaveTextContent('Active');
    });

    it('renders Inactive badge when status is inactive', () => {
      const health: ControllerHealthResult = {
        active: false,
        reason: 'Leader lease expired',
        status: 'inactive',
        badgeLabel: 'Inactive',
        badgeStatus: 'error',
        tooltip: 'Leader lease expired (50s ago, threshold 45s)',
      };

      render(<StatusHeader totalRules={0} controllerHealth={health} onExploreRules={vi.fn()} />);

      expect(screen.getByText('Controller:')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByTestId('status-label-error')).toHaveTextContent('Inactive');
    });

    it('renders Not Detected badge when status is not-detected', () => {
      const health: ControllerHealthResult = {
        active: false,
        reason: 'Controller presence could not be determined',
        status: 'not-detected',
        badgeLabel: 'Not Detected',
        badgeStatus: 'warning',
        tooltip: 'Controller lease and deployment not detected',
      };

      render(<StatusHeader totalRules={0} controllerHealth={health} onExploreRules={vi.fn()} />);

      expect(screen.getByText('Controller:')).toBeInTheDocument();
      expect(screen.getByText('Not Detected')).toBeInTheDocument();
      expect(screen.getByTestId('status-label-warning')).toHaveTextContent('Not Detected');
    });

    it('omits controller badge when status is forbidden', () => {
      render(
        <StatusHeader
          totalRules={0}
          controllerHealth={{ status: 'forbidden' }}
          onExploreRules={vi.fn()}
        />
      );

      expect(screen.queryByText('Controller:')).toBeNull();
    });

    it('omits controller badge when status is loading', () => {
      render(
        <StatusHeader
          totalRules={0}
          controllerHealth={{ status: 'loading' }}
          onExploreRules={vi.fn()}
        />
      );

      expect(screen.queryByText('Controller:')).toBeNull();
    });
  });
});
