// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import React, { useContext } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MetricsNamespace, MetricsNamespaceContext } from './MetricsNamespace';

const state = vi.hoisted(() => ({
  cluster: 'one',
  config: {} as Record<string, { namespaceQueryParam?: boolean }>,
}));
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({ K8s: { useCluster: () => state.cluster } }));
vi.mock('../../util', () => ({ getConfigStore: () => ({ useConfig: () => () => state.config }) }));

function Consumer() {
  return <output data-testid="namespace">{useContext(MetricsNamespaceContext) ?? 'unset'}</output>;
}

describe('MetricsNamespace', () => {
  it('uses only the current resource namespace when the selected cluster enables it', () => {
    state.config = {};
    state.cluster = 'one';
    const view = render(
      <MetricsNamespace namespace="tenant-a">
        <Consumer />
      </MetricsNamespace>
    );
    expect(screen.getByTestId('namespace').textContent).toBe('unset');
    state.config = { one: { namespaceQueryParam: true } };
    view.rerender(
      <MetricsNamespace namespace="tenant-a">
        <Consumer />
      </MetricsNamespace>
    );
    expect(screen.getByTestId('namespace').textContent).toBe('tenant-a');
    view.rerender(
      <MetricsNamespace namespace="tenant-b">
        <Consumer />
      </MetricsNamespace>
    );
    expect(screen.getByTestId('namespace').textContent).toBe('tenant-b');
    view.rerender(
      <MetricsNamespace>
        <Consumer />
      </MetricsNamespace>
    );
    expect(screen.getByTestId('namespace').textContent).toBe('unset');
    state.cluster = 'two';
    view.rerender(
      <MetricsNamespace namespace="tenant-a">
        <Consumer />
      </MetricsNamespace>
    );
    expect(screen.getByTestId('namespace').textContent).toBe('unset');
    view.unmount();
  });
});
