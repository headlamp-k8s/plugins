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

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (text: string) => text }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: () => class {},
}));

// Renders each column of the list for one NodeClaim that belongs to cluster-b, so the test sees
// the links the real columns build.
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  StatusLabel: (props: { children?: React.ReactNode }) => <span>{props.children}</span>,
  Link: (props: {
    routeName: string;
    params: { name: string };
    activeCluster?: string;
    children?: React.ReactNode;
  }) => (
    <a
      href={`/${props.routeName}/${props.params.name}`}
      data-active-cluster={props.activeCluster ?? ''}
    >
      {props.children}
    </a>
  ),
  ResourceListView: (props: {
    columns: Array<string | { render?: (item: any) => React.ReactNode }>;
  }) => {
    const nodeClaim = {
      cluster: 'cluster-b',
      jsonData: {
        metadata: {
          name: 'claim-b',
          labels: {
            'node.kubernetes.io/instance-type': 'm5.large',
            'topology.kubernetes.io/zone': 'us-west-2a',
          },
        },
        spec: { resources: { requests: { cpu: '2' } } },
        status: { conditions: [{ type: 'Launched', reason: 'Launched' }] },
      },
    };
    return (
      <>
        {props.columns.map((column, index) =>
          typeof column === 'object' && column.render ? (
            <div key={index}>{column.render(nodeClaim)}</div>
          ) : null
        )}
      </>
    );
  },
}));

import { ScalingView } from './List';

describe('ScalingView', () => {
  it('opens a NodeClaim in the cluster of that NodeClaim', () => {
    render(<ScalingView />);

    const link = screen.getByRole('link', { name: 'claim-b' });
    expect(link.getAttribute('href')).toBe('/nodeclaims-detail/claim-b');
    expect(link.getAttribute('data-active-cluster')).toBe('cluster-b');
  });
});
