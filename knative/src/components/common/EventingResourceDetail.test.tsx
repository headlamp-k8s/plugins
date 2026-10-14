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
import { vi } from 'vitest';
import { isKnativeComponentInstalled } from '../../isKnativeInstalled';
import { EventingResourceDetail } from './EventingResourceDetail';

const context = vi.hoisted(() => ({
  cluster: 'cluster-a' as string | null,
  selectedClusters: ['cluster-a', 'cluster-b'],
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: { useCluster: () => context.cluster },
}));

vi.mock('../../hooks/useClusters', () => ({
  useClusters: () => context.selectedClusters,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ name: 'default', namespace: 'orders' }),
}));

vi.mock('../../isKnativeInstalled', () => ({
  isKnativeComponentInstalled: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  DetailsGrid: ({
    cluster,
    name,
    namespace,
  }: {
    cluster?: string;
    name: string;
    namespace: string;
  }) => <div>{`${cluster}/${namespace}/${name}`}</div>,
}));

vi.mock('./ConditionsSection', () => ({ default: () => null }));

const resourceType = { kind: 'Broker' } as Parameters<
  typeof EventingResourceDetail
>[0]['resourceType'];

/**
 * Renders the detail page of a Broker with no extra rows.
 *
 * @returns The rendered page.
 */
function renderDetail() {
  return render(<EventingResourceDetail resourceType={resourceType} extraInfo={() => []} />);
}

describe('EventingResourceDetail', () => {
  beforeEach(() => {
    context.cluster = 'cluster-a';
    vi.mocked(isKnativeComponentInstalled).mockReset();
    vi.mocked(isKnativeComponentInstalled).mockImplementation(
      async (_component, clusters) =>
        clusters.length > 0 && clusters.every(cluster => cluster === 'cluster-a')
    );
  });

  it('shows details when another selected cluster has no Eventing', async () => {
    renderDetail();

    expect(await screen.findByText('cluster-a/orders/default')).toBeTruthy();
    expect(isKnativeComponentInstalled).toHaveBeenCalledWith('eventing', ['cluster-a']);
  });

  it('shows the banner when the resource cluster has no Eventing', async () => {
    context.cluster = 'cluster-b';
    renderDetail();

    expect(await screen.findByText(/Knative Eventing was not detected/)).toBeTruthy();
    expect(screen.queryByText('cluster-b/orders/default')).toBeNull();
    expect(isKnativeComponentInstalled).toHaveBeenCalledWith('eventing', ['cluster-b']);
  });

  it('shows a spinner while checking the resource cluster', () => {
    vi.mocked(isKnativeComponentInstalled).mockReturnValue(new Promise(() => {}));
    renderDetail();

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.queryByText(/was not detected/)).toBeNull();
    expect(screen.queryByText('cluster-a/orders/default')).toBeNull();
  });

  it('does not fall back to selected clusters when there is no resource cluster', async () => {
    context.cluster = null;
    renderDetail();

    expect(await screen.findByText(/Knative Eventing was not detected/)).toBeTruthy();
    expect(isKnativeComponentInstalled).toHaveBeenCalledWith('eventing', []);
  });

  it('checks the new resource cluster when navigation changes it', async () => {
    const { rerender } = renderDetail();
    expect(await screen.findByText('cluster-a/orders/default')).toBeTruthy();

    context.cluster = 'cluster-b';
    rerender(<EventingResourceDetail resourceType={resourceType} extraInfo={() => []} />);

    expect(await screen.findByText(/Knative Eventing was not detected/)).toBeTruthy();
    expect(screen.queryByText('cluster-a/orders/default')).toBeNull();
    expect(isKnativeComponentInstalled).toHaveBeenLastCalledWith('eventing', ['cluster-b']);
  });
});
