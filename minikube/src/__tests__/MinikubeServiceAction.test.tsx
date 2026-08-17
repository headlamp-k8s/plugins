import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MinikubeServiceAction } from '../MinikubeServiceAction';

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ActionButton: (props: any) => <button aria-label={props.description} onClick={props.onClick} data-testid="action-button" />,
}));

describe('MinikubeServiceAction Component', () => {
  it('returns null if item is missing or not a Service', () => {
    const { container: containerNull } = render(<MinikubeServiceAction item={undefined} />);
    expect(containerNull.firstChild).toBeNull();

    const nonServiceItem = {
      kind: 'Pod',
      getName: () => 'my-pod',
      getNamespace: () => 'default',
    } as any;

    const { container: containerPod } = render(<MinikubeServiceAction item={nonServiceItem} />);
    expect(containerPod.firstChild).toBeNull();
  });

  it('renders ActionButton for Service items', () => {
    const serviceItem = {
      kind: 'Service',
      getName: () => 'my-service',
      getNamespace: () => 'default',
    } as any;

    const { container } = render(<MinikubeServiceAction item={serviceItem} />);
    expect(container.firstChild).not.toBeNull();
  });
});
