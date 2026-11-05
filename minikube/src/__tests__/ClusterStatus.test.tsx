import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import ClusterStatus, { getMinikubeClusterStatus } from '../ClusterStatus';

vi.mock('../CommandCluster/CommandCluster', () => ({
  default: () => null,
}));

describe('getMinikubeClusterStatus', () => {
  it('identifies loading state when error is undefined', () => {
    expect(getMinikubeClusterStatus(undefined)).toBe('loading');
  });

  it('identifies active state when error is null', () => {
    expect(getMinikubeClusterStatus(null)).toBe('active');
  });

  it('identifies auth-error state when error status is 401', () => {
    expect(getMinikubeClusterStatus({ status: 401 })).toBe('auth-error');
  });

  it('identifies permission-error state when error status is 403', () => {
    expect(getMinikubeClusterStatus({ status: 403 })).toBe('permission-error');
  });

  it('identifies unavailable state for other error statuses or objects', () => {
    expect(getMinikubeClusterStatus({ status: 500 })).toBe('unavailable');
    expect(getMinikubeClusterStatus({ status: 503 })).toBe('unavailable');
    expect(getMinikubeClusterStatus({})).toBe('unavailable');
  });
});

describe('ClusterStatus component', () => {
  const cluster = { name: 'minikube' };

  it('renders neutral loading state with no start or stop buttons when status is resolving', () => {
    render(<ClusterStatus cluster={cluster} error={undefined} />);

    expect(screen.getByText('Connecting...')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'start' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'stop' })).toBeNull();
  });

  it('renders Active status with stop button for running cluster', () => {
    render(<ClusterStatus cluster={cluster} error={null} />);

    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'stop' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'start' })).toBeNull();
  });

  it('surfaces Authentication Error without offering start or stop button', () => {
    render(<ClusterStatus cluster={cluster} error={{ status: 401 }} />);

    expect(screen.getByText('Authentication Error')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'start' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'stop' })).toBeNull();
  });

  it('surfaces Permission Error without offering start or stop button', () => {
    render(<ClusterStatus cluster={cluster} error={{ status: 403 }} />);

    expect(screen.getByText('Permission Error')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'start' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'stop' })).toBeNull();
  });

  it('renders Inactive with start button when cluster is unreachable or stopped', () => {
    render(<ClusterStatus cluster={cluster} error={{ status: 503 }} />);

    expect(screen.getByText('Inactive')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'start' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'stop' })).toBeNull();
  });
});
