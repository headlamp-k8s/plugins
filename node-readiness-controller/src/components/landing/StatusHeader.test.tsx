/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
        deployment={null}
        deploymentError={{ status: 403 }}
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

  it('omits controller health badge when deployment access is forbidden (403)', () => {
    render(
      <StatusHeader
        totalRules={0}
        deployment={null}
        deploymentError={{ status: 403 }}
        onExploreRules={vi.fn()}
      />
    );

    expect(screen.queryByText('Controller:')).toBeNull();
  });

  it('omits controller health badge when deployment lookup fails with a generic error (e.g. 500)', () => {
    render(
      <StatusHeader
        totalRules={0}
        deployment={null}
        deploymentError={{ status: 500 }}
        onExploreRules={vi.fn()}
      />
    );

    expect(screen.queryByText('Controller:')).toBeNull();
  });

  it('omits controller health badge while deployment is loading (null deployment and null error)', () => {
    render(
      <StatusHeader
        totalRules={0}
        deployment={null}
        deploymentError={null}
        onExploreRules={vi.fn()}
      />
    );

    expect(screen.queryByText('Controller:')).toBeNull();
  });

  it('renders Controller: Not Detected badge when deployment is not found (404)', () => {
    render(
      <StatusHeader
        totalRules={0}
        deployment={null}
        deploymentError={{ status: 404 }}
        onExploreRules={vi.fn()}
      />
    );

    expect(screen.getByText('Controller:')).toBeInTheDocument();
    expect(screen.getByText('Not Detected')).toBeInTheDocument();
    expect(screen.getByTestId('status-label-warning')).toHaveTextContent('Not Detected');
  });

  it('renders Controller: Running badge when deployment readyReplicas > 0', () => {
    render(
      <StatusHeader
        totalRules={0}
        deployment={{ status: { readyReplicas: 2 } }}
        deploymentError={null}
        onExploreRules={vi.fn()}
      />
    );

    expect(screen.getByText('Controller:')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getAllByTestId('status-label-success')[1]).toHaveTextContent('Running');
  });

  it('renders Controller: Stopped badge when deployment readyReplicas === 0', () => {
    render(
      <StatusHeader
        totalRules={0}
        deployment={{ status: { readyReplicas: 0 } }}
        deploymentError={null}
        onExploreRules={vi.fn()}
      />
    );

    expect(screen.getByText('Controller:')).toBeInTheDocument();
    expect(screen.getByText('Stopped')).toBeInTheDocument();
    expect(screen.getByTestId('status-label-error')).toHaveTextContent('Stopped');
  });
});
