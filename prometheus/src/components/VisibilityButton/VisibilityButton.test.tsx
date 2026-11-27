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

import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import store from '@kinvolk/headlamp-plugin/lib/redux/stores/store';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { getConfigStore } from '../../util';
import type { EventingResource } from '../Chart/KnativeEventingChart/eventingTarget';
import { VisibilityButton } from './VisibilityButton';

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const actual = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>();
  return { ...actual, K8s: { ...actual.K8s, useCluster: () => 'alpha' } };
});

const broker = {
  kind: 'Broker',
  jsonData: {
    kind: 'Broker',
    apiVersion: 'eventing.knative.dev/v1',
    metadata: { name: 'default', namespace: 'shop', uid: 'broker-uid' },
  },
} satisfies EventingResource;

const configStore = getConfigStore();

/**
 * Renders the button on a Broker's page while the current cluster is `alpha`.
 *
 * @param cluster - The cluster given to the button.
 * @returns The rendered button.
 */
function renderButton(cluster?: string) {
  return render(
    <Provider store={store}>
      <VisibilityButton resource={broker as KubeObject} cluster={cluster} />
    </Provider>
  );
}

describe('VisibilityButton', () => {
  beforeEach(() => {
    configStore.set({ alpha: { isMetricsEnabled: true }, beta: { isMetricsEnabled: false } });
  });

  test('shows and turns on the metrics of the cluster it is given', async () => {
    renderButton('beta');

    fireEvent.click(await screen.findByRole('button', { name: 'Show Prometheus metrics' }));

    expect(await screen.findByRole('button', { name: 'Hide Prometheus metrics' })).toBeTruthy();
    expect(configStore.get()).toMatchObject({
      alpha: { isMetricsEnabled: true },
      beta: { isMetricsEnabled: true },
    });
  });

  test('uses the current cluster when it is given none', async () => {
    renderButton();

    fireEvent.click(await screen.findByRole('button', { name: 'Hide Prometheus metrics' }));

    expect(await screen.findByRole('button', { name: 'Show Prometheus metrics' })).toBeTruthy();
    expect(configStore.get()).toMatchObject({
      alpha: { isMetricsEnabled: false },
      beta: { isMetricsEnabled: false },
    });
  });
});
